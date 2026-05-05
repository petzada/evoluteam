import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { SetAppTopBar } from '@/features/shell/AppTopBarContext';
import { getActorContext } from '@/features/auth/context';
import { getDepartments } from '@/features/employees/queries';
import {
  buildScope,
  listCycleOptions,
} from '@/features/dashboard/queries';
import { canAccessDashboard, canFilterByDepartment } from '@/features/dashboard/permissions';
import { DashboardFilters } from '@/features/dashboard/components/DashboardFilters';
import { MinhaArea } from '@/features/dashboard/components/MinhaArea';
import {
  VisaoGeralSection,
  VisaoGeralSkeleton,
} from '@/features/dashboard/components/sections/VisaoGeralSection';
import {
  DesempenhoSection,
  DesempenhoSkeleton,
} from '@/features/dashboard/components/sections/DesempenhoSection';
import {
  PdiFeedbacksSection,
  PdiFeedbacksSkeleton,
} from '@/features/dashboard/components/sections/PdiFeedbacksSection';
import {
  getMyPendingAssignments,
  getMyOpenPdiActions,
  getMyRecentFeedbacks,
  getMyCurrentPdi,
} from '@/features/dashboard/my-area-queries';

type SearchParams = Promise<{ cycle_id?: string; dept_id?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ctx = await getActorContext();
  const { profile, employee, isManager, gate } = ctx;
  const employeeId = employee?.id ?? null;

  const actor = {
    role: profile.role,
    employeeId,
    isManager,
    ...gate,
  };

  if (!canAccessDashboard(actor)) {
    if (!employeeId) redirect('/colaboradores');

    const firstName = (profile.full_name ?? '').split(/\s+/)[0] ?? '';

    const [assignments, pdiActions, feedbacks, currentPdi] = await Promise.all([
      getMyPendingAssignments(employeeId),
      getMyOpenPdiActions(employeeId),
      getMyRecentFeedbacks(employeeId),
      getMyCurrentPdi(employeeId),
    ]);

    return (
      <MinhaArea
        firstName={firstName}
        assignments={assignments}
        pdiActions={pdiActions}
        feedbacks={feedbacks}
        currentPdi={currentPdi}
      />
    );
  }

  const params = await searchParams;
  const [departments, cycles] = await Promise.all([
    canFilterByDepartment(actor) ? getDepartments(profile.company_id) : Promise.resolve([]),
    listCycleOptions(profile.company_id),
  ]);
  const defaultCycleId = params.cycle_id ?? (cycles.length > 0 ? 'all' : null);
  const selectedDeptId = canFilterByDepartment(actor) ? (params.dept_id ?? null) : null;

  const scope = await buildScope({
    companyId: profile.company_id,
    role: profile.role,
    actorEmployeeId: employeeId,
    screenPermissions: gate.screenPermissions,
    departmentId: selectedDeptId,
    cycleId: defaultCycleId,
  });

  if (!scope) {
    if (employeeId) redirect(`/colaboradores/${employeeId}`);
    redirect('/colaboradores');
  }

  const hasCycle = !!scope.cycleId && cycles.length > 0;

  // Cada Suspense streama independente: shell + filtros aparecem imediatamente,
  // depois cada secao conforme suas 3 queries resolvem.
  return (
    <div>
      <SetAppTopBar
        title="Dashboard"
        actions={
          <DashboardFilters
            cycles={cycles}
            selectedCycleId={scope.cycleId}
            departments={departments}
            selectedDepartmentId={selectedDeptId}
            showDepartmentFilter={canFilterByDepartment(actor)}
          />
        }
      />

      <div className="space-y-8">
        <section aria-labelledby="visao-geral-heading" className="space-y-3">
          <h2 id="visao-geral-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Visão geral
          </h2>
          <Suspense fallback={<VisaoGeralSkeleton />}>
            <VisaoGeralSection scope={scope} hasCycle={hasCycle} />
          </Suspense>
        </section>

        <section aria-labelledby="desempenho-heading" className="space-y-3">
          <h2 id="desempenho-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Desempenho
          </h2>
          <Suspense fallback={<DesempenhoSkeleton />}>
            <DesempenhoSection scope={scope} hasCycle={hasCycle} />
          </Suspense>
        </section>

        <section aria-labelledby="pdi-feedbacks-heading" className="space-y-3">
          <h2 id="pdi-feedbacks-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            PDI &amp; Feedbacks
          </h2>
          <Suspense fallback={<PdiFeedbacksSkeleton />}>
            <PdiFeedbacksSection scope={scope} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
