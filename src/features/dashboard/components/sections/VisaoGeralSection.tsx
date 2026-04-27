import { Users, Layers, ClipboardList, CheckCircle2 } from 'lucide-react';
import {
  countActiveEmployees,
  countActiveCycles,
  getAssignmentStats,
  type DashboardScope,
} from '@/features/dashboard/queries';
import { KpiCard } from '@/features/dashboard/components/KpiCard';

export async function VisaoGeralSection({
  scope,
  hasCycle,
}: {
  scope: DashboardScope;
  hasCycle: boolean;
}) {
  const [activeEmployees, activeCycles, assignmentStats] = await Promise.all([
    countActiveEmployees(scope),
    countActiveCycles(scope),
    getAssignmentStats(scope),
  ]);

  const pendingTotal = assignmentStats.pending + assignmentStats.inProgress;
  const completion = assignmentStats.completionRate;
  const completionLabel = completion === null ? '—' : `${completion.toFixed(0)}%`;
  const completionTone: 'success' | 'warning' | 'danger' | 'default' =
    completion === null ? 'default'
      : completion >= 80 ? 'success'
        : completion >= 50 ? 'warning'
          : 'danger';
  const cycleIdForLink = scope.cycleId && scope.cycleId !== 'all' ? scope.cycleId : '';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Colaboradores ativos"
        icon={Users}
        value={activeEmployees}
        href="/colaboradores?status=active"
      />
      <KpiCard
        label="Ciclos ativos"
        icon={Layers}
        value={activeCycles}
        href="/avaliacoes?status=in_progress"
      />
      <KpiCard
        label="Avaliações pendentes"
        icon={ClipboardList}
        value={hasCycle ? pendingTotal : '—'}
        hint={hasCycle ? `${assignmentStats.total - assignmentStats.cancelled} no total` : undefined}
        href="/avaliacoes"
      />
      <KpiCard
        label="Taxa de conclusão"
        icon={CheckCircle2}
        value={hasCycle ? completionLabel : '—'}
        tone={completionTone}
        href={cycleIdForLink ? `/avaliacoes/${cycleIdForLink}` : '/avaliacoes'}
      />
    </div>
  );
}

export function VisaoGeralSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg border bg-card shadow-card" />
      ))}
    </div>
  );
}
