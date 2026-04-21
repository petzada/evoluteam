import { PageHeader } from '@/components/PageHeader';

export default function VagasPage() {
  return (
    <div>
      <PageHeader
        title="Vagas"
        description="Gerencie as vagas em aberto do seu processo seletivo."
      />
      <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Em breve — Onda 1 do FT-7.
      </div>
    </div>
  );
}
