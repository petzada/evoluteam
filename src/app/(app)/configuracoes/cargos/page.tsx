import { Briefcase } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export default function CargosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cargos</h1>
        <p className="text-sm text-muted-foreground">Gerencie os cargos da empresa.</p>
      </div>
      <EmptyState
        icon={Briefcase}
        title="Em breve"
        description="O CRUD completo de cargos estará disponível na próxima fase."
      />
    </div>
  );
}
