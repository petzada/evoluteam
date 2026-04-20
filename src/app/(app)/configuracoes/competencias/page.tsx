import { Star } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export default function CompetenciasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Competências</h1>
        <p className="text-sm text-muted-foreground">Gerencie as competências avaliadas.</p>
      </div>
      <EmptyState
        icon={Star}
        title="Em breve"
        description="O CRUD de competências estará disponível quando os ciclos de avaliação forem implementados."
      />
    </div>
  );
}
