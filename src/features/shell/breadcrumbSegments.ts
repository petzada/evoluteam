/** Rótulos estáticos por segmento de URL — compartilhado entre Breadcrumbs e fallback de título na TopBar. */
export const PATH_SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  colaboradores: 'Colaboradores',
  novo: 'Novo',
  nova: 'Nova',
  configuracoes: 'Configurações',
  empresa: 'Empresa',
  departamentos: 'Departamentos',
  cargos: 'Cargos',
  competencias: 'Competências',
  unidades: 'Unidades',
  auditoria: 'Auditoria',
  perfil: 'Meu perfil',
  avaliacoes: 'Avaliações',
  feedbacks: 'Feedbacks',
  pdi: 'PDI',
  editar: 'Editar',
  responder: 'Responder',
  resultados: 'Resultados',
  convite: 'Convite',
  recrutamento: 'Recrutamento',
  vagas: 'Vagas',
  candidatos: 'Candidatos',
  relatorios: 'Relatórios',
  etapas: 'Etapas',
  contratar: 'Contratar',
};

const OPAQUE_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isOpaquePathSegment(seg: string): boolean {
  if (OPAQUE_SEGMENT.test(seg)) return true;
  if (seg.length >= 24 && !/\s/.test(seg) && !PATH_SEGMENT_LABELS[seg]) return true;
  return false;
}

export type PathCrumb = { href: string; label: string; isLast: boolean };

export function buildPathCrumbs(
  pathname: string,
  dynamicLabels: Record<string, string>,
): PathCrumb[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return [];

  const crumbs: PathCrumb[] = [];
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    const href = '/' + segments.slice(0, i + 1).join('/');
    const isLast = i === segments.length - 1;

    const overridden = dynamicLabels[seg];
    if (overridden) {
      crumbs.push({ href, label: overridden, isLast });
      continue;
    }

    const staticLabel = PATH_SEGMENT_LABELS[seg];
    if (staticLabel) {
      crumbs.push({ href, label: staticLabel, isLast });
      continue;
    }

    if (isOpaquePathSegment(seg)) {
      if (isLast && crumbs.length === 0) {
        crumbs.push({ href, label: seg, isLast });
      }
      continue;
    }

    crumbs.push({ href, label: seg, isLast });
  }
  return crumbs;
}

export function fallbackTitleFromPath(pathname: string, dynamicLabels: Record<string, string>): string | null {
  const crumbs = buildPathCrumbs(pathname, dynamicLabels);
  if (crumbs.length === 0) return null;
  return crumbs[crumbs.length - 1].label;
}
