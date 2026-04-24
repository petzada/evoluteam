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
    <div className="w-full flex-1 min-h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 16, right: 16, bottom: 24, left: 8 }}
          barCategoryGap={12}
        >
          <XAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            axisLine={false}
            tickLine={false}
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
