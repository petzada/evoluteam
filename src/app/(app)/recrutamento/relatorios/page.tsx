import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getMetricsKpis, getFunnel, getOriginsBreakdown,
  getStageDurations, getStalledCandidates, getOverdueTasks,
} from '@/features/recruitment/queries/metrics';
import { canAccessRecruitmentModule } from '@/features/recruitment/permissions';
import { RelatoriosDashboard } from '@/features/recruitment/components/RelatoriosDashboard';

type SearchParams = Promise<{ period?: string; from?: string; to?: string }>;

type Preset = '7d' | '30d' | '90d' | 'all';

function resolvePeriod(sp: { period?: string; from?: string; to?: string }): {
  from: Date | null;
  to: Date | null;
  label: string;
} {
  if (sp.from && sp.to) {
    const from = new Date(sp.from);
    const to = new Date(sp.to);
    return {
      from,
      to,
      label: `${from.toLocaleDateString('pt-BR')} – ${to.toLocaleDateString('pt-BR')}`,
    };
  }
  const preset = (sp.period as Preset | undefined) ?? '30d';
  if (preset === 'all') return { from: null, to: null, label: 'tudo' };
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to: new Date(), label: `últimos ${days} dias` };
}

export default async function RelatoriosPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const { data: employeeRow } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  const actor = { role: profile.role, employeeId: employeeRow?.id ?? null };
  if (!canAccessRecruitmentModule(actor)) redirect('/dashboard');

  const period = resolvePeriod(sp);
  const filter = {
    companyId: profile.company_id,
    from: period.from,
    to: period.to,
  };

  const [kpis, funnel, origins, durations, stalled, overdue] = await Promise.all([
    getMetricsKpis(filter),
    getFunnel(filter),
    getOriginsBreakdown(filter),
    getStageDurations(filter),
    getStalledCandidates(filter),
    getOverdueTasks(filter),
  ]);

  return (
    <RelatoriosDashboard
      kpis={kpis}
      funnel={funnel}
      origins={origins}
      durations={durations}
      stalled={stalled}
      overdue={overdue}
      periodLabel={period.label}
    />
  );
}
