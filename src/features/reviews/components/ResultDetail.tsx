'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ChevronLeft, Download, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import { releaseResult, hideResult } from '../actions';
import type { ResultOverview, CycleComment } from '../queries';
import type { PlanRow } from '@/features/pdi/queries';
import {
  PdiSheet, type EmployeeOption as PdiEmployeeOption, type CompetencyOption as PdiCompetencyOption,
  type CycleOption as PdiCycleOption,
} from '@/features/pdi/components/PdiSheet';
import { computePdiStatus, pdiStatusColor } from '@/features/pdi/utils';
import { PDI_STATUS_LABELS } from '@/features/pdi/schema';

interface Props {
  cycleId: string;
  cycleName: string;
  employee: {
    id: string;
    full_name: string;
    position: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
  };
  overview: ResultOverview;
  comments: CycleComment[];
  isAdmin: boolean;
  existingPdi: PlanRow | null;
  canCreatePdi: boolean;
  pdiEmployees: PdiEmployeeOption[];
  pdiCompetencies: PdiCompetencyOption[];
  pdiCycles: PdiCycleOption[];
  actorEmployeeId: string | null;
}

export function ResultDetail({
  cycleId, cycleName, employee, overview, comments, isAdmin,
  existingPdi, canCreatePdi, pdiEmployees, pdiCompetencies, pdiCycles, actorEmployeeId,
}: Props) {
  const router = useRouter();
  const [pdiSheetOpen, setPdiSheetOpen] = useState(false);

  async function toggleRelease() {
    const fn = overview.isReleased ? hideResult : releaseResult;
    const r = await fn(cycleId, employee.id);
    if (r.error) toast.error(r.error);
    else {
      toast.success(overview.isReleased ? 'Resultado ocultado.' : 'Resultado liberado.');
      router.refresh();
    }
  }

  const ranked = [...overview.competencyScores]
    .filter((s) => s.avgEffective !== null)
    .sort((a, b) => (b.avgEffective ?? 0) - (a.avgEffective ?? 0));
  const strengths = ranked.slice(0, 3);
  const weaknesses = ranked.slice().reverse().slice(0, Math.min(3, ranked.length));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/avaliacoes/${cycleId}/resultados`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Voltar aos resultados
        </Link>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" disabled>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Exportar PDF
              </Button>
            }
          />
          <TooltipContent>Em breve</TooltipContent>
        </Tooltip>
      </div>

      <div className="mb-6 pb-4 border-b flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Resultado · {cycleName}</p>
          <h1 className="text-xl font-semibold mt-1">{employee.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {employee.position?.name ?? '—'} · {employee.department?.name ?? '—'}
          </p>
        </div>
        {isAdmin && (
          <Button
            variant={overview.isReleased ? 'outline' : 'default'}
            onClick={toggleRelease}
          >
            {overview.isReleased
              ? <><EyeOff className="h-3.5 w-3.5 mr-1.5" /> Ocultar do colaborador</>
              : <><Eye className="h-3.5 w-3.5 mr-1.5" /> Liberar para colaborador</>}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <section className="rounded-md border p-5 bg-primary/5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
              Média geral
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-primary">
                {overview.avgOverall !== null ? overview.avgOverall.toFixed(1) : '—'}
              </span>
              {overview.avgOverall !== null && <span className="text-sm text-muted-foreground">/5</span>}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Baseado em {overview.hasManagerReview ? 'avaliação do gestor' : 'autoavaliação'}.
            </p>
          </section>

          <section className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700 mb-2 inline-flex items-center gap-1">
              <ArrowUp className="h-3 w-3" /> Pontos fortes
            </p>
            {strengths.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Ainda sem competências suficientes.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {strengths.map((s) => (
                  <li key={s.competencyId ?? 'none'} className="flex justify-between items-center">
                    <span>{s.competencyName ?? 'Sem competência'}</span>
                    <span className="font-semibold text-emerald-700">{s.avgEffective?.toFixed(1)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-md border border-amber-200 bg-amber-50/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 mb-2 inline-flex items-center gap-1">
              <ArrowDown className="h-3 w-3" /> Pontos a desenvolver
            </p>
            {weaknesses.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Ainda sem competências suficientes.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {weaknesses.map((s) => (
                  <li key={s.competencyId ?? 'none'} className="flex justify-between items-center">
                    <span>{s.competencyName ?? 'Sem competência'}</span>
                    <span className="font-semibold text-amber-700">{s.avgEffective?.toFixed(1)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {existingPdi ? (
            <Link href={`/pdi/${existingPdi.id}`}>
              <Button variant="outline" className="w-full">Ver PDI deste ciclo</Button>
            </Link>
          ) : canCreatePdi ? (
            <Button variant="outline" className="w-full" onClick={() => setPdiSheetOpen(true)}>
              Criar PDI com este resultado
            </Button>
          ) : null}
        </aside>

        <main className="space-y-6">
          {overview.isReleased ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-3 text-sm inline-flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-700" />
              <span className="text-emerald-900">
                Resultado liberado para o colaborador {overview.releasedAt ? `em ${formatDate(overview.releasedAt)}` : ''}.
              </span>
            </div>
          ) : (
            <div className="rounded-md border border-muted p-3 text-sm inline-flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Oculto do colaborador. {isAdmin ? 'Libere para que ele possa ver.' : ''}
              </span>
            </div>
          )}

          <section>
            <h2 className="text-base font-semibold mb-3">Notas por competência</h2>
            {overview.competencyScores.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sem notas de escala registradas.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-2 font-medium">Competência</th>
                      <th className="text-center p-2 font-medium">Auto</th>
                      <th className="text-center p-2 font-medium">Gestor</th>
                      <th className="text-center p-2 font-medium">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.competencyScores.map((s) => {
                      const delta = (s.avgManager ?? null) !== null && (s.avgSelf ?? null) !== null
                        ? (s.avgManager as number) - (s.avgSelf as number)
                        : null;
                      return (
                        <tr key={s.competencyId ?? 'none'} className="border-t">
                          <td className="p-2">{s.competencyName ?? 'Sem competência'}</td>
                          <td className="p-2 text-center">{s.avgSelf !== null ? s.avgSelf.toFixed(1) : '—'}</td>
                          <td className="p-2 text-center font-medium">{s.avgManager !== null ? s.avgManager.toFixed(1) : '—'}</td>
                          <td className={cn(
                            'p-2 text-center',
                            delta !== null && delta > 0 && 'text-emerald-700',
                            delta !== null && delta < 0 && 'text-destructive',
                          )}>
                            {delta === null ? '—' : (delta > 0 ? '+' : '') + delta.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">PDI gerado</h2>
            {existingPdi ? (
              <Link
                href={`/pdi/${existingPdi.id}`}
                className="block rounded-md border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm line-clamp-2">{existingPdi.objective}</p>
                  {(() => {
                    const computed = computePdiStatus(existingPdi);
                    return (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium shrink-0',
                          pdiStatusColor(computed),
                        )}
                      >
                        {PDI_STATUS_LABELS[computed]}
                      </span>
                    );
                  })()}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {existingPdi.actions_done} de {existingPdi.actions_count} ações concluídas · Prazo {formatDate(existingPdi.due_date)}
                </p>
              </Link>
            ) : canCreatePdi ? (
              <div className="rounded-md border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Transforme este resultado em um plano de desenvolvimento.
                </p>
                <Button onClick={() => setPdiSheetOpen(true)}>
                  Criar PDI com base nesta avaliação
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhum PDI vinculado a este ciclo.</p>
            )}
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">Comentários</h2>
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sem comentários.</p>
            ) : (
              <div className="space-y-4">
                {groupByQuestion(comments).map(([qText, group]) => (
                  <div key={qText} className="rounded-md border p-4">
                    <p className="text-sm font-medium mb-2">{qText}</p>
                    <ul className="space-y-2">
                      {group.map((c, i) => (
                        <li key={i} className="rounded bg-muted/40 p-3">
                          <Badge variant={c.author === 'self' ? 'secondary' : 'default'} className="mb-1">
                            {c.author === 'self' ? 'Autoavaliação' : 'Gestor'}
                          </Badge>
                          <p className="text-sm whitespace-pre-wrap">{c.text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <PdiSheet
        open={pdiSheetOpen}
        onOpenChange={setPdiSheetOpen}
        employees={pdiEmployees}
        competencies={pdiCompetencies}
        cycles={pdiCycles}
        isAdmin={isAdmin}
        actorEmployeeId={actorEmployeeId}
        presetEmployeeId={employee.id}
        presetCycleId={cycleId}
        presetCompetencyId={weaknesses[0]?.competencyId ?? null}
      />
    </div>
  );
}

function groupByQuestion(comments: CycleComment[]): [string, CycleComment[]][] {
  const map = new Map<string, CycleComment[]>();
  for (const c of comments) {
    if (!map.has(c.questionText)) map.set(c.questionText, []);
    map.get(c.questionText)!.push(c);
  }
  return Array.from(map.entries());
}
