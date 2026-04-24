import { Target, AlertTriangle, MessageSquare } from 'lucide-react';
import {
  countActivePdis,
  countOverduePdis,
  countEmployeesWithoutRecentFeedback,
  type DashboardScope,
} from '@/features/dashboard/queries';
import { KpiCard } from '@/features/dashboard/components/KpiCard';

export async function PdiFeedbacksSection({ scope }: { scope: DashboardScope }) {
  const [activePdis, overduePdis, withoutFeedback] = await Promise.all([
    countActivePdis(scope),
    countOverduePdis(scope),
    countEmployeesWithoutRecentFeedback(scope),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        label="PDIs em andamento"
        icon={Target}
        value={activePdis}
        hint={overduePdis > 0 ? `${overduePdis} atrasado${overduePdis === 1 ? '' : 's'}` : undefined}
        href="/pdi?status=em_andamento"
      />
      <KpiCard
        label="PDIs atrasados"
        icon={AlertTriangle}
        value={overduePdis}
        tone={overduePdis > 0 ? 'danger' : 'default'}
        href="/pdi?status=atrasado"
      />
      <KpiCard
        label="Sem feedback (90d)"
        icon={MessageSquare}
        value={withoutFeedback}
        tone={withoutFeedback > 0 ? 'warning' : 'default'}
        href="/colaboradores?filter=sem_feedback"
      />
    </div>
  );
}

export function PdiFeedbacksSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg border bg-card" />
      ))}
    </div>
  );
}
