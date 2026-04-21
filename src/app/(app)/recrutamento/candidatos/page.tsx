import { PageHeader } from '@/components/PageHeader';

export default function CandidatosPage() {
  return (
    <div>
      <PageHeader
        title="Candidatos"
        description="Banco global de candidatos da empresa."
      />
      <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Em breve — Onda 1 do FT-7.
      </div>
    </div>
  );
}
