import { PageHeader } from '@/components/PageHeader';

export default function RelatoriosPage() {
  return (
    <div>
      <PageHeader
        title="Relatórios de Recrutamento"
        description="Métricas do funil, tempo por etapa, origens e tarefas pendentes."
      />
      <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Em breve — Onda 3 do FT-7.
      </div>
    </div>
  );
}
