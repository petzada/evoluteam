import { TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export default function PdiPage() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="PDI — Em breve"
      description="Planos de Desenvolvimento Individual estarão disponíveis em breve."
    />
  );
}
