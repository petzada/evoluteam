'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import { TaskInputSchema, type TaskInput } from '../schema';

type Actor = {
  userId: string;
  companyId: string;
  role: 'admin_rh' | 'director' | 'user';
  employeeId: string | null;
};

async function getActor(): Promise<Actor | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) return null;
  const { data: emp } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();
  return {
    userId: user.id,
    companyId: profile.company_id,
    role: profile.role as Actor['role'],
    employeeId: emp?.id ?? null,
  };
}

async function notifyTaskAssigned(
  actor: Actor,
  taskId: string,
  responsibleEmployeeId: string,
  title: string,
  candidateName: string,
  jobTitle: string,
  dueDate: string | null,
  applicationId: string,
  candidateId: string,
) {
  // Não notifica se o responsável é o próprio criador
  if (responsibleEmployeeId === actor.employeeId) return;
  const admin = createAdminSupabaseClient();
  const { data: resp } = await admin
    .from('employees')
    .select('user_id')
    .eq('id', responsibleEmployeeId)
    .maybeSingle();
  if (!resp?.user_id) return;
  const when = dueDate ? `Prazo: ${dueDate}` : 'Sem prazo';
  await notify({
    companyId: actor.companyId,
    userId: resp.user_id,
    type: 'recruitment.task_assigned',
    title: 'Tarefa atribuída a você',
    body: `Sobre ${candidateName} (${jobTitle}): "${title}". ${when}.`,
    linkUrl: `/recrutamento/candidatos/${candidateId}?app=${applicationId}#tasks`,
    entityType: 'candidate_task',
    entityId: taskId,
  });
}

export async function createTask(applicationId: string, input: TaskInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };
  if (!actor.employeeId) return { error: 'Usuário sem perfil de colaborador.' };

  const parsed = TaskInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const admin = createAdminSupabaseClient();
  const { data: app } = await admin
    .from('job_applications')
    .select(`
      id, company_id, candidate_id, job_opening_id,
      candidate:candidates(name),
      job_opening:job_openings(title, hiring_manager_id)
    `)
    .eq('id', applicationId)
    .maybeSingle();
  if (!app || app.company_id !== actor.companyId) return { error: 'Aplicação não encontrada.' };

  const isAdmin = actor.role === 'admin_rh';
  const hiringManagerId =
    (app.job_opening as unknown as { hiring_manager_id: string | null } | null)?.hiring_manager_id;
  const isManager = hiringManagerId === actor.employeeId;
  if (!isAdmin && !isManager) return { error: 'Sem permissão.' };

  const { data, error } = await admin
    .from('candidate_tasks')
    .insert({
      company_id: actor.companyId,
      application_id: applicationId,
      title: parsed.data.title,
      due_date: parsed.data.due_date || null,
      responsible_id: parsed.data.responsible_id,
      created_by: actor.employeeId,
    })
    .select('id')
    .single();
  if (error || !data) return { error: 'Falha ao criar tarefa.' };

  const candidateName = (app.candidate as unknown as { name: string } | null)?.name ?? '—';
  const jobTitle = (app.job_opening as unknown as { title: string } | null)?.title ?? '—';

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate_task.created',
    entityType: 'candidate_task',
    entityId: data.id,
    metadata: {
      task_id: data.id,
      title: parsed.data.title,
      candidate_name: candidateName,
      job_title: jobTitle,
    },
  });

  await notifyTaskAssigned(
    actor, data.id, parsed.data.responsible_id, parsed.data.title,
    candidateName, jobTitle, parsed.data.due_date ?? null,
    applicationId, app.candidate_id,
  );

  revalidatePath(`/recrutamento/candidatos/${app.candidate_id}`);
  revalidatePath(`/recrutamento/vagas/${app.job_opening_id}`);
  revalidatePath('/recrutamento/relatorios');
  return { id: data.id };
}

