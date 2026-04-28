'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BRAND } from '@/lib/brand';
import type { OriginBreakdown } from '../../queries/metrics';

interface Props {
  origins: OriginBreakdown[];
}

const DONUT_COLORS = [
  BRAND.colors.coral,
  BRAND.colors.coralBurgundy,
  BRAND.colors.coralOrange,
  BRAND.colors.coralBrown,
  BRAND.colors.coralLight,
  BRAND.colors.coralRust,
  BRAND.colors.coralWarm,
  BRAND.colors.coralOchre,
  BRAND.colors.coralVivid,
];

interface DatumWithColor extends OriginBreakdown {
  color: string;
}

/**
 * 2 donuts lado a lado: candidatos total × contratados, com legenda única
 * (spec 16 §7.6 / mockup aprovado dashboard-final-integrado.html).
 */
export function OriginsDualDonut({ origins }: Props) {
  if (origins.length === 0) {
    return <p className="text-xs text-muted-foreground">Sem dados no período.</p>;
  }

  const enriched: DatumWithColor[] = origins.map((o, i) => ({
    ...o,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const totalCandidates = enriched.reduce((acc, o) => acc + o.candidates, 0);
  const totalHired = enriched.reduce((acc, o) => acc + o.hired, 0);

  // Recharts precisa de arrays distintos por pie (para legenda e cores)
  const candidatesData = enriched
    .filter((o) => o.candidates > 0)
    .map((o) => ({ ...o, value: o.candidates }));
  const hiredData = enriched
    .filter((o) => o.hired > 0)
    .map((o) => ({ ...o, value: o.hired }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 items-center">
        <DonutCol title="Candidatos" data={candidatesData} total={totalCandidates} variant="candidates" />
        <DonutCol title="Contratados" data={hiredData} total={totalHired} variant="hired" />
      </div>

      {/* Legenda única compartilhada */}
      <div className="mt-4 pt-3 border-t grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-[10.5px]">
        {enriched.map((o) => (
          <div key={o.source} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: o.color }} />
            <span className="text-foreground truncate">{o.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutCol({
  title, data, total, variant,
}: { title: string; data: Array<DatumWithColor & { value: number }>; total: number; variant: 'candidates' | 'hired' }) {
  const hasData = data.length > 0 && total > 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {title}
      </p>
      <div className="relative h-[140px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={60}
                strokeWidth={2}
                stroke="var(--background)"
                isAnimationActive={false}
                paddingAngle={1}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
            sem dados
          </div>
        )}
        {hasData && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold leading-none ${variant === 'hired' ? 'text-primary' : 'text-foreground'}`}>
              {total}
            </span>
            <span className="text-[9px] text-muted-foreground mt-0.5">total</span>
          </div>
        )}
      </div>
      {/* Tabela rápida abaixo com % por origem */}
      {hasData && (
        <div className="w-full mt-1 space-y-0.5 text-[10px]">
          {data.map((d) => (
            <div key={d.source} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 truncate">
                <span className="h-1.5 w-1.5 rounded-sm shrink-0" style={{ background: d.color }} />
                <span className="truncate text-muted-foreground">{d.label}</span>
              </span>
              <span className="tabular-nums text-foreground font-medium">
                {d.value}
                {variant === 'hired' && d.candidates > 0 && (
                  <span className="text-muted-foreground ml-1">
                    /{d.candidates} ({Math.round((d.value / d.candidates) * 100)}%)
                  </span>
                )}
                {variant === 'candidates' && total > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({Math.round((d.value / total) * 100)}%)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
