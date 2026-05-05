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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/EmptyState';
import { Building } from 'lucide-react';
import { UnitSheet } from './UnitSheet';
import { archiveUnit, unarchiveUnit, deleteUnit } from '../actions';
import { statusClass } from '@/lib/status-colors';
import { taxonomyStatusToken } from '@/lib/status-mappers';

type Row = {
  id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  employeeCount: number;
};

interface Props {
  units: Row[];
  canEdit: boolean;
}

export function UnitsManager({ units, canEdit }: Props) {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const { filtered, activeCount, archivedCount } = useMemo(() => {
    const lower = search.trim().toLowerCase();
    const filtered = units.filter((u) => {
      if (!showArchived && u.is_archived) return false;
      if (lower && !u.name.toLowerCase().includes(lower)) return false;
      return true;
    });
    const activeCount = units.filter((u) => !u.is_archived).length;
    const archivedCount = units.length - activeCount;
    return { filtered, activeCount, archivedCount };
  }, [units, search, showArchived]);

  async function handleArchive(target: Row, archive: boolean) {
    const result = archive
      ? await archiveUnit(target.id)
      : await unarchiveUnit(target.id);
    if (result.error) { toast.error(result.error); return; }
    toast.success(archive ? 'Unidade arquivada.' : 'Unidade desarquivada.');
  }

  async function handleDelete(target: Row) {
    const result = await deleteUnit(target.id);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Unidade removida permanentemente.');
  }

  // FT-10: empty state quando o tenant ainda nao criou nenhuma unidade.
  // Cliente que nao e grupo passa pela mesma rota sem ruido.
  const isCompletelyEmpty = units.length === 0 && search.trim() === '';

  return (
    <div>
      <PageHeader
        title="Unidades"
        description="Empresas/unidades do grupo."
        actions={canEdit ? (
          <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nova unidade
          </Button>
        ) : undefined}
      />

      {isCompletelyEmpty ? (
        <EmptyState
          icon={Building}
          title="Nenhuma unidade cadastrada"
          description="Use unidades para separar colaboradores em sub-empresas, filiais ou marcas dentro do grupo. Atribuição é opcional."
          action={canEdit ? (
            <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova unidade
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar unidade…"
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
              Mostrar arquivadas
            </label>
          </div>

          <div className="rounded-md border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-48">Colaboradores</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  {canEdit && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canEdit ? 4 : 3}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      Nenhuma unidade encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        {row.employeeCount === 0 ? (
                          <span className="text-muted-foreground text-sm">0 colaboradores</span>
                        ) : (
                          <Link
                            href={`/colaboradores?unit=${row.id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            {row.employeeCount} {row.employeeCount === 1 ? 'colaborador' : 'colaboradores'}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusClass(taxonomyStatusToken(row.is_archived))}>
                          {row.is_archived ? 'Arquivada' : 'Ativa'}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditing({ id: row.id, name: row.name }); setSheetOpen(true); }}>
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
                              {row.employeeCount > 0 ? (
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
                                    Remova os colaboradores vinculados antes.
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
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {activeCount} ativa{activeCount === 1 ? '' : 's'} · {archivedCount} arquivada{archivedCount === 1 ? '' : 's'}
          </p>
        </>
      )}

      {canEdit && (
        <UnitSheet
          open={sheetOpen}
          onOpenChange={(o) => { setSheetOpen(o); if (!o) setEditing(null); }}
          existing={editing}
        />
      )}

      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(o) => !o && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar {archiveTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Colaboradores vinculados a esta unidade continuam com o vínculo. A unidade não aparecerá mais em filtros/selects ativos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (archiveTarget) await handleArchive(archiveTarget, true);
                setArchiveTarget(null);
              }}
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente — a unidade será removida para sempre. Não há colaboradores vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (deleteTarget) await handleDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
