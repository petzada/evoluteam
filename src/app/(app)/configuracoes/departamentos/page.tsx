import { Layers } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export default function DepartamentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Departamentos</h1>
        <p className="text-sm text-muted-foreground">Gerencie os departamentos da empresa.</p>
      </div>
      <EmptyState
        icon={Layers}
        title="Em breve"
        description="O CRUD completo de departamentos estará disponível na próxima fase."
      />
    </div>
  );
}
