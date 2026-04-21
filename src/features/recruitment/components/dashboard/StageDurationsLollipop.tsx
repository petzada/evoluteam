'use client';

import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import type { StageDuration } from '../../queries/metrics';

interface Props {
  durations: StageDuration[];
}

const CHART_HEIGHT = 170;
const PADDING_TOP = 16;

/**
 * Lollipop vertical de tempo mediano por etapa (spec 16 §7.7).
 * Linha fina + círculo no topo com o valor em dias. Gargalo (>5d) em vermelho.
 * HoverCard em cada dot mostra mediana/média/min/max/ativos.
 */
export function StageDurationsLollipop({ durations }: Props) {
  if (durations.every((d) => d.medianDays === null)) {
    return <p className="text-xs text-muted-foreground">Sem dados no período.</p>;
  }

  const visible = durations.filter((d) => d.medianDays !== null);
  const maxDays = Math.max(...visible.map((d) => d.medianDays ?? 0), 5);
  const toHeight = (days: number) => Math.max(6, (days / maxDays) * (CHART_HEIGHT - PADDING_TOP));

  return (
    <div>
      <div
        className="relative flex items-end gap-2 border-b px-2 pb-6"
        style={{ height: CHART_HEIGHT }}
      >
        {visible.map((d) => {
          const h = toHeight(d.medianDays ?? 0);
          return (
            <HoverCard key={d.stageId}>
              <HoverCardTrigger
                className="flex flex-1 min-w-0 flex-col items-center justify-end group cursor-default"
                render={
                  <div className="flex flex-1 min-w-0 flex-col items-center justify-end group cursor-default">
                    <div
                      className={`w-[3px] rounded-t-sm ${d.isBottleneck ? 'bg-destructive/40' : 'bg-primary/40'}`}
                      style={{ height: h }}
                    />
                    <div
                      className={`relative z-10 -mt-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-background transition-transform group-hover:scale-110 ${
                        d.isBottleneck ? 'bg-destructive' : 'bg-primary'
                      }`}
                    >
                      {d.medianDays}
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
                  <div className="text-[11px] space-y-0.5">
                    <Row label="Mediana" value={`${d.medianDays}d`} />
                    {d.meanDays !== null && <Row label="Média" value={`${d.meanDays}d`} />}
                    {d.minDays !== null && <Row label="Mínimo" value={`${d.minDays}d`} />}
                    {d.maxDays !== null && <Row label="Máximo" value={`${d.maxDays}d`} />}
                    <Row label="Candidatos ativos" value={d.activeCount.toString()} />
                  </div>
                  {d.isBottleneck && (
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
      <div className="mt-3 flex gap-3 text-[9.5px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          normal
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
          gargalo (&gt; 5d)
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
