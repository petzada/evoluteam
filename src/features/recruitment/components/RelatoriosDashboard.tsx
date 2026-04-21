'use client';

import Link from 'next/link';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type {
  MetricsKpis, FunnelStageRow, OriginBreakdown, StageDuration,
  StalledCandidate, OverdueTask,
  JobOption, EmployeeOption,
} from '../queries/metrics';
import { PageHeader } from '@/components/PageHeader';
import { DashboardFilters } from './dashboard/DashboardFilters';

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

const ORIGIN_COLORS = ['#f97316', '#8b5cf6', '#10b981', '#0ea5e9', '#a3a3a3', '#ef4444', '#eab308'];

export function RelatoriosDashboard({
  kpis, funnel, origins, durations, stalled, overdue, periodLabel,
  jobsForFilter, employeesForFilter, hideManagerFilter,
}: Props) {
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div>
      <PageHeader
        title="Relatórios de Recrutamento"
        description={`Métricas do funil, tempo por etapa, origens e tarefas pendentes. Período: ${periodLabel}.`}
      />

      <DashboardFilters
        jobs={jobsForFilter}
        employees={employeesForFilter}
        hideManagerFilter={hideManagerFilter}
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-5">
        <Kpi
          label="Candidatos ativos"
          value={kpis.activeCandidates.toString()}
          hint={`em ${kpis.activeCandidatesJobCount} ${kpis.activeCandidatesJobCount === 1 ? 'vaga' : 'vagas'}`}
        />
        <Kpi
          label="Contratados"
          value={kpis.hiredInPeriod.toString()}
          hint={periodLabel}
        />
        <Kpi
          label="Tempo até contratação"
          value={kpis.medianTimeToHireDays !== null ? `${kpis.medianTimeToHireDays}d` : '—'}
          hint="mediana"
        />
        <Kpi
          label="Tarefas atrasadas"
          value={kpis.overdueTasks.toString()}
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
                <div key={stage.stageId} className="flex items-center gap-3 text-xs">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Origens dos candidatos</h3>
            {origins.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem dados no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={origins} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(v) => [v as number, 'Candidatos']} />
                  <Bar dataKey="candidates">
                    {origins.map((_, i) => (
                      <Cell key={i} fill={ORIGIN_COLORS[i % ORIGIN_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {origins.some((o) => o.hired > 0) && (
              <div className="mt-3 space-y-1 text-xs">
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Contratados por origem
                </p>
                {origins.filter((o) => o.hired > 0).map((o) => (
                  <div key={o.source} className="flex items-center justify-between">
                    <span>{o.label}</span>
                    <span className="tabular-nums text-emerald-700 font-medium">
                      {o.hired} / {o.candidates} ({Math.round((o.hired / o.candidates) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Tempo mediano por etapa</h3>
            {durations.every((d) => d.medianDays === null) ? (
              <p className="text-xs text-muted-foreground">Sem dados no período.</p>
            ) : (
              <div className="space-y-1.5 pt-2">
                {durations.map((d) => {
                  if (d.medianDays === null) return null;
                  const isBottleneck = d.medianDays > 5;
                  return (
                    <div key={d.stageId} className="flex items-center gap-3 text-xs">
                      <span className="w-32 truncate text-muted-foreground">{d.stageName}</span>
                      <span className={`tabular-nums font-medium ${isBottleneck ? 'text-destructive' : 'text-foreground'}`}>
                        {d.medianDays}d {isBottleneck && '⚠'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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

function Kpi({
  label, value, hint, tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        <p className={`mt-1 text-2xl font-bold tabular-nums ${tone === 'danger' ? 'text-destructive' : 'text-foreground'}`}>
          {value}
        </p>
        {hint && <p className="text-[10.5px] text-muted-foreground mt-0.5">{hint}</p>}
      </CardContent>
    </Card>
  );
}
