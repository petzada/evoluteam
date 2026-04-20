import { Briefcase } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

export default function CargosPage() {
  return (
    <div>
      <PageHeader title="Cargos" description="Gerencie os cargos da empresa." />
      <EmptyState
        icon={Briefcase}
        title="Em breve"
        description="O CRUD completo de cargos estará disponível na próxima fase."
      />
    </div>
  );
}
