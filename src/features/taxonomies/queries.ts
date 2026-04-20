import { createServerSupabaseClient } from '@/lib/supabase/server';
import { countEmployeesByDepartment, countEmployeesByPosition } from '@/features/employees/queries';

type Row = { id: string; name: string; is_archived: boolean; created_at: string };

export async function listDepartmentsWithCounts(companyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('departments')
    .select('id, name, is_archived, created_at')
    .eq('company_id', companyId)
    .order('name');
  const counts = await countEmployeesByDepartment(companyId);
  return ((data ?? []) as Row[]).map((d) => ({ ...d, employeeCount: counts[d.id] ?? 0 }));
}

export async function listPositionsWithCounts(companyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('positions')
    .select('id, name, is_archived, created_at')
    .eq('company_id', companyId)
    .order('name');
  const counts = await countEmployeesByPosition(companyId);
  return ((data ?? []) as Row[]).map((p) => ({ ...p, employeeCount: counts[p.id] ?? 0 }));
}
