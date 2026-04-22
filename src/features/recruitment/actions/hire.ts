'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { getActor } from '@/features/permissions/actor';
import { canHireCandidate } from '../permissions';
import { HireCandidateInputSchema, type HireCandidateInput } from '../schema';
import type { PipelineSnapshotStage } from '../pipeline-snapshot';

export type HireEligibility =
  | { ok: true }
  | {
      ok: false;
      reason: 'CANDIDATE_ALREADY_HIRED';
      hiredEmployeeId: string;
      hiredEmployeeName: string | null;
    }
  | {
      ok: false;
      reason: 'EMAIL_ALREADY_EXISTS';
      existingEmployee: { id: string; name: string; department: string | null };
    }
  | { ok: false; reason: 'UNKNOWN'; message: string };

/**
 * Checagem pre-wizard (Bloqueio A — decisao P20 = A).
 * Valida se candidato pode ser contratado.
 */
export async function checkHireEligibility(applicationId: string): Promise<HireEligibility> {
  const actor = await getActor();
  if (!actor) return { ok: false, reason: 'UNKNOWN', message: 'Nao autenticado.' };
  if (!canHireCandidate(actor)) {
    return { ok: false, reason: 'UNKNOWN', message: 'Sem permissao.' };
  }

  const admin = createAdminSupabaseClient();
  const { data: app } = await admin
    .from('job_applications')
    .select(`
      id, company_id, candidate_id, status,
      candidate:candidates(id, hired_employee_id, name, email)
    `)
    .eq('id', applicationId)
    .maybeSingle();
  if (!app || app.company_id !== actor.companyId) {
    return { ok: false, reason: 'UNKNOWN', message: 'Aplicacao nao encontrada.' };
  }
  if (app.status !== 'in_progress') {
    return { ok: false, reason: 'UNKNOWN', message: 'Aplicacao ja finalizada.' };
  }

  const candidate = app.candidate as unknown as {
    id: string;
    hired_employee_id: string | null;
    name: string;
    email: string;
  } | null;
  if (!candidate) return { ok: false, reason: 'UNKNOWN', message: 'Candidato invalido.' };

  // Bloqueio A — hired_employee_id ja preenchido
  if (candidate.hired_employee_id) {
    const { data: emp } = await admin
      .from('employees')
      .select('id, full_name')
      .eq('id', candidate.hired_employee_id)
      .maybeSingle();
    return {
      ok: false,
      reason: 'CANDIDATE_ALREADY_HIRED',
      hiredEmployeeId: candidate.hired_employee_id,
      hiredEmployeeName: emp?.full_name ?? null,
    };
  }

  return { ok: true };
}

export type HireCandidateResult =
  | { ok: true; employeeId: string; applicationId: string }
  | { ok: false; reason: 'EMAIL_ALREADY_EXISTS'; existingEmployee: { id: string; name: string; department: string | null } }
  | { ok: false; reason: 'CANDIDATE_ALREADY_HIRED'; hiredEmployeeId: string }
  | { ok: false; reason: 'OTHER'; message: string };

/**
 * Server action transacional da contratacao (decisao P17 + P19 + P20).
 */
