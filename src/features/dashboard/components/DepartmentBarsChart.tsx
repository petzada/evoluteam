'use client';

import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList,
} from 'recharts';

type Datum = {
  departmentId: string | null;
  departmentName: string | null;
  average: number | null;
  employeeCount: number;
};

interface Props {
  data: Datum[];
}

const MAX_CHARS_PER_LINE = 12;
const MAX_LINES = 2;

function wrapLabel(raw: string): string[] {
  const words = raw.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= MAX_CHARS_PER_LINE) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === MAX_LINES - 1 && current.length > MAX_CHARS_PER_LINE) {
      // sobra cabe na última linha — vamos truncar lá embaixo
      break;
    }
  }
  if (current) lines.push(current);
  // trunca a última linha se ainda exceder
  if (lines.length > 0) {
    const lastIdx = Math.min(lines.length, MAX_LINES) - 1;
    if (lines[lastIdx].length > MAX_CHARS_PER_LINE) {
      lines[lastIdx] = `${lines[lastIdx].slice(0, MAX_CHARS_PER_LINE - 1)}…`;
    }
  }
  return lines.slice(0, MAX_LINES);
}

interface TickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

function MultilineTick({ x = 0, y = 0, payload }: TickProps) {
  const value = payload?.value ?? '';
  const lines = wrapLabel(value);
  return (
    <g transform={`translate(${x},${y + 8})`}>
      <title>{value}</title>
      <text textAnchor="middle" fill="currentColor" fontSize={11}>
        {lines.map((line, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 0 : 12}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

export function DepartmentBarsChart({ data }: Props) {
  const router = useRouter();

  const chartData = data
    .filter((d) => d.average !== null)
    .map((d) => ({
      id: d.departmentId,
      name: d.departmentName ?? 'Sem depto.',
      average: Number((d.average ?? 0).toFixed(2)),
      count: d.employeeCount,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 16, right: 16, bottom: 36, left: 8 }}
          barCategoryGap={12}
        >
          <XAxis
            type="category"
            dataKey="name"
            tick={<MultilineTick />}
            interval={0}
            axisLine={false}
            tickLine={false}
            height={40}
          />
          <YAxis
            type="number"
            domain={[0, 5]}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Bar
            dataKey="average"
            radius={[6, 6, 0, 0]}
            onClick={(payload: unknown) => {
              const entry = payload as { id?: string | null } | null;
              if (entry && entry.id) {
                router.push(`/colaboradores?department_id=${entry.id}`);
              } else {
                router.push('/colaboradores');
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <LabelList
              dataKey="average"
              position="top"
              formatter={(v) => (v === null || v === undefined ? '' : Number(v).toFixed(1))}
              style={{ fontSize: 11, fill: 'currentColor' }}
            />
            {chartData.map((d, i) => (
              <Cell key={i} fill="var(--primary)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
