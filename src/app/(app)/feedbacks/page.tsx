import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export default function FeedbacksPage() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Feedbacks — Em breve"
      description="Feedbacks contínuos entre colaboradores estarão disponíveis em breve."
    />
  );
}
