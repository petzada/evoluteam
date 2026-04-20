import { ClipboardList } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export default function AvaliacoesPage() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="Avaliações — Em breve"
      description="Ciclos de avaliação 360° estarão disponíveis na próxima fase."
    />
  );
}
