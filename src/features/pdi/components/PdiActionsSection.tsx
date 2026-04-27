'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import type { PlanActionRow } from '../queries';
import { addAction, removeAction, updateAction, updateActionStatus } from '../actions';
import {
  PDI_ACTION_STATUSES, PDI_ACTION_STATUS_LABELS, type PdiActionStatus,
} from '../schema';
import { actionStatusColor, computeActionStatus } from '../utils';

interface EmployeeOption {
  id: string;
  full_name: string;
  email: string;
  status: string;
  position: { id: string; name: string } | null;
}

interface Props {
  planId: string;
  actions: PlanActionRow[];
  employees: EmployeeOption[];
  defaultResponsibleId: string | null;
  canAddActions: boolean;
  actorEmployeeId: string | null;
  isAdmin: boolean;
  isCreator: boolean;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
}

export function PdiActionsSection({
  planId, actions, employees, defaultResponsibleId,
  canAddActions, actorEmployeeId, isAdmin, isCreator,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [responsibleId, setResponsibleId] = useState<string>(defaultResponsibleId ?? '');
  const [empSearch, setEmpSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editResponsibleId, setEditResponsibleId] = useState('');
  const [editEmpSearch, setEditEmpSearch] = useState('');

  const responsibleOptions = useMemo(
    () => employees.filter((e) => e.status !== 'terminated'),
    [employees],
  );
  const filtered = useMemo(() => {
    const lower = empSearch.trim().toLowerCase();
    if (!lower) return responsibleOptions.slice(0, 20);
    return responsibleOptions.filter(
      (e) => e.full_name.toLowerCase().includes(lower) || e.email.toLowerCase().includes(lower),
    ).slice(0, 20);
  }, [responsibleOptions, empSearch]);

  const selectedResp = responsibleOptions.find((e) => e.id === responsibleId);

  function resetForm() {
    setTitle('');
    setDueDate('');
    setResponsibleId(defaultResponsibleId ?? '');
    setEmpSearch('');
    setShowForm(false);
  }

  async function handleCreate() {
    if (!title.trim() || !dueDate || !responsibleId) return;
    setSaving(true);
    const r = await addAction(planId, {
      title: title.trim(),
      dueDate,
      responsibleEmployeeId: responsibleId,
    });
    setSaving(false);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    toast.success('Ação adicionada.');
    resetForm();
    router.refresh();
  }

  async function handleStatus(actionId: string, status: PdiActionStatus) {
    const r = await updateActionStatus(actionId, status);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    router.refresh();
  }

  async function handleRemove(actionId: string) {
    if (!confirm('Remover esta ação?')) return;
    const r = await removeAction(actionId);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    toast.success('Ação removida.');
    router.refresh();
  }

  function startEdit(a: PlanActionRow) {
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditDueDate(a.due_date);
    setEditResponsibleId(a.responsible_employee_id);
    setEditEmpSearch('');
  }
  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditDueDate('');
    setEditResponsibleId('');
    setEditEmpSearch('');
  }
  async function saveEdit() {
    if (!editingId) return;
    if (!editTitle.trim() || !editDueDate || !editResponsibleId) return;
    setSaving(true);
    const r = await updateAction(editingId, {
      title: editTitle.trim(),
      dueDate: editDueDate,
      responsibleEmployeeId: editResponsibleId,
    });
    setSaving(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success('Ação atualizada.');
    cancelEdit();
    router.refresh();
  }

  const filteredEdit = useMemo(() => {
    const lower = editEmpSearch.trim().toLowerCase();
    if (!lower) return responsibleOptions.slice(0, 20);
    return responsibleOptions.filter(
      (e) => e.full_name.toLowerCase().includes(lower) || e.email.toLowerCase().includes(lower),
    ).slice(0, 20);
  }, [responsibleOptions, editEmpSearch]);

  const selectedEditResp = responsibleOptions.find((e) => e.id === editResponsibleId);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Ações</h2>
        {canAddActions && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Adicionar ação
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-md border p-4 mb-4 space-y-3 bg-muted/20">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Concluir curso de liderança"
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prazo *</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Responsável *</label>
              {selectedResp ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm h-9">
                  <span className="truncate">{selectedResp.full_name}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setResponsibleId('')}
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar…"
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="pl-9"
                  />
                  {empSearch && (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover shadow-md">
                      {filtered.map((e) => (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => { setResponsibleId(e.id); setEmpSearch(''); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                          >
                            <p className="font-medium">{e.full_name}</p>
                            <p className="text-xs text-muted-foreground">{e.position?.name ?? e.email}</p>
                          </button>
                        </li>
                      ))}
                      {filtered.length === 0 && (
                        <li className="px-3 py-2 text-xs text-muted-foreground italic">Nenhum resultado.</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={resetForm} disabled={saving}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving || !title.trim() || !dueDate || !responsibleId}>
              {saving ? 'Salvando…' : 'Adicionar'}
            </Button>
          </div>
        </div>
      )}

      {actions.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-6 text-center">
          Nenhuma ação ainda. {canAddActions && 'Adicione a primeira para começar.'}
        </p>
      ) : (
        <ul className="rounded-md border bg-card shadow-card divide-y">
          {actions.map((a) => {
            const computed = computeActionStatus(a);
            const canUpdate =
              isAdmin
              || (actorEmployeeId && a.responsible_employee_id === actorEmployeeId);
            const canEdit = isAdmin || isCreator;
            const canDelete = isAdmin || isCreator;
            const isOverdue = computed === 'atrasada';
            const isEditing = editingId === a.id;

            if (isEditing) {
              return (
                <li key={a.id} className="px-4 py-3 space-y-3 bg-muted/20 text-sm">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Título *</label>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={200} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Prazo *</label>
                      <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Responsável *</label>
                      {selectedEditResp ? (
                        <div className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm h-9">
                          <span className="truncate">{selectedEditResp.full_name}</span>
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setEditResponsibleId('')}
                          >
                            Trocar
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar…"
                            value={editEmpSearch}
                            onChange={(e) => setEditEmpSearch(e.target.value)}
                            className="pl-9"
                          />
                          {editEmpSearch && (
                            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover shadow-md">
                              {filteredEdit.map((e) => (
                                <li key={e.id}>
                                  <button
                                    type="button"
                                    onClick={() => { setEditResponsibleId(e.id); setEditEmpSearch(''); }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                  >
                                    <p className="font-medium">{e.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{e.position?.name ?? e.email}</p>
                                  </button>
                                </li>
                              ))}
                              {filteredEdit.length === 0 && (
                                <li className="px-3 py-2 text-xs text-muted-foreground italic">Nenhum resultado.</li>
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>Cancelar</Button>
                    <Button
                      size="sm"
                      onClick={saveEdit}
                      disabled={saving || !editTitle.trim() || !editDueDate || !editResponsibleId}
                    >
                      {saving ? 'Salvando…' : 'Salvar'}
                    </Button>
                  </div>
                </li>
              );
            }

            return (
              <li key={a.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{a.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn(isOverdue && 'text-amber-700 font-medium')}>
                      Prazo: {formatDate(a.due_date)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.responsible && (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[10px]">{initials(a.responsible.full_name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {a.responsible.full_name}
                      </span>
                    </div>
                  )}
                  {canUpdate ? (
                    <Select
                      value={a.status}
                      onValueChange={(v) => handleStatus(a.id, v as PdiActionStatus)}
                      items={PDI_ACTION_STATUSES.map((s) => ({ value: s, label: PDI_ACTION_STATUS_LABELS[s] }))}
                    >
                      <SelectTrigger
                        className={cn(
                          'h-7 text-xs w-[140px] border',
                          actionStatusColor(computed),
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PDI_ACTION_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{PDI_ACTION_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]',
                      actionStatusColor(computed),
                    )}>
                      {PDI_ACTION_STATUS_LABELS[computed]}
                    </span>
                  )}
                  {(canEdit || canDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem onClick={() => startEdit(a)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => handleRemove(a.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Remover
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
