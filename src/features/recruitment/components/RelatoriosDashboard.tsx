'use client';

import Link from 'next/link';
import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

/**
 * Interpola verticalmente entre coral-300->500 no topo do funil e
 * coral-600->900 no fundo. Cada etapa tem seu gradiente proprio, progredindo
 * linearmente pelo indice. Intervalo geral: coral-300 -> coral-900.
 */
function getFunnelBarGradient(idx: number, total: number): string {
  if (total <= 1) return 'linear-gradient(180deg, #F09469 0%, #E76F3D 100%)';
  const t = idx / (total - 1);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  // Topo: coral-300 (#F09469) -> coral-600 (#C2410C)
  const tr = lerp(0xf0, 0xc2), tg = lerp(0x94, 0x41), tb = lerp(0x69, 0x0c);
  // Fundo: coral-500 (#E76F3D) -> coral-900 (#7C2D12)
  const br = lerp(0xe7, 0x7c), bg = lerp(0x6f, 0x2d), bb = lerp(0x3d, 0x12);
  return `linear-gradient(180deg, rgb(${tr} ${tg} ${tb}) 0%, rgb(${br} ${bg} ${bb}) 100%)`;
}

export function RelatoriosDashboard({
  kpis, funnel, origins, durations, stalled, overdue, periodLabel,
  jobsForFilter, employeesForFilter, hideManagerFilter,
}: Props) {
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div>
      <PageHeader
        title="Relatórios"
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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Funil de conversão</CardTitle>
        </CardHeader>
        <CardContent>
          {funnel.length === 0 || funnel.every((f) => f.count === 0) ? (
            <p className="text-xs text-muted-foreground">Sem dados no período.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {funnel.map((stage, idx) => (
                <HoverCard key={stage.stageId}>
                  <HoverCardTrigger
                    render={
                      <div className="grid grid-cols-[150px_1fr_88px] items-center gap-3.5 min-h-[42px] cursor-default hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors">
                        <span className="text-xs text-muted-foreground text-right truncate font-medium">
                          {stage.stageName}
                        </span>
                        <div className="flex items-center justify-center h-9">
                          {stage.count > 0 ? (
                            <div
                              className="h-full flex items-center justify-center text-white text-[11.5px] font-bold tabular-nums"
                              style={{
                                width: `${Math.max((stage.count / maxFunnel) * 100, 5)}%`,
                                minWidth: 44,
                                background: getFunnelBarGradient(idx, funnel.length),
                                clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 100%, 0 100%)',
                                textShadow: '0 1px 1px rgba(0,0,0,0.12)',
                              }}
                            >
                              {stage.count}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </div>
                        <span className="text-[15px] font-bold text-[#9A3412] tabular-nums tracking-tight">
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
                        <FunnelRow
                          label="Reprovados"
                          value={
                            stage.rejectionRate !== null
                              ? `${stage.rejectedCount} (${stage.rejectionRate}%)`
                              : stage.rejectedCount.toString()
                          }
                        />
                        <FunnelRow
                          label="Desistentes"
                          value={
                            stage.withdrawalRate !== null
                              ? `${stage.withdrawnCount} (${stage.withdrawalRate}%)`
                              : stage.withdrawnCount.toString()
                          }
                        />
                        {stage.frozenCount > 0 && (
                          <FunnelRow label="Congelados" value={stage.frozenCount.toString()} />
                        )}
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Origens — candidatos × contratados</CardTitle>
          </CardHeader>
          <CardContent>
            <OriginsDualDonut origins={origins} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo mediano por etapa (em dias)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <StageDurationsLollipop durations={durations} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Candidatos parados &gt; 5d</CardTitle>
          </CardHeader>
          <CardContent>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tarefas atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
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
