import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export default function HelpTopicNotFound() {
  return (
    <EmptyState
      icon={LifeBuoy}
      title="Tutorial não encontrado"
      description="O conteúdo que você procura não existe ou não está disponível para o seu perfil."
      action={
        <Link
          href="/ajuda"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver tutoriais disponíveis
        </Link>
      }
    />
  );
}
