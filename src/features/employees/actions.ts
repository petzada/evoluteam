'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import { sendEmail } from '@/lib/email';
import { renderEmployeeInvite } from '@/emails/employee-invite';
import { roleLabel } from '@/emails/_lib/role-label';
import { getActor } from '@/features/permissions/actor';
import {
  canDo,
  canInviteAs,
  normalizeScreenPermissions,
} from '@/features/permissions/permissions';
import type { Role, ScreenPermissions } from '@/features/permissions/types';
import type { EmployeeInput, TransferOption } from './schema';
import { TransferOptionSchema } from './schema';
import { validateManagerAssignment } from './validators';
import { resolveCreateEmployeeAccess } from './access';
import type { TablesInsert, TablesUpdate } from '@/lib/supabase/types';

async function getActorContext() {
  const actor = await getActor();
  if (!actor) return null;

  // FT-9: colaboradores.edit cobre CRUD + convite (unificacao de can_invites).
  // canInviteUsers mantem nome por compat com chamadas abaixo, mas a
  // semantica agora e igual a canManageEmployees — ambos verificam o mesmo
  // gate. A diferenca entre "gerencia" e "convida" vira semantica no UI.
  const canManageEmployees = canDo(actor, 'colaboradores', 'edit');
  const canInviteUsers = canDo(actor, 'colaboradores', 'edit');

  return {
    actor,
    user: { id: actor.userId },
    profile: { company_id: actor.companyId, role: actor.role as string },
    canManageEmployees,
    canInviteUsers,
  };
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
  if (!ctx.canManageEmployees) return { error: 'Sem permissão.' };

  const managerError = await assertValidManager(
    employeeId,
    input.managerId ?? null,
    ctx.profile.company_id,
  );
  if (managerError) return { error: managerError };

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from('employees')
    .select('user_id, unit_id, full_name')
    .eq('id', employeeId)
    .eq('company_id', ctx.profile.company_id)
    .single();
  if (!existing) return { error: 'Colaborador não encontrado.' };

  // FT-10: detecta troca de unidade para emitir log dedicado.
  const newUnitId = input.unitId === undefined ? existing.unit_id : (input.unitId ?? null);
  const unitChanged = newUnitId !== existing.unit_id;

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
  if (input.unitId !== undefined) {
    update.unit_id = input.unitId ?? null;
  }
  if (ctx.actor.role === 'admin_rh' && input.internalNotes !== undefined) {
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

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: 'employee.updated',
    entityType: 'employee',
    entityId: employeeId,
  });

  if (unitChanged) {
    const admin = createAdminSupabaseClient();
    const [{ data: unitBefore }, { data: unitAfter }] = await Promise.all([
      existing.unit_id
        ? admin.from('business_units').select('name').eq('id', existing.unit_id).maybeSingle()
        : Promise.resolve({ data: null }),
      newUnitId
        ? admin.from('business_units').select('name').eq('id', newUnitId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    await logActivity({
      companyId: ctx.profile.company_id,
      actorUserId: ctx.user.id,
      action: 'employee.unit_changed',
      entityType: 'employee',
      entityId: employeeId,
      metadata: {
        employee_id: employeeId,
        employee_name: input.fullName ?? existing.full_name,
        unit_id_before: existing.unit_id,
        unit_id_after: newUnitId,
        unit_name_before: (unitBefore as { name: string } | null)?.name ?? null,
        unit_name_after: (unitAfter as { name: string } | null)?.name ?? null,
      },
    });
  }

  revalidatePath('/colaboradores');
  revalidatePath(`/colaboradores/${employeeId}`);
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function createEmployee(input: EmployeeInput) {
  const ctx = await getActorContext();
  if (!ctx) return { error: 'Não autenticado.' };
  if (!ctx.canManageEmployees && !ctx.canInviteUsers) return { error: 'Sem permissão.' };

  const access = resolveCreateEmployeeAccess(ctx.actor, {
    role: input.role as Role,
    screenPermissions: input.screenPermissions,
  });
  if (!access.ok) return { error: access.error };

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
    unit_id: input.unitId ?? null,
    manager_id: input.managerId ?? null,
    hire_date: input.hireDate,
    status: 'active',
  };
  if (ctx.actor.role === 'admin_rh' && input.internalNotes) insert.internal_notes = input.internalNotes;

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
    await sendInviteForEmployee(
      employee.id,
      input.email,
      access.inviteRole,
      ctx.user.id,
      companyId,
      access.screenPermissionsSnapshot,
      input.unitId ?? null,
    );
  }

  revalidatePath('/colaboradores');
  revalidatePath('/dashboard');
  return { ok: true, employeeId: employee.id };
}

async function sendInviteForEmployee(
  employeeId: string,
  email: string,
  role: Role,
  invitedBy: string,
  companyId: string,
  screenPermissionsSnapshot: EmployeeInput['screenPermissions'] | null = null,
  unitId: string | null = null,
) {
  const admin = createAdminSupabaseClient();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error: invErr } = await admin
    .from('invites')
    .insert({
      company_id: companyId,
      employee_id: employeeId,
      email,
      token,
      role,
      invited_by: invitedBy,
      expires_at: expiresAt,
      screen_permissions: screenPermissionsSnapshot ?? null,
      // FT-10: snapshot da unidade no convite. Copiada para employees.unit_id
      // pelo acceptInvite (mesmo padrao do screen_permissions).
      unit_id: unitId,
    })
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

  // Best-effort: carrega contexto pro template. Se qualquer query falhar,
  // cai nos fallbacks do template (ver src/emails/employee-invite.tsx).
  const [employeeRes, companyRes, inviterRes] = await Promise.all([
    admin.from('employees').select('full_name').eq('id', employeeId).maybeSingle(),
    admin.from('companies').select('name').eq('id', companyId).maybeSingle(),
    admin.from('profiles').select('full_name').eq('id', invitedBy).maybeSingle(),
  ]);

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const result = await sendEmail({
    to: email,
    ...(await renderEmployeeInvite({
      inviteUrl: `${origin}/convite/${token}`,
      inviteeName: employeeRes.data?.full_name ?? undefined,
      inviterName: inviterRes.data?.full_name ?? undefined,
      companyName: companyRes.data?.name ?? undefined,
      roleLabel: roleLabel(role),
      expiresAt: new Date(expiresAt),
    })),
  });
  return { emailSent: result.ok };
}

