import Link from 'next/link';
import { Sparkles, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import {
  getOverallAverage,
  getAveragePerDepartment,
  getCompetencyAverages,
  type DashboardScope,
} from '@/features/dashboard/queries';
import { DepartmentBarsChart } from '@/features/dashboard/components/DepartmentBarsChart';
import { CompetencyRadarChart } from '@/features/dashboard/components/CompetencyRadarChart';

export async function DesempenhoSection({
  scope,
  hasCycle,
}: {
  scope: DashboardScope;
  hasCycle: boolean;
}) {
  if (!hasCycle) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={Sparkles}
            title="Nenhum ciclo de avaliação criado"
            description="Crie o primeiro ciclo para começar a acompanhar o desempenho."
            action={
              <Link href="/avaliacoes/nova">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeiro ciclo
                </Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const [overallAvg, deptAverages, competencyAverages] = await Promise.all([
    getOverallAverage(scope),
    getAveragePerDepartment(scope),
    getCompetencyAverages(scope),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">Média por departamento</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {deptAverages.length > 0 ? (
            <DepartmentBarsChart data={deptAverages} />
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Nenhuma avaliação concluída"
              description="As médias aparecerão aqui quando houver respostas submetidas neste ciclo."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Média geral · Radar de competências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Média geral deste ciclo</p>
            <p className="text-3xl font-bold">
              {overallAvg === null ? '—' : overallAvg.toFixed(2)}
              {overallAvg !== null && (
                <span className="ml-1 text-base font-normal text-muted-foreground">/ 5</span>
              )}
            </p>
          </div>
          {competencyAverages.length > 0 ? (
            <CompetencyRadarChart data={competencyAverages} />
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Sem dados de competências"
              description="As médias por competência aparecerão quando houver respostas neste ciclo."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function DesempenhoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="h-80 animate-pulse rounded-lg border bg-card" />
      <div className="h-80 animate-pulse rounded-lg border bg-card" />
    </div>
  );
}
