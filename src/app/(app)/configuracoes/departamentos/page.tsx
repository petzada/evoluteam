import { Layers } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

export default function DepartamentosPage() {
  return (
    <div>
      <PageHeader title="Departamentos" description="Gerencie os departamentos da empresa." />
      <EmptyState
        icon={Layers}
        title="Em breve"
        description="O CRUD completo de departamentos estará disponível na próxima fase."
      />
    </div>
  );
}
