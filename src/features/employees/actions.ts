'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import { Resend } from 'resend';
import type { EmployeeInput, TransferOption } from './schema';
import { TransferOptionSchema } from './schema';
import { validateManagerAssignment } from './validators';
import type { TablesInsert, TablesUpdate } from '@/lib/supabase/types';

const resend = new Resend(process.env.RESEND_API_KEY);

async function getActorContext() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) return null;
  return { user, profile: profile as { company_id: string; role: string }, supabase };
}

async function assertValidManager(
  employeeId: string | null,
  proposedManagerId: string | null,
  companyId: string,
): Promise<string | null> {
  if (!proposedManagerId) return null;

  const admin = createAdminSupabaseClient();

  const { data: prop } = await admin
    .from('employees')
    .select('id, company_id')
    .eq('id', proposedManagerId)
    .maybeSingle();
  if (!prop || prop.company_id !== companyId) {
    return 'Gestor inválido.';
  }

  let descendantIds: string[] = [];
  if (employeeId) {
    const { data: descendants, error } = await admin
      .rpc('get_employee_descendants', { root_id: employeeId });
    if (error) return null;
    descendantIds = (descendants ?? []).map((x) => x.id);
  }

  const result = validateManagerAssignment({ employeeId, proposedManagerId, descendantIds });
  return result.ok ? null : result.reason;
}

export async function updateEmployee(employeeId: string, input: EmployeeInput) {
  const ctx = await getActorContext();
  if (!ctx) return { error: 'Não autenticado.' };
  if (ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const managerError = await assertValidManager(
    employeeId,
    input.managerId ?? null,
    ctx.profile.company_id,
  );
  if (managerError) return { error: managerError };

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from('employees')
    .select('user_id')
    .eq('id', employeeId)
    .eq('company_id', ctx.profile.company_id)
    .single();
  if (!existing) return { error: 'Colaborador não encontrado.' };

  const update: TablesUpdate<'employees'> = {
    full_name: input.fullName,
    email: input.email,
    phone: input.phone ?? null,
    position_id: input.positionId,
    department_id: input.departmentId ?? null,
    manager_id: input.managerId ?? null,
    hire_date: input.hireDate,
    updated_at: new Date().toISOString(),
  };
  if (input.internalNotes !== undefined) {
    update.internal_notes = input.internalNotes ?? null;
  }

  const { error: updErr } = await supabase
    .from('employees')
    .update(update)
    .eq('id', employeeId)
    .eq('company_id', ctx.profile.company_id);

  if (updErr) {
    if (updErr.code === '23505') return { error: 'E-mail já cadastrado nesta empresa.' };
    return { error: 'Erro ao atualizar colaborador.' };
  }

  if (existing.user_id && existing.user_id !== ctx.user.id) {
    await supabase
      .from('profiles')
      .update({ role: input.role })
      .eq('id', existing.user_id)
      .eq('company_id', ctx.profile.company_id);
  }

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: 'employee.updated',
    entityType: 'employee',
    entityId: employeeId,
  });

  revalidatePath('/colaboradores');
  revalidatePath(`/colaboradores/${employeeId}`);
  return { ok: true };
}

export async function createEmployee(input: EmployeeInput) {
  const ctx = await getActorContext();
  if (!ctx) return { error: 'Não autenticado.' };
  if (ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const managerError = await assertValidManager(
    null,
    input.managerId ?? null,
    ctx.profile.company_id,
  );
  if (managerError) return { error: managerError };

  const admin = createAdminSupabaseClient();
  const companyId = ctx.profile.company_id;

  const insert: TablesInsert<'employees'> = {
    company_id: companyId,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone ?? null,
    position_id: input.positionId,
    department_id: input.departmentId ?? null,
    manager_id: input.managerId ?? null,
    hire_date: input.hireDate,
    status: 'active',
  };
  if (input.internalNotes) insert.internal_notes = input.internalNotes;

  const { data: employee, error: empErr } = await admin
    .from('employees')
    .insert(insert)
    .select('id')
    .single();

  if (empErr) {
    if (empErr.code === '23505') return { error: 'E-mail já cadastrado nesta empresa.' };
    return { error: 'Erro ao criar colaborador.' };
  }

  await logActivity({
    companyId,
    actorUserId: ctx.user.id,
    action: 'employee.created',
    entityType: 'employee',
    entityId: employee.id,
  });

  if (input.sendInvite) {
    await sendInviteForEmployee(employee.id, input.email, input.role, ctx.user.id, companyId);
  }

  revalidatePath('/colaboradores');
  return { ok: true, employeeId: employee.id };
}

async function sendInviteForEmployee(
  employeeId: string,
  email: string,
  role: string,
  invitedBy: string,
  companyId: string,
) {
  const admin = createAdminSupabaseClient();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error: invErr } = await admin
    .from('invites')
    .insert({ company_id: companyId, employee_id: employeeId, email, token, role, invited_by: invitedBy, expires_at: expiresAt })
    .select('id')
    .single();

  if (invErr || !invite) return { emailSent: false };

  await logActivity({
    companyId,
    actorUserId: invitedBy,
    action: 'invite.sent',
    entityType: 'invite',
    entityId: invite.id,
    metadata: { email },
  });

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  try {
    await resend.emails.send({
      from: 'Evoluteam <marcio@marct.co>',
      to: email,
      subject: 'Você foi convidado para o Evoluteam',
      html: `
        <p>Olá,</p>
        <p>Você foi convidado para acessar o Evoluteam.</p>
        <p><a href="${origin}/convite/${token}">Clique aqui para aceitar o convite</a></p>
        <p>O link expira em 7 dias.</p>
      `,
    });
    return { emailSent: true };
  } catch {
    return { emailSent: false };
  }
}

