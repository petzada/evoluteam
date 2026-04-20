'use client';

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell, LabelList,
} from 'recharts';

type Datum = { competencyId: string; competencyName: string; average: number };

interface Props {
  data: Datum[];
}

export function CompetencyRadarChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: d.competencyName,
    value: Number(d.average.toFixed(2)),
  }));

  if (chartData.length === 0) return null;

  if (chartData.length < 3) {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 32, bottom: 8, left: 8 }}
            barCategoryGap={12}
          >
            <XAxis
              type="number"
              domain={[0, 5]}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              width={140}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v) => (v === null || v === undefined ? '' : Number(v).toFixed(1))}
                style={{ fontSize: 11, fill: 'currentColor' }}
              />
              {chartData.map((_, i) => (
                <Cell key={i} fill="oklch(0.62 0.19 258)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
          <PolarGrid stroke="oklch(0.9 0 0 / 0.3)" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} axisLine={false} />
          <Radar
            name="Média"
            dataKey="value"
            stroke="oklch(0.62 0.19 258)"
            fill="oklch(0.62 0.19 258)"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
