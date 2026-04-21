'use client';

import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import type { StageDuration } from '../../queries/metrics';

interface Props {
  durations: StageDuration[];
}

const CHART_HEIGHT = 170;
const PADDING_TOP = 16;

/**
 * Lollipop vertical de tempo mediano por etapa (spec 16 §7.7).
 * Linha fina + círculo no topo com o valor em dias. Gargalo (>5d) em vermelho.
 * Etapas sem dados renderizam um pirulito vazio com "—" pra sinalizar que
 * a etapa existe mas nenhum candidato completou tempo consolidado nela.
 * HoverCard em cada dot mostra mediana/média/min/max/ativos.
 */
export function StageDurationsLollipop({ durations }: Props) {
  if (durations.length === 0) {
    return <p className="text-xs text-muted-foreground">Sem dados no período.</p>;
  }

  const maxDays = Math.max(...durations.map((d) => d.medianDays ?? 0), 5);
  const toHeight = (days: number) => Math.max(6, (days / maxDays) * (CHART_HEIGHT - PADDING_TOP));

  return (
    <div className="flex flex-col h-full">
      <div
        className="relative flex items-end gap-2 border-b px-2 pb-6"
        style={{ height: CHART_HEIGHT }}
      >
        {durations.map((d) => {
          const hasData = d.medianDays !== null;
          const h = hasData ? toHeight(d.medianDays ?? 0) : 6;
          return (
            <HoverCard key={d.stageId}>
              <HoverCardTrigger
                className="flex flex-1 min-w-0 flex-col items-center justify-end group cursor-default"
                render={
                  <div className="flex flex-1 min-w-0 flex-col items-center justify-end group cursor-default">
                    <div
                      className={cn(
                        'w-[3px] rounded-t-sm',
                        !hasData
                          ? 'bg-primary/20'
                          : d.isBottleneck
                            ? 'bg-destructive/40'
                            : 'bg-primary/40',
                      )}
                      style={{ height: h }}
                    />
                    <div
                      className={cn(
                        'relative z-10 -mt-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-background transition-transform group-hover:scale-110',
                        !hasData
                          ? 'bg-background text-primary border-2 border-primary'
                          : d.isBottleneck
                            ? 'bg-destructive text-white'
                            : 'bg-primary text-white',
                      )}
                    >
                      {hasData ? d.medianDays : '—'}
                    </div>
                    <span className="absolute bottom-0 whitespace-nowrap text-[9.5px] text-muted-foreground">
                      {truncate(d.stageName, 12)}
                    </span>
                  </div>
                }
              />
              <HoverCardContent side="top" align="center" className="w-56">
                <div className="space-y-1.5">
                  <p className="font-semibold text-sm">{d.stageName}</p>
                  {hasData ? (
                    <div className="text-[11px] space-y-0.5">
                      <Row label="Mediana" value={`${d.medianDays}d`} />
                      {d.meanDays !== null && <Row label="Média" value={`${d.meanDays}d`} />}
                      {d.minDays !== null && <Row label="Mínimo" value={`${d.minDays}d`} />}
                      {d.maxDays !== null && <Row label="Máximo" value={`${d.maxDays}d`} />}
                      <Row label="Candidatos ativos" value={d.activeCount.toString()} />
                      {d.returnCount > 0 && (
                        <Row label="Voltaram pra esta etapa" value={d.returnCount.toString()} />
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] space-y-1.5">
                      <p className="text-muted-foreground">
                        Nenhum candidato completou tempo nesta etapa no período.
                      </p>
                      {d.activeCount > 0 && (
                        <Row label="Candidatos ativos" value={d.activeCount.toString()} />
                      )}
                    </div>
                  )}
                  {hasData && d.returnCount > 0 && (
                    <p className="text-[10px] text-muted-foreground pt-1 border-t italic">
                      Tempo = soma das passagens por candidato
                    </p>
                  )}
                  {hasData && d.isBottleneck && (
                    <p className="text-[10px] text-destructive font-medium pt-1 border-t">
                      ⚠ gargalo: mais que 5 dias
                    </p>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
      <div className="mt-auto pt-3 flex gap-3 text-[9.5px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          normal
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
          gargalo (&gt; 5d)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-background border-2 border-primary" />
          sem dados
        </span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium text-foreground">{value}</span>
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
