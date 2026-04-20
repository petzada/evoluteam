'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  colaboradores: 'Colaboradores',
  novo: 'Novo',
  configuracoes: 'Configurações',
  empresa: 'Empresa',
  departamentos: 'Departamentos',
  cargos: 'Cargos',
  competencias: 'Competências',
  auditoria: 'Auditoria',
  perfil: 'Meu perfil',
  avaliacoes: 'Avaliações',
  feedbacks: 'Feedbacks',
  pdi: 'PDI',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        const href = '/' + segments.slice(0, idx + 1).join('/');
        const label = SEGMENT_LABELS[seg] ?? seg;

        return (
          <div key={href} className="flex items-center gap-1.5 min-w-0">
            {idx > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground truncate">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
