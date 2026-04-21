import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
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

export async function listCompetenciesWithCounts(companyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('competencies')
    .select('id, name, is_archived, created_at')
    .eq('company_id', companyId)
    .order('name');
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return [];

  const admin = createAdminSupabaseClient();
  const ids = rows.map((r) => r.id);

  const [questions, feedbacks, plans] = await Promise.all([
    admin.from('review_questions').select('competency_id')
      .eq('company_id', companyId).in('competency_id', ids),
    admin.from('feedbacks').select('competency_id')
      .eq('company_id', companyId).in('competency_id', ids),
    admin.from('development_plans').select('competency_id')
      .eq('company_id', companyId).in('competency_id', ids),
  ]);

  const usage = new Map<string, number>();
  const add = (list: { competency_id: string | null }[] | null) => {
    for (const r of list ?? []) {
      if (!r.competency_id) continue;
      usage.set(r.competency_id, (usage.get(r.competency_id) ?? 0) + 1);
    }
  };
  add(questions.data);
  add(feedbacks.data);
  add(plans.data);

  return rows.map((c) => ({ ...c, usageCount: usage.get(c.id) ?? 0 }));
}
