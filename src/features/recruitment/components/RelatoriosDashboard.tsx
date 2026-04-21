'use client';

import Link from 'next/link';
import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import type {
  MetricsKpis, FunnelStageRow, OriginBreakdown, StageDuration,
  StalledCandidate, OverdueTask,
  JobOption, EmployeeOption,
} from '../queries/metrics';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { DashboardFilters } from './dashboard/DashboardFilters';
import { DashboardPeriodChips } from './dashboard/DashboardPeriodChips';
import { OriginsDualDonut } from './dashboard/OriginsDualDonut';
import { StageDurationsLollipop } from './dashboard/StageDurationsLollipop';

interface Props {
  kpis: MetricsKpis;
  funnel: FunnelStageRow[];
  origins: OriginBreakdown[];
  durations: StageDuration[];
  stalled: StalledCandidate[];
  overdue: OverdueTask[];
  periodLabel: string;
  jobsForFilter: JobOption[];
  employeesForFilter: EmployeeOption[];
  hideManagerFilter?: boolean;
}

export function RelatoriosDashboard({
  kpis, funnel, origins, durations, stalled, overdue, periodLabel,
  jobsForFilter, employeesForFilter, hideManagerFilter,
}: Props) {
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div>
      <PageHeader
        title="Relatórios de Recrutamento"
        description="Indicadores de gestão de recrutamentos da empresa."
        actions={<DashboardPeriodChips />}
      />

      <DashboardFilters
        jobs={jobsForFilter}
        employees={employeesForFilter}
        hideManagerFilter={hideManagerFilter}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard
          label="Candidatos ativos"
          icon={Users}
          value={kpis.activeCandidates}
          hint={`em ${kpis.activeCandidatesJobCount} ${kpis.activeCandidatesJobCount === 1 ? 'vaga' : 'vagas'}`}
        />
        <KpiCard
          label="Contratados"
          icon={CheckCircle2}
          value={kpis.hiredInPeriod}
          hint={periodLabel}
        />
        <KpiCard
          label="Tempo até contratação"
          icon={Clock}
          value={kpis.medianTimeToHireDays !== null ? `${kpis.medianTimeToHireDays}d` : '—'}
          hint="mediana"
        />
        <KpiCard
          label="Tarefas atrasadas"
          icon={AlertTriangle}
          value={kpis.overdueTasks}
          tone={kpis.overdueTasks > 0 ? 'danger' : 'default'}
        />
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3">Funil de conversão</h3>
          {funnel.length === 0 || funnel.every((f) => f.count === 0) ? (
            <p className="text-xs text-muted-foreground">Sem dados no período.</p>
          ) : (
            <div className="space-y-1.5">
              {funnel.map((stage) => (
                <HoverCard key={stage.stageId}>
                  <HoverCardTrigger
                    render={
                      <div className="flex items-center gap-3 text-xs cursor-default hover:bg-muted/40 rounded px-1 py-0.5 -mx-1 transition-colors">
                        <span className="w-36 truncate text-muted-foreground">{stage.stageName}</span>
                        <div className="flex-1 h-5 bg-muted rounded">
                          <div
                            className="h-full bg-primary rounded flex items-center justify-end px-2 text-primary-foreground text-[10px] font-medium"
                            style={{ width: `${Math.max((stage.count / maxFunnel) * 100, 2)}%` }}
                          >
                            {stage.count > 0 ? stage.count : ''}
                          </div>
                        </div>
                        <span className="w-14 text-right tabular-nums text-muted-foreground">
                          {stage.conversionFromFirst !== null ? `${stage.conversionFromFirst}%` : '—'}
                        </span>
                      </div>
                    }
                  />
                  <HoverCardContent side="right" align="center" className="w-64">
                    <div className="space-y-1.5">
                      <p className="font-semibold text-sm">{stage.stageName}</p>
                      <div className="text-[11px] space-y-0.5">
                        <FunnelRow label="Candidatos na etapa" value={stage.count.toString()} />
                        {stage.conversionFromPrev !== null && (
                          <FunnelRow label="Conversão da anterior" value={`${stage.conversionFromPrev}%`} />
                        )}
                        {stage.conversionFromFirst !== null && (
                          <FunnelRow label="Conversão desde o topo" value={`${stage.conversionFromFirst}%`} />
                        )}
                        <FunnelRow label="Avançaram" value={stage.advancedCount.toString()} />
                        <FunnelRow label="Reprovados/desistiram" value={stage.rejectedOrWithdrawnCount.toString()} />
                        {stage.medianDaysInStage !== null && (
                          <FunnelRow label="Mediana na etapa" value={`${stage.medianDaysInStage}d`} />
                        )}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Origens — candidatos × contratados</h3>
            <OriginsDualDonut origins={origins} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Tempo mediano por etapa (em dias)</h3>
            <StageDurationsLollipop durations={durations} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Candidatos parados &gt; 5d</h3>
            {stalled.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum candidato parado há mais de 5 dias.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidato</TableHead>
                    <TableHead>Vaga · Etapa</TableHead>
                    <TableHead className="text-right">Tempo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stalled.map((s) => (
                    <TableRow key={s.applicationId}>
                      <TableCell className="font-medium">
                        <Link href={`/recrutamento/candidatos/${s.candidateId}`} className="hover:underline">
                          {s.candidateName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.jobTitle} · {s.stageName}
                      </TableCell>
                      <TableCell className="text-right text-amber-700 font-medium tabular-nums">
                        ⚠ {s.daysStalled}d
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Tarefas atrasadas</h3>
            {overdue.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma tarefa atrasada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Vencida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue.map((t) => (
                    <TableRow key={t.taskId}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/recrutamento/candidatos/${t.candidateId}?app=${t.applicationId}#tasks`}
                          className="hover:underline"
                        >
                          {t.title}
                        </Link>
                        <p className="text-[10px] text-muted-foreground">
                          {t.candidateName} · {t.jobTitle}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs">{t.responsibleName}</TableCell>
                      <TableCell className="text-right text-destructive font-medium tabular-nums">
                        -{t.daysOverdue}d
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FunnelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium text-foreground">{value}</span>
    </div>
  );
}