export async function updateTask(id: string, input: TaskInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };

  const parsed = TaskInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const admin = createAdminSupabaseClient();
  const { data: task } = await admin
    .from('candidate_tasks')
    .select(`
      id, company_id, application_id, responsible_id, created_by, title,
      application:job_applications(candidate_id, job_opening_id,
        candidate:candidates(name),
        job_opening:job_openings(title, hiring_manager_id))
    `)
    .eq('id', id)
    .maybeSingle();
  if (!task || task.company_id !== actor.companyId) return { error: 'Tarefa não encontrada.' };

  const isAdmin = actor.role === 'admin_rh';
  const isCreator = task.created_by === actor.employeeId;
  const hiringManagerId =
    (task.application as unknown as { job_opening: { hiring_manager_id: string | null } | null } | null)
      ?.job_opening?.hiring_manager_id ?? null;
  const isManager = hiringManagerId === actor.employeeId;
  if (!isAdmin && !isCreator && !isManager) return { error: 'Sem permissão.' };

  const { error } = await admin
    .from('candidate_tasks')
    .update({
      title: parsed.data.title,
      due_date: parsed.data.due_date || null,
      responsible_id: parsed.data.responsible_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { error: 'Falha ao salvar tarefa.' };

  const appInfo = task.application as unknown as {
    candidate_id: string;
    job_opening_id: string;
    candidate: { name: string } | null;
    job_opening: { title: string } | null;
  } | null;

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate_task.updated',
    entityType: 'candidate_task',
    entityId: id,
    metadata: { task_id: id, title: parsed.data.title },
  });

  // Se responsable_id mudou, notifica o novo
  if (parsed.data.responsible_id !== task.responsible_id && appInfo) {
    await notifyTaskAssigned(
      actor, id, parsed.data.responsible_id, parsed.data.title,
      appInfo.candidate?.name ?? '—', appInfo.job_opening?.title ?? '—',
      parsed.data.due_date ?? null, task.application_id, appInfo.candidate_id,
    );
  }

  if (appInfo) {
    revalidatePath(`/recrutamento/candidatos/${appInfo.candidate_id}`);
    revalidatePath(`/recrutamento/vagas/${appInfo.job_opening_id}`);
  }
  revalidatePath('/recrutamento/relatorios');
  return { ok: true };
}

export async function completeTask(id: string) {
  return toggleTask(id, true);
}

export async function reopenTask(id: string) {
  return toggleTask(id, false);
}

async function toggleTask(id: string, complete: boolean) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };

  const admin = createAdminSupabaseClient();
  const { data: task } = await admin
    .from('candidate_tasks')
    .select(`
      id, company_id, application_id, responsible_id, created_by, title,
      application:job_applications(candidate_id, job_opening_id,
        job_opening:job_openings(hiring_manager_id))
    `)
    .eq('id', id)
    .maybeSingle();
  if (!task || task.company_id !== actor.companyId) return { error: 'Tarefa não encontrada.' };

  const isAdmin = actor.role === 'admin_rh';
  const isCreator = task.created_by === actor.employeeId;
  const isResponsible = task.responsible_id === actor.employeeId;
  const hiringManagerId =
    (task.application as unknown as { job_opening: { hiring_manager_id: string | null } | null } | null)
      ?.job_opening?.hiring_manager_id ?? null;
  const isManager = hiringManagerId === actor.employeeId;
  if (!isAdmin && !isCreator && !isResponsible && !isManager) return { error: 'Sem permissão.' };

  const { error } = await admin
    .from('candidate_tasks')
    .update({
      completed_at: complete ? new Date().toISOString() : null,
      completed_by: complete ? actor.employeeId : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { error: 'Falha ao atualizar tarefa.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: complete ? 'candidate_task.completed' : 'candidate_task.reopened',
    entityType: 'candidate_task',
    entityId: id,
    metadata: { task_id: id, title: task.title },
  });

  const appInfo = task.application as unknown as {
    candidate_id: string; job_opening_id: string;
  } | null;
  if (appInfo) {
    revalidatePath(`/recrutamento/candidatos/${appInfo.candidate_id}`);
    revalidatePath(`/recrutamento/vagas/${appInfo.job_opening_id}`);
  }
  revalidatePath('/recrutamento/relatorios');
  return { ok: true };
}

export async function deleteTask(id: string) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };

  const admin = createAdminSupabaseClient();
  const { data: task } = await admin
    .from('candidate_tasks')
    .select(`
      id, company_id, application_id, created_by, title,
      application:job_applications(candidate_id, job_opening_id,
        job_opening:job_openings(hiring_manager_id))
    `)
    .eq('id', id)
    .maybeSingle();
  if (!task || task.company_id !== actor.companyId) return { error: 'Tarefa não encontrada.' };

  const isAdmin = actor.role === 'admin_rh';
  const isCreator = task.created_by === actor.employeeId;
  const hiringManagerId =
    (task.application as unknown as { job_opening: { hiring_manager_id: string | null } | null } | null)
      ?.job_opening?.hiring_manager_id ?? null;
  const isManager = hiringManagerId === actor.employeeId;
  if (!isAdmin && !isCreator && !isManager) {
    return { error: 'Apenas o criador, admin ou gestor da vaga podem excluir.' };
  }

  const { error } = await admin
    .from('candidate_tasks')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: 'Falha ao remover tarefa.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate_task.deleted',
    entityType: 'candidate_task',
    entityId: id,
    metadata: { task_id: id, title: task.title },
  });

  const appInfo = task.application as unknown as {
    candidate_id: string; job_opening_id: string;
  } | null;
  if (appInfo) {
    revalidatePath(`/recrutamento/candidatos/${appInfo.candidate_id}`);
    revalidatePath(`/recrutamento/vagas/${appInfo.job_opening_id}`);
  }
  revalidatePath('/recrutamento/relatorios');
  return { ok: true };
}
