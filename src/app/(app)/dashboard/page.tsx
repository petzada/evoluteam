import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Layers, ClipboardList, CheckCircle2, Target,
  AlertTriangle, MessageSquare, Sparkles, Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { getActorContext } from '@/features/auth/context';
import { getDepartments } from '@/features/employees/queries';
import {
  buildScope,
  listCycleOptions,
  countActiveEmployees,
  countActiveCycles,
  getAssignmentStats,
  getOverallAverage,
  getAveragePerDepartment,
  getCompetencyAverages,
  countActivePdis,
  countOverduePdis,
  countEmployeesWithoutRecentFeedback,
} from '@/features/dashboard/queries';
import { canAccessDashboard, canFilterByDepartment } from '@/features/dashboard/permissions';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { DashboardFilters } from '@/features/dashboard/components/DashboardFilters';
import { DepartmentBarsChart } from '@/features/dashboard/components/DepartmentBarsChart';
import { CompetencyRadarChart } from '@/features/dashboard/components/CompetencyRadarChart';
import { MinhaArea } from '@/features/dashboard/components/MinhaArea';
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

  const [
    activeEmployees,
    activeCycles,
    assignmentStats,
    overallAvg,
    deptAverages,
    competencyAverages,
    activePdis,
    overduePdis,
    withoutFeedback,
  ] = await Promise.all([
    countActiveEmployees(scope),
    countActiveCycles(scope),
    getAssignmentStats(scope),
    getOverallAverage(scope),
    getAveragePerDepartment(scope),
    getCompetencyAverages(scope),
    countActivePdis(scope),
    countOverduePdis(scope),
    countEmployeesWithoutRecentFeedback(scope),
  ]);

  const hasCycle = !!scope.cycleId && cycles.length > 0;
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
    <div>
      <PageHeader
        title="Dashboard"
        description={scope.role === 'gestor'
          ? 'Indicadores da sua equipe.'
          : 'Indicadores de gestão de pessoas da empresa.'}
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
        </section>

        <section aria-labelledby="desempenho-heading" className="space-y-3">
          <h2 id="desempenho-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Desempenho
          </h2>

          {!hasCycle ? (
            <Card>
              <CardContent className="py-8">
                <EmptyState
                  icon={Sparkles}
                  title="Nenhum ciclo de avaliação criado"
                  description="Crie o primeiro ciclo para começar a acompanhar o desempenho."
                  action={
                    <Link href="/avaliacoes/nova">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar primeiro ciclo
                      </Button>
                    </Link>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">Média por departamento</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {deptAverages.length > 0 ? (
                    <DepartmentBarsChart data={deptAverages} />
                  ) : (
                    <EmptyState
                      icon={Sparkles}
                      title="Nenhuma avaliação concluída"
                      description="As médias aparecerão aqui quando houver respostas submetidas neste ciclo."
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Média geral · Radar de competências</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Média geral deste ciclo</p>
                    <p className="text-3xl font-bold">
                      {overallAvg === null ? '—' : overallAvg.toFixed(2)}
                      {overallAvg !== null && (
                        <span className="ml-1 text-base font-normal text-muted-foreground">/ 5</span>
                      )}
                    </p>
                  </div>
                  {competencyAverages.length > 0 ? (
                    <CompetencyRadarChart data={competencyAverages} />
                  ) : (
                    <EmptyState
                      icon={Sparkles}
                      title="Sem dados de competências"
                      description="As médias por competência aparecerão quando houver respostas neste ciclo."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        <section aria-labelledby="pdi-feedbacks-heading" className="space-y-3">
          <h2 id="pdi-feedbacks-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            PDI &amp; Feedbacks
          </h2>
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
        </section>
      </div>
    </div>
  );
}
