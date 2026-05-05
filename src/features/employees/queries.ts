import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cache } from 'react';
import type { Role, ScreenPermissions } from '@/features/permissions/types';

export async function listEmployees(
  companyId: string,
  opts?: { search?: string; scopedIds?: string[] | null; unitIds?: string[] },
) {
  const supabase = await createServerSupabaseClient();

  // FT-10: alias por coluna em `unit:unit_id (...)`. NUNCA usar
  // `business_units!unit_id` — anti-padrao FT-7 (resolve na direcao errada).
  let query = supabase
    .from('employees')
    .select(`
      id, full_name, email, phone, status, hire_date, user_id, manager_id, unit_id, created_at,
      position:positions(id, name),
      department:departments(id, name),
      unit:unit_id(id, name, is_archived),
      manager:manager_id(id, full_name),
      invite:invites(id, token, role, expires_at, accepted_at, revoked_at, created_at)
    `)
    .eq('company_id', companyId)
    .order('full_name');

  if (opts?.search) {
    query = query.or(`full_name.ilike.%${opts.search}%,email.ilike.%${opts.search}%`);
  }

  if (opts?.scopedIds) {
    if (opts.scopedIds.length === 0) return [];
    query = query.in('id', opts.scopedIds);
  }

  // FT-10: filtro multi-valor de unidade. '__none__' representa "Sem unidade"
  // e mapeia para unit_id IS NULL. Combinacoes aplicam OR via .or().
  if (opts?.unitIds && opts.unitIds.length > 0) {
    const ids = opts.unitIds;
    const includesNone = ids.includes('__none__');
    const realIds = ids.filter((v) => v !== '__none__');
    if (includesNone && realIds.length > 0) {
      const list = realIds.map((id) => `"${id}"`).join(',');
      query = query.or(`unit_id.is.null,unit_id.in.(${list})`);
    } else if (includesNone) {
      query = query.is('unit_id', null);
    } else {
      query = query.in('unit_id', realIds);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export type EmployeeFullRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  hire_date: string;
  user_id: string | null;
  terminated_at: string | null;
  internal_notes?: string | null;
  unit_id: string | null;
  created_at: string;
  updated_at: string;
  position: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  unit: { id: string; name: string; is_archived: boolean } | null;
  manager: {
    id: string;
    full_name: string;
    position: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
  } | null;
  invite:
    | { id: string; role: string; expires_at: string; accepted_at: string | null; revoked_at: string | null }[]
    | null;
};

export async function getEmployee(
  id: string,
  opts: { includeInternalNotes?: boolean } = {},
): Promise<EmployeeFullRecord> {
  const supabase = await createServerSupabaseClient();
  const baseCols = `id, full_name, email, phone, status, hire_date, user_id, terminated_at, unit_id, created_at, updated_at,
      position:positions(id, name),
      department:departments(id, name),
      unit:unit_id(id, name, is_archived),
      manager:manager_id(id, full_name, position:positions(id, name), department:departments(id, name)),
      invite:invites(id, role, expires_at, accepted_at, revoked_at)`;
  const cols = opts.includeInternalNotes ? `${baseCols}, internal_notes` : baseCols;

  const { data, error } = await supabase
    .from('employees')
    .select(cols)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as EmployeeFullRecord;
}

const _getPositionsCached = cache(async (companyId: string, includeArchived: boolean) => {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('positions')
    .select('id, name, is_archived')
    .eq('company_id', companyId)
    .order('name');
  if (!includeArchived) query = query.eq('is_archived', false);
  const { data } = await query;
  return data ?? [];
});

export function getPositions(companyId: string, opts: { includeArchived?: boolean } = {}) {
  return _getPositionsCached(companyId, opts.includeArchived ?? false);
}

const _getDepartmentsCached = cache(async (companyId: string, includeArchived: boolean) => {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('departments')
    .select('id, name, is_archived')
    .eq('company_id', companyId)
    .order('name');
  if (!includeArchived) query = query.eq('is_archived', false);
  const { data } = await query;
  return data ?? [];
});

export function getDepartments(companyId: string, opts: { includeArchived?: boolean } = {}) {
  return _getDepartmentsCached(companyId, opts.includeArchived ?? false);
}

export type ProfileAccess = { role: Role; isSupervisor: boolean };
export type ProfileAccessMap = Record<string, ProfileAccess>;

/**
 * Mapa userId -> { role, isSupervisor } para todos os profiles da empresa.
 * `isSupervisor` e UI-only: marca Colaboradores que receberam o toggle
 * `colaboradores.edit` (rotulados como "Supervisor" na lista/perfil).
 */
export const getCompanyProfileAccess = cache(async (companyId: string): Promise<ProfileAccessMap> => {
  const supabase = await createServerSupabaseClient();
  const [{ data: profiles }, { data: perms }] = await Promise.all([
    supabase.from('profiles').select('id, role').eq('company_id', companyId),
    supabase
      .from('user_screen_permissions')
      .select('profile_id, permissions')
      .eq('company_id', companyId),
  ]);

  const supervisorIds = new Set<string>();
  for (const p of perms ?? []) {
    const screenPerms = p.permissions as ScreenPermissions | null;
    if (screenPerms?.['colaboradores.edit'] === true) {
      supervisorIds.add(p.profile_id);
    }
  }

  const map: ProfileAccessMap = {};
  for (const p of profiles ?? []) {
    map[p.id] = {
      role: p.role as Role,
      isSupervisor: supervisorIds.has(p.id),
    };
  }
  return map;
});

export async function getProfile(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, company_id, role, full_name, phone, avatar_url')
    .eq('id', userId)
    .single();
  return data;
}

export async function getEmployeeByUserId(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('employees')
    .select('id, company_id, manager_id')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export const getEmployeeDescendants = cache(async (employeeId: string) => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.rpc('get_employee_descendants', { root_id: employeeId });
  return (data ?? []).map((x) => x.id);
});

export async function getEmployeeAncestors(employeeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.rpc('get_employee_ancestors', { emp_id: employeeId });
  return (data ?? []).map((x) => x.id);
}

export async function getManagerCandidates(companyId: string, excludeEmployeeId?: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('full_name');
  const all = data ?? [];

  if (!excludeEmployeeId) return all;

  const descendants = await getEmployeeDescendants(excludeEmployeeId);
  const blocked = new Set<string>([excludeEmployeeId, ...descendants]);
  return all.filter((e) => !blocked.has(e.id));
}

export async function getDirectReports(managerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('employees')
    .select('id, full_name, position:positions(id, name)')
    .eq('manager_id', managerId)
    .order('full_name');
  return data ?? [];
}

export async function countDirectReports(managerId: string) {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('manager_id', managerId);
  return count ?? 0;
}

export async function getEmployeeActivityLog(
  companyId: string,
  employeeId: string,
  userId?: string | null,
) {
  const supabase = await createServerSupabaseClient();
  const entityIds = userId ? [employeeId, userId] : [employeeId];
  const { data } = await supabase
    .from('activity_logs')
    .select('id, action, entity_type, entity_id, actor_user_id, metadata, created_at')
    .eq('company_id', companyId)
    .in('entity_id', entityIds)
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function getDashboardKpis(companyId: string) {
  const supabase = await createServerSupabaseClient();

  const [{ count: activeCount }, { count: pendingCount }, { count: deptCount }] =
    await Promise.all([
      supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active'),
      supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString()),
      supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_archived', false),
    ]);

  return {
    activeEmployees: activeCount ?? 0,
    pendingInvites: pendingCount ?? 0,
    departments: deptCount ?? 0,
  };
}

export async function countEmployeesByDepartment(companyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('employees')
    .select('department_id')
    .eq('company_id', companyId);
  const map: Record<string, number> = {};
  for (const e of data ?? []) {
    if (!e.department_id) continue;
    map[e.department_id] = (map[e.department_id] ?? 0) + 1;
  }
  return map;
}

export async function countEmployeesByPosition(companyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('employees')
    .select('position_id')
    .eq('company_id', companyId);
  const map: Record<string, number> = {};
  for (const e of data ?? []) {
    if (!e.position_id) continue;
    map[e.position_id] = (map[e.position_id] ?? 0) + 1;
  }
  return map;
}
