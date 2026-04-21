'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TaxonomySheet } from './TaxonomySheet';
import { ConfirmArchiveDialog } from './ConfirmArchiveDialog';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { archiveTaxonomy, deleteTaxonomy } from '../actions';

type Kind = 'department' | 'position' | 'competency';

type Row = {
  id: string;
  name: string;
  is_archived: boolean;
  usageCount: number;
  usageLabel: string;
  usageHref?: string;
};

interface PropsBase {
  kind: Kind;
}

interface PropsDepartmentOrPosition extends PropsBase {
  kind: 'department' | 'position';
  items: (Omit<Row, 'usageCount' | 'usageLabel' | 'usageHref'> & { employeeCount: number })[];
}

interface PropsCompetency extends PropsBase {
  kind: 'competency';
  items: (Omit<Row, 'usageCount' | 'usageLabel' | 'usageHref'> & { usageCount: number })[];
}

type Props = PropsDepartmentOrPosition | PropsCompetency;

const COPY: Record<Kind, {
  title: string;
  description: string;
  singular: string;
  searchPlaceholder: string;
  usageColLabel: string;
  deleteBlockedHint: string;
}> = {
  department: {
    title: 'Departamentos',
    description: 'Gerencie os departamentos da empresa.',
    singular: 'departamento',
    searchPlaceholder: 'Buscar departamento…',
    usageColLabel: 'Colaboradores',
    deleteBlockedHint: 'Remova os colaboradores vinculados antes.',
  },
  position: {
    title: 'Cargos',
    description: 'Gerencie os cargos da empresa.',
    singular: 'cargo',
    searchPlaceholder: 'Buscar cargo…',
    usageColLabel: 'Colaboradores',
    deleteBlockedHint: 'Remova os colaboradores vinculados antes.',
  },
  competency: {
    title: 'Competências',
    description: 'Competências avaliadas em ciclos, feedbacks e PDIs.',
    singular: 'competência',
    searchPlaceholder: 'Buscar competência…',
    usageColLabel: 'Em uso',
    deleteBlockedHint: 'Remova as referências em avaliações, feedbacks ou PDIs antes.',
  },
};

function normalizeItems(props: Props): Row[] {
  if (props.kind === 'competency') {
    return props.items.map((i) => ({
      id: i.id,
      name: i.name,
      is_archived: i.is_archived,
      usageCount: i.usageCount,
      usageLabel: i.usageCount === 1 ? '1 referência' : `${i.usageCount} referências`,
    }));
  }
  return props.items.map((i) => ({
    id: i.id,
    name: i.name,
    is_archived: i.is_archived,
    usageCount: i.employeeCount,
    usageLabel: `${i.employeeCount} ${i.employeeCount === 1 ? 'colaborador' : 'colaboradores'}`,
    usageHref: i.employeeCount > 0
      ? `/colaboradores?${props.kind === 'department' ? 'department' : 'position'}=${i.id}`
      : undefined,
  }));
}

export function TaxonomyList(props: Props) {
  const { kind } = props;
  const copy = COPY[kind];
  const rows = useMemo(() => normalizeItems(props), [props]);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const { filtered, activeCount, archivedCount } = useMemo(() => {
    const lower = search.trim().toLowerCase();
    const filtered = rows.filter((i) => {
      if (!showArchived && i.is_archived) return false;
      if (lower && !i.name.toLowerCase().includes(lower)) return false;
      return true;
    });
    const activeCount = rows.filter((i) => !i.is_archived).length;
    const archivedCount = rows.length - activeCount;
    return { filtered, activeCount, archivedCount };
  }, [rows, search, showArchived]);

  async function handleArchive(target: Row, archive: boolean) {
    const result = await archiveTaxonomy(kind, target.id, archive);
    if (result.error) { toast.error(result.error); return; }
    toast.success(archive ? 'Arquivado.' : 'Desarquivado.');
  }

  async function handleDelete(target: Row) {
    const result = await deleteTaxonomy(kind, target.id);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Removido permanentemente.');
  }

  return (
    <div>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nov{kind === 'competency' ? 'a' : 'o'} {copy.singular}
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={copy.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Mostrar arquivad{kind === 'competency' ? 'a' : 'o'}s
        </label>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-48">{copy.usageColLabel}</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-10">
                  Nenhum{kind === 'competency' ? 'a' : ''} {copy.singular} encontrad{kind === 'competency' ? 'a' : 'o'}.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    {row.usageCount === 0 ? (
                      <span className="text-muted-foreground text-sm">{row.usageLabel}</span>
                    ) : row.usageHref ? (
                      <Link href={row.usageHref} className="text-primary hover:underline text-sm">
                        {row.usageLabel}
                      </Link>
                    ) : (
                      <span className="text-sm">{row.usageLabel}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.is_archived ? 'outline' : 'default'}>
                      {row.is_archived ? 'Arquivad' + (kind === 'competency' ? 'a' : 'o') : 'Ativ' + (kind === 'competency' ? 'a' : 'o')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(row); setSheetOpen(true); }}>
                          Editar
                        </DropdownMenuItem>
                        {row.is_archived ? (
                          <DropdownMenuItem onClick={() => handleArchive(row, false)}>
                            Desarquivar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setArchiveTarget(row)}>
                            Arquivar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {row.usageCount > 0 ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <DropdownMenuItem
                                  disabled
                                  className="text-destructive focus:text-destructive cursor-not-allowed opacity-50"
                                >
                                  Deletar
                                </DropdownMenuItem>
                              }
                            />
                            <TooltipContent side="left">
                              {copy.deleteBlockedHint}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(row)}
                          >
                            Deletar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {activeCount} ativ{kind === 'competency' ? 'a' : 'o'}{activeCount === 1 ? '' : 's'} · {archivedCount} arquivad{kind === 'competency' ? 'a' : 'o'}{archivedCount === 1 ? '' : 's'}
      </p>

      <TaxonomySheet
        kind={kind}
        open={sheetOpen}
        onOpenChange={(o) => { setSheetOpen(o); if (!o) setEditing(null); }}
        existing={editing}
      />

      <ConfirmArchiveDialog
        open={!!archiveTarget}
        kind={kind}
        target={archiveTarget}
        onOpenChange={(o) => !o && setArchiveTarget(null)}
        onConfirm={async () => {
          if (archiveTarget) await handleArchive(archiveTarget, true);
          setArchiveTarget(null);
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        kind={kind}
        target={deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
