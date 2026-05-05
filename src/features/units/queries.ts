import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { cache } from 'react';
import type { BusinessUnit } from './schema';

type Row = BusinessUnit & { created_at: string };

/**
 * Lista unidades do tenant. Inclui arquivadas se opts.includeArchived.
 */
export async function listUnits(
  companyId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<Row[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('business_units')
    .select('id, name, is_archived, created_at')
    .eq('company_id', companyId)
    .order('name');
  if (!opts.includeArchived) query = query.eq('is_archived', false);
  const { data } = await query;
  return (data ?? []) as Row[];
}

/**
 * Variante com cache por request usada em RSC. Mesma assinatura da
 * `getDepartments`/`getPositions`. Apenas unidades ativas por padrao.
 */
const _getUnitsCached = cache(async (companyId: string, includeArchived: boolean) => {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('business_units')
    .select('id, name, is_archived')
    .eq('company_id', companyId)
    .order('name');
  if (!includeArchived) query = query.eq('is_archived', false);
  const { data } = await query;
  return (data ?? []) as BusinessUnit[];
});

export function getUnits(companyId: string, opts: { includeArchived?: boolean } = {}) {
  return _getUnitsCached(companyId, opts.includeArchived ?? false);
}

export async function getUnitById(unitId: string): Promise<BusinessUnit | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('business_units')
    .select('id, name, is_archived')
    .eq('id', unitId)
    .maybeSingle();
  return (data as BusinessUnit | null) ?? null;
}

/**
 * Conta colaboradores por unidade no tenant. Usado na tela
 * /configuracoes/unidades para mostrar a coluna "Colaboradores".
 */
export async function countEmployeesByUnit(companyId: string): Promise<Record<string, number>> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('employees')
    .select('unit_id')
    .eq('company_id', companyId);
  const map: Record<string, number> = {};
  for (const e of data ?? []) {
    if (!e.unit_id) continue;
    map[e.unit_id] = (map[e.unit_id] ?? 0) + 1;
  }
  return map;
}

export async function listUnitsWithCounts(companyId: string) {
  const rows = await listUnits(companyId, { includeArchived: true });
  const counts = await countEmployeesByUnit(companyId);
  return rows.map((u) => ({ ...u, employeeCount: counts[u.id] ?? 0 }));
}