export async function resendInvite(employeeId: string) {
  const ctx = await getActorContext();
  if (!ctx || ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const companyId = ctx.profile.company_id;

  await admin
    .from('invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('employee_id', employeeId)
    .is('accepted_at', null)
    .is('revoked_at', null);

  const { data: employee } = await admin
    .from('employees')
    .select('email')
    .eq('id', employeeId)
    .single();

  if (!employee) return { error: 'Colaborador não encontrado.' };

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('company_id', companyId)
    .maybeSingle();

  const result = await sendInviteForEmployee(employeeId, employee.email, profile?.role ?? 'user', ctx.user.id, companyId);

  await logActivity({ companyId, actorUserId: ctx.user.id, action: 'invite.resent', entityType: 'employee', entityId: employeeId });

  revalidatePath('/colaboradores');
  return result.emailSent ? { ok: true } : { ok: true, warning: 'Convite criado, mas o e-mail falhou ao enviar.' };
}

export async function revokeInvite(inviteId: string) {
  const ctx = await getActorContext();
  if (!ctx || ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const supabase = await createServerSupabaseClient();
  await supabase
    .from('invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', inviteId)
    .eq('company_id', ctx.profile.company_id);

  await logActivity({ companyId: ctx.profile.company_id, actorUserId: ctx.user.id, action: 'invite.revoked', entityType: 'invite', entityId: inviteId });

  revalidatePath('/colaboradores');
  return { ok: true };
}

export async function updateRole(employeeUserId: string, role: 'admin_rh' | 'director' | 'user') {
  const ctx = await getActorContext();
  if (!ctx || ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };
  if (ctx.user.id === employeeUserId) return { error: 'Você não pode alterar o próprio papel.' };

  if (role !== 'admin_rh') {
    const adminCount = await countActiveAdmins(ctx.profile.company_id);
    const { data: target } = await (await createServerSupabaseClient())
      .from('profiles')
      .select('role')
      .eq('id', employeeUserId)
      .single();
    if (target?.role === 'admin_rh' && adminCount <= 1) {
      return { error: 'A empresa precisa de ao menos um administrador.' };
    }
  }

  const supabase = await createServerSupabaseClient();
  await supabase
    .from('profiles')
    .update({ role })
    .eq('id', employeeUserId)
    .eq('company_id', ctx.profile.company_id);

  await logActivity({ companyId: ctx.profile.company_id, actorUserId: ctx.user.id, action: 'user.role_changed', entityType: 'profile', entityId: employeeUserId, metadata: { role } });

  revalidatePath('/colaboradores');
  return { ok: true };
}

async function countActiveAdmins(companyId: string): Promise<number> {
  const admin = createAdminSupabaseClient();
  const { count } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('role', 'admin_rh');
  return count ?? 0;
}

async function transferSubordinates(
  managerId: string,
  option: TransferOption,
  companyId: string,
  actorUserId: string,
) {
  const admin = createAdminSupabaseClient();
  const targetManagerId = option.mode === 'transfer' ? option.newManagerId : null;
  await admin
    .from('employees')
    .update({ manager_id: targetManagerId })
    .eq('manager_id', managerId)
    .eq('company_id', companyId);

  await logActivity({
    companyId,
    actorUserId,
    action: 'employee.updated',
    entityType: 'employee',
    entityId: managerId,
    metadata: { transfer: { toManagerId: targetManagerId } },
  });
}

async function countSubordinates(managerId: string) {
  const admin = createAdminSupabaseClient();
  const { count } = await admin
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('manager_id', managerId);
  return count ?? 0;
}

export async function deactivateEmployee(
  employeeId: string,
  transferOption?: TransferOption,
) {
  const ctx = await getActorContext();
  if (!ctx || ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const supabase = await createServerSupabaseClient();
  const { data: emp } = await supabase
    .from('employees')
    .select('user_id')
    .eq('id', employeeId)
    .eq('company_id', ctx.profile.company_id)
    .single();
  if (!emp) return { error: 'Colaborador não encontrado.' };
  if (emp.user_id === ctx.user.id) return { error: 'Você não pode desativar a si mesmo.' };

  const subCount = await countSubordinates(employeeId);
  if (subCount > 0) {
    if (!transferOption) {
      return { error: 'subordinates', subordinatesCount: subCount };
    }
    const parsed = TransferOptionSchema.safeParse(transferOption);
    if (!parsed.success) return { error: 'Opção de transferência inválida.' };
    await transferSubordinates(employeeId, parsed.data, ctx.profile.company_id, ctx.user.id);
  }

  await supabase
    .from('employees')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', employeeId)
    .eq('company_id', ctx.profile.company_id);

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: 'user.deactivated',
    entityType: 'employee',
    entityId: employeeId,
  });

  revalidatePath('/colaboradores');
  revalidatePath(`/colaboradores/${employeeId}`);
  return { ok: true };
}

export async function reactivateEmployee(employeeId: string) {
  const ctx = await getActorContext();
  if (!ctx || ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const supabase = await createServerSupabaseClient();
  const { data: emp } = await supabase
    .from('employees')
    .select('status')
    .eq('id', employeeId)
    .eq('company_id', ctx.profile.company_id)
    .single();
  if (!emp) return { error: 'Colaborador não encontrado.' };
  if (emp.status === 'terminated') return { error: 'Colaborador desligado não pode ser reativado.' };

  await supabase
    .from('employees')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', employeeId)
    .eq('company_id', ctx.profile.company_id);

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: 'user.activated',
    entityType: 'employee',
    entityId: employeeId,
  });

  revalidatePath('/colaboradores');
  revalidatePath(`/colaboradores/${employeeId}`);
  return { ok: true };
}

export async function terminateEmployee(
  employeeId: string,
  transferOption?: TransferOption,
) {
  const ctx = await getActorContext();
  if (!ctx || ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: emp } = await admin
    .from('employees')
    .select('user_id')
    .eq('id', employeeId)
    .eq('company_id', ctx.profile.company_id)
    .single();
  if (!emp) return { error: 'Colaborador não encontrado.' };
  if (emp.user_id === ctx.user.id) return { error: 'Você não pode desligar a si mesmo.' };

  if (emp.user_id) {
    const { data: prof } = await admin
      .from('profiles')
      .select('role')
      .eq('id', emp.user_id)
      .maybeSingle();
    if (prof?.role === 'admin_rh') {
      const adminCount = await countActiveAdmins(ctx.profile.company_id);
      if (adminCount <= 1) {
        return { error: 'A empresa precisa de ao menos um administrador.' };
      }
    }
  }

  const subCount = await countSubordinates(employeeId);
  if (subCount > 0) {
    if (!transferOption) {
      return { error: 'subordinates', subordinatesCount: subCount };
    }
    const parsed = TransferOptionSchema.safeParse(transferOption);
    if (!parsed.success) return { error: 'Opção de transferência inválida.' };
    await transferSubordinates(employeeId, parsed.data, ctx.profile.company_id, ctx.user.id);
  }

  const now = new Date().toISOString();
  await admin
    .from('employees')
    .update({ status: 'terminated', terminated_at: now, updated_at: now })
    .eq('id', employeeId)
    .eq('company_id', ctx.profile.company_id);

  if (emp.user_id) {
    try {
      await admin.auth.admin.signOut(emp.user_id);
    } catch {
      // best-effort
    }
  }

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: 'employee.terminated',
    entityType: 'employee',
    entityId: employeeId,
  });

  revalidatePath('/colaboradores');
  revalidatePath(`/colaboradores/${employeeId}`);
  return { ok: true };
}

