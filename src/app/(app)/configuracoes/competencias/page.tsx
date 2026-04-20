import { Star } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

export default function CompetenciasPage() {
  return (
    <div>
      <PageHeader title="Competências" description="Gerencie as competências avaliadas." />
      <EmptyState
        icon={Star}
        title="Em breve"
        description="O CRUD de competências estará disponível quando os ciclos de avaliação forem implementados."
      />
    </div>
  );
}
