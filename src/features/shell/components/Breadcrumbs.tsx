'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useBreadcrumbLabels } from '../BreadcrumbContext';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  colaboradores: 'Colaboradores',
  novo: 'Novo',
  nova: 'Nova',
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
  editar: 'Editar',
  responder: 'Responder',
  resultados: 'Resultados',
  convite: 'Convite',
  // FT-7 Recrutamento
  recrutamento: 'Recrutamento',
  vagas: 'Vagas',
  candidatos: 'Candidatos',
  relatorios: 'Relatórios',
  etapas: 'Etapas',
  contratar: 'Contratar',
};

const OPAQUE_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isOpaqueSegment(seg: string): boolean {
  if (OPAQUE_SEGMENT.test(seg)) return true;
  if (seg.length >= 24 && !/\s/.test(seg) && !SEGMENT_LABELS[seg]) return true;
  return false;
}

type Crumb = { href: string; label: string; isLast: boolean };

export function Breadcrumbs() {
  const pathname = usePathname();
  const labels = useBreadcrumbLabels();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: Crumb[] = [];
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    const href = '/' + segments.slice(0, i + 1).join('/');
    const isLast = i === segments.length - 1;

    const overridden = labels[seg];
    if (overridden) {
      crumbs.push({ href, label: overridden, isLast });
      continue;
    }

    const staticLabel = SEGMENT_LABELS[seg];
    if (staticLabel) {
      crumbs.push({ href, label: staticLabel, isLast });
      continue;
    }

    if (isOpaqueSegment(seg)) {
      if (isLast && crumbs.length === 0) {
        crumbs.push({ href, label: seg, isLast });
      }
      continue;
    }

    crumbs.push({ href, label: seg, isLast });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
      {crumbs.map((crumb, idx) => (
        <div key={crumb.href} className="flex items-center gap-1.5 min-w-0">
          {idx > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          )}
          {crumb.isLast ? (
            <span className="font-medium text-foreground truncate">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors truncate"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