export async function acceptInvite(token: string, data: { fullName: string; password: string }) {
  const admin = createAdminSupabaseClient();

  const { data: invite } = await admin
    .from('invites')
    .select('id, company_id, employee_id, email, role, expires_at, accepted_at, revoked_at, invited_by')
    .eq('token', token)
    .single();

  if (!invite) return { error: 'invalid' };
  if (invite.accepted_at) return { error: 'already_used' };
  if (invite.revoked_at) return { error: 'invalid' };
  if (new Date(invite.expires_at) < new Date()) return { error: 'expired' };

  const { data: newUser, error: authErr } = await admin.auth.admin.createUser({
    email: invite.email,
    password: data.password,
    email_confirm: true,
  });
  if (authErr || !newUser.user) return { error: 'Erro ao criar usuário.' };

  const userId = newUser.user.id;

  await admin.from('profiles').insert({
    id: userId,
    company_id: invite.company_id,
    role: invite.role as 'admin_rh' | 'director' | 'user',
    full_name: data.fullName,
  });

  await admin.from('employees').update({ user_id: userId, full_name: data.fullName, updated_at: new Date().toISOString() }).eq('id', invite.employee_id);

  await admin.from('invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id);

  const { data: adminProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', invite.invited_by)
    .single();

  if (adminProfile) {
    await notify({
      companyId: invite.company_id,
      userId: adminProfile.id,
      type: 'invite_accepted',
      title: `${data.fullName} aceitou o convite`,
      linkUrl: '/colaboradores',
      entityType: 'employee',
      entityId: invite.employee_id,
    });
  }

  await logActivity({
    companyId: invite.company_id,
    actorUserId: userId,
    action: 'invite.accepted',
    entityType: 'invite',
    entityId: invite.id,
    metadata: { email: invite.email },
  });

  return { ok: true, email: invite.email, password: data.password };
}