export async function resendInvite(employeeId: string) {
  const ctx = await getActorContext();
  if (!ctx || (!ctx.canManageEmployees && !ctx.canInviteUsers)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const companyId = ctx.profile.company_id;

  const { data: employee } = await admin
    .from('employees')
    .select('email, user_id')
    .eq('id', employeeId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (!employee) return { error: 'Colaborador não encontrado.' };

  let targetRole: Role = 'user';
  if (employee.user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', employee.user_id)
      .eq('company_id', companyId)
      .maybeSingle();
    targetRole = (profile?.role as Role | undefined) ?? 'user';
  } else {
    const { data: latestInvite } = await admin
      .from('invites')
      .select('role')
      .eq('employee_id', employeeId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    targetRole = (latestInvite?.role as Role | undefined) ?? 'user';
  }

  if (!canInviteAs(ctx.actor, targetRole)) {
    return { error: 'Sem permissão para reenviar convite deste perfil.' };
  }

  await admin
    .from('invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('employee_id', employeeId)
    .is('accepted_at', null)
    .is('revoked_at', null);

  const result = await sendInviteForEmployee(employeeId, employee.email, targetRole, ctx.user.id, companyId);

  await logActivity({ companyId, actorUserId: ctx.user.id, action: 'invite.resent', entityType: 'employee', entityId: employeeId });

  revalidatePath('/colaboradores');
  return result.emailSent ? { ok: true } : { ok: true, warning: 'Convite criado, mas o e-mail falhou ao enviar.' };
}

export async function revokeInvite(inviteId: string) {
  const ctx = await getActorContext();
  if (!ctx || (!ctx.canManageEmployees && !ctx.canInviteUsers)) return { error: 'Sem permissão.' };

  const supabase = await createServerSupabaseClient();
  const { data: invite } = await supabase
    .from('invites')
    .select('id, role, company_id')
    .eq('id', inviteId)
    .maybeSingle();
  if (!invite || invite.company_id !== ctx.profile.company_id) {
    return { error: 'Convite não encontrado.' };
  }
  if (!canInviteAs(ctx.actor, invite.role as Role)) {
    return { error: 'Sem permissão para revogar este convite.' };
  }

  await supabase
    .from('invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', inviteId)
    .eq('company_id', ctx.profile.company_id);

  await logActivity({ companyId: ctx.profile.company_id, actorUserId: ctx.user.id, action: 'invite.revoked', entityType: 'invite', entityId: inviteId });

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
  if (!ctx || !ctx.canManageEmployees) return { error: 'Sem permissão.' };

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
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function reactivateEmployee(employeeId: string) {
  const ctx = await getActorContext();
  if (!ctx || !ctx.canManageEmployees) return { error: 'Sem permissão.' };

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
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function terminateEmployee(
  employeeId: string,
  transferOption?: TransferOption,
) {
  const ctx = await getActorContext();
  if (!ctx || !ctx.canManageEmployees) return { error: 'Sem permissão.' };

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
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function acceptInvite(token: string, data: { fullName: string; password: string }) {
  const admin = createAdminSupabaseClient();

  const { data: invite } = await admin
    .from('invites')
    .select('id, company_id, employee_id, email, role, expires_at, accepted_at, revoked_at, invited_by, screen_permissions, unit_id')
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
    role: invite.role as Role,
    full_name: data.fullName,
  });

  // FT-9: aplica toggles por tela pre-configurados no convite. O trigger
  // sync_screen_permissions_on_role_change ja criou user_screen_permissions
  // vazio quando role='user' foi setado; aqui apenas upsert com o snapshot.
  if (invite.role === 'user' && invite.screen_permissions) {
    const permissions = normalizeScreenPermissions(
      invite.screen_permissions as ScreenPermissions,
    );
    await admin
      .from('user_screen_permissions')
      .upsert({
        profile_id: userId,
        company_id: invite.company_id,
        permissions,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });
  }

  // FT-10: cobre dois casos —
  // 1. employee criado via createEmployee ja gravou unit_id; aqui so reforca
  //    o snapshot do convite (idempotente);
  // 2. employee preexistente (legado) sem unit_id ganha o do invite.
  // Em ambos, se o invite foi com unidade definida, o employee fica com a tag.
  const employeeUpdate: TablesUpdate<'employees'> = {
    user_id: userId,
    full_name: data.fullName,
    updated_at: new Date().toISOString(),
  };
  if (invite.unit_id) {
    employeeUpdate.unit_id = invite.unit_id;
  }

  // Pre-leitura para detectar unit_changed (caso o employee ja tinha outra unit).
  const { data: priorEmployee } = await admin
    .from('employees')
    .select('unit_id, full_name')
    .eq('id', invite.employee_id)
    .maybeSingle();

  await admin.from('employees').update(employeeUpdate).eq('id', invite.employee_id);

  await admin.from('invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id);

  if (invite.unit_id && priorEmployee && priorEmployee.unit_id !== invite.unit_id) {
    const [{ data: unitBefore }, { data: unitAfter }] = await Promise.all([
      priorEmployee.unit_id
        ? admin.from('business_units').select('name').eq('id', priorEmployee.unit_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from('business_units').select('name').eq('id', invite.unit_id).maybeSingle(),
    ]);
    await logActivity({
      companyId: invite.company_id,
      actorUserId: userId,
      action: 'employee.unit_changed',
      entityType: 'employee',
      entityId: invite.employee_id,
      metadata: {
        employee_id: invite.employee_id,
        employee_name: data.fullName,
        unit_id_before: priorEmployee.unit_id,
        unit_id_after: invite.unit_id,
        unit_name_before: (unitBefore as { name: string } | null)?.name ?? null,
        unit_name_after: (unitAfter as { name: string } | null)?.name ?? null,
        source: 'invite_accepted',
      },
    });
  }

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