export async function hireCandidate(
  applicationId: string,
  input: HireCandidateInput,
): Promise<HireCandidateResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, reason: 'OTHER', message: 'Nao autenticado.' };
  if (!canHireCandidate(actor)) return { ok: false, reason: 'OTHER', message: 'Sem permissao.' };

  const parsed = HireCandidateInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: 'OTHER', message: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };
  }
  const v = parsed.data;
  const emailToUse = v.alternativeEmail?.trim() || v.email;

  const admin = createAdminSupabaseClient();

  // Carrega dados completos da aplicacao + candidato + vaga
  const { data: app } = await admin
    .from('job_applications')
    .select(`
      id, company_id, candidate_id, job_opening_id, current_stage_id, status,
      candidate:candidates(id, hired_employee_id, name, email),
      job_opening:job_openings(id, title, pipeline_snapshot)
    `)
    .eq('id', applicationId)
    .maybeSingle();
  if (!app || app.company_id !== actor.companyId) {
    return { ok: false, reason: 'OTHER', message: 'Aplicacao nao encontrada.' };
  }
  if (app.status !== 'in_progress') {
    return { ok: false, reason: 'OTHER', message: 'Aplicacao ja finalizada.' };
  }

  const candidate = app.candidate as unknown as {
    id: string; hired_employee_id: string | null; name: string; email: string;
  } | null;
  if (!candidate) return { ok: false, reason: 'OTHER', message: 'Candidato invalido.' };

  // Bloqueio A — hired_employee_id ja preenchido (P20 = A)
  if (candidate.hired_employee_id) {
    return {
      ok: false,
      reason: 'CANDIDATE_ALREADY_HIRED',
      hiredEmployeeId: candidate.hired_employee_id,
    };
  }

  // Bloqueio B — email conflita com colaborador existente
  const { data: conflictEmp } = await admin
    .from('employees')
    .select('id, full_name, department:departments(name)')
    .eq('company_id', actor.companyId)
    .eq('email', emailToUse)
    .maybeSingle();
  if (conflictEmp) {
    return {
      ok: false,
      reason: 'EMAIL_ALREADY_EXISTS',
      existingEmployee: {
        id: conflictEmp.id,
        name: conflictEmp.full_name,
        department: (conflictEmp.department as unknown as { name: string } | null)?.name ?? null,
      },
    };
  }

  // Etapa "Contratado" (hired_terminal) — vem do snapshot da vaga
  const jobObj = app.job_opening as unknown as {
    id: string; title: string; pipeline_snapshot: PipelineSnapshotStage[] | null;
  } | null;
  const snapshot = (jobObj?.pipeline_snapshot ?? []) as PipelineSnapshotStage[];
  const hiredStage = snapshot.find((s) => s.kind === 'hired_terminal');
  if (!hiredStage) {
    return { ok: false, reason: 'OTHER', message: 'Funil da vaga sem etapa de contratacao.' };
  }

  // 1) Cria employee (user_id=null; convite e manual em Colaboradores)
  const { data: newEmp, error: empErr } = await admin
    .from('employees')
    .insert({
      company_id: actor.companyId,
      full_name: v.name,
      email: emailToUse,
      phone: v.phone ?? null,
      position_id: v.positionId,
      department_id: v.departmentId ?? null,
      manager_id: v.managerId ?? null,
      hire_date: v.hiredAt,
      status: 'active',
      user_id: null,
    })
    .select('id')
    .single();
  if (empErr || !newEmp) {
    return { ok: false, reason: 'OTHER', message: empErr?.message ?? 'Falha ao criar colaborador.' };
  }

  // 2) Marca candidato hired_employee_id
  await admin
    .from('candidates')
    .update({
      hired_employee_id: newEmp.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', candidate.id);

  // 3) Atualiza aplicacao pra hired + Contratado
  const now = new Date().toISOString();
  await admin
    .from('job_applications')
    .update({
      status: 'hired',
      current_stage_id: hiredStage.id,
      stage_entered_at: now,
      updated_at: now,
    })
    .eq('id', applicationId);

  // 4) Stage history
  await admin.from('candidate_stage_history').insert({
    application_id: applicationId,
    from_stage_id: app.current_stage_id,
    to_stage_id: hiredStage.id,
    status_change: { from: 'in_progress', to: 'hired' },
    changed_by: actor.userId,
  });

  const jobTitle = (app.job_opening as unknown as { title: string } | null)?.title ?? '';

  // 5) Outras aplicacoes ativas — arquivar como withdrawn (P19 checkbox)
  let archivedCount = 0;
  if (v.archiveOtherApplications) {
    const { data: others } = await admin
      .from('job_applications')
      .select('id, current_stage_id, job_opening_id')
      .eq('candidate_id', candidate.id)
      .eq('status', 'in_progress')
      .neq('id', applicationId);
    for (const other of others ?? []) {
      await admin
        .from('job_applications')
        .update({
          status: 'withdrawn',
          withdrawal_reason: 'aceitou_outra_proposta',
          reason_other: null,
          updated_at: now,
        })
        .eq('id', other.id);
      await admin.from('candidate_stage_history').insert({
        application_id: other.id,
        from_stage_id: other.current_stage_id,
        to_stage_id: null,
        status_change: { from: 'in_progress', to: 'withdrawn' },
        reason_code: 'aceitou_outra_proposta',
        reason_notes: `Arquivado automaticamente na contratacao em ${jobTitle}.`,
        changed_by: actor.userId,
      });
      await logActivity({
        companyId: actor.companyId,
        actorUserId: actor.userId,
        action: 'application.withdrawn',
        entityType: 'application',
        entityId: other.id,
        metadata: {
          application_id: other.id,
          candidate_name: candidate.name,
          auto: true,
          triggered_by_hire: applicationId,
          reason: 'aceitou_outra_proposta',
        },
      });
      archivedCount += 1;
    }
  }

  // 6) Logs principais
  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'application.hired',
    entityType: 'application',
    entityId: applicationId,
    metadata: {
      application_id: applicationId,
      candidate_name: candidate.name,
      job_title: jobTitle,
      employee_id: newEmp.id,
      archived_other_applications_count: archivedCount,
    },
  });
  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'employee.created',
    entityType: 'employee',
    entityId: newEmp.id,
    metadata: {
      employee_id: newEmp.id,
      name: v.name,
      source: 'recruitment',
      source_application: applicationId,
      source_job_opening: app.job_opening_id,
    },
  });

  revalidatePath(`/recrutamento/vagas/${app.job_opening_id}`);
  revalidatePath(`/recrutamento/candidatos/${candidate.id}`);
  revalidatePath('/colaboradores');
  revalidatePath(`/colaboradores/${newEmp.id}`);
  return { ok: true, employeeId: newEmp.id, applicationId };
}
