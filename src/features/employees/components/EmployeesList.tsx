'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  MoreHorizontal, Plus, Search, UserPlus, Users, Download, Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { PaginationControls } from '@/components/PaginationControls';
import { EmployeeSheet, type ExistingEmployee } from './EmployeeSheet';
import { ConfirmStatusDialog, type StatusAction } from './ConfirmStatusDialog';
import { resendInvite, revokeInvite } from '../actions';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { formatDate } from '@/lib/date';

type Invite = {
  id: string;
  role: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

type Employee = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  hire_date: string;
  user_id: string | null;
  manager_id: string | null;
  position: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  manager: { id: string; full_name: string } | null;
  invite: Invite[] | null;
};

interface Position { id: string; name: string }
interface Department { id: string; name: string }

interface Props {
  employees: Employee[];
  positions: Position[];
  departments: Department[];
  currentUserId: string;
  isAdmin: boolean;
  profileRoles: Record<string, 'admin_rh' | 'director' | 'user'>;
  openSheet?: boolean;
  editingEmployee?: ExistingEmployee | null;
  initialStatusFilter?: string | null;
  specialFilter?: 'sem_feedback' | null;
  specialFilterEmployeeIds?: string[];
}

type DerivedStatus =
  | 'ativo' | 'inativo' | 'desligado'
  | 'convite_pendente' | 'convite_expirado' | 'sem_acesso';

function deriveStatus(emp: Employee): DerivedStatus {
  if (emp.status === 'terminated') return 'desligado';
  if (emp.status === 'inactive') return 'inativo';
  if (emp.user_id) return 'ativo';
  const pending = emp.invite?.find(
    (i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) > new Date(),
  );
  if (pending) return 'convite_pendente';
  const expired = emp.invite?.find(
    (i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) <= new Date(),
  );
  if (expired) return 'convite_expirado';
  return 'sem_acesso';
}

const STATUS_LABELS: Record<DerivedStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  desligado: 'Desligado',
  convite_pendente: 'Convite pendente',
  convite_expirado: 'Convite expirado',
  sem_acesso: 'Sem acesso',
};

const STATUS_VARIANTS: Record<DerivedStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  ativo: 'default',
  inativo: 'outline',
  desligado: 'outline',
  convite_pendente: 'secondary',
  convite_expirado: 'outline',
  sem_acesso: 'outline',
};

const STATUS_FILTER_ITEMS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'desligado', label: 'Desligado' },
  { value: 'convite_pendente', label: 'Convite pendente' },
  { value: 'convite_expirado', label: 'Convite expirado' },
  { value: 'sem_acesso', label: 'Sem acesso' },
];

const ROLE_PILL: Record<string, string> = {
  admin_rh: 'Administrador',
  director: 'Diretor',
  rh: 'RH',
};

type ColumnKey = 'email' | 'role' | 'admission' | 'phone';
const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  email: false,
  role: false,
  admission: false,
  phone: false,
};
const COLUMN_LABELS: Record<ColumnKey, string> = {
  email: 'E-mail',
  role: 'Acesso',
  admission: 'Admissão',
  phone: 'Telefone',
};

const STATUS_URL_MAP: Record<string, string> = {
  active: 'ativo',
  ativo: 'ativo',
  inactive: 'inativo',
  inativo: 'inativo',
  terminated: 'desligado',
  desligado: 'desligado',
  convite_pendente: 'convite_pendente',
  convite_expirado: 'convite_expirado',
  sem_acesso: 'sem_acesso',
};

export function EmployeesList({
  employees,
  positions,
  departments,
  currentUserId,
  isAdmin,
  profileRoles,
  openSheet = false,
  editingEmployee = null,
  initialStatusFilter = null,
  specialFilter = null,
  specialFilterEmployeeIds = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sheetOpen, setSheetOpen] = useState(openSheet);
  const [editing, setEditing] = useState<ExistingEmployee | null>(editingEmployee);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    initialStatusFilter && STATUS_URL_MAP[initialStatusFilter] ? STATUS_URL_MAP[initialStatusFilter] : 'all',
  );
  const specialSet = useMemo(() => new Set(specialFilterEmployeeIds), [specialFilterEmployeeIds]);
  const [positionFilter, setPositionFilter] = useState<string[]>(() => {
    const v = searchParams.get('position');
    return v ? [v] : [];
  });
  const [departmentFilter, setDepartmentFilter] = useState<string[]>(() => {
    const v = searchParams.get('department_id') ?? searchParams.get('department');
    return v ? [v] : [];
  });
  const [managerFilter, setManagerFilter] = useState<string[]>([]);
  const [showTerminated, setShowTerminated] = useState(false);
  const [columns, setColumns] = useState<Record<ColumnKey, boolean>>(DEFAULT_COLUMNS);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusTarget, setStatusTarget] = useState<
    { id: string; full_name: string; subordinatesCount: number } | null
  >(null);

  const subordinatesByManager = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of employees) {
      if (e.manager_id) map[e.manager_id] = (map[e.manager_id] ?? 0) + 1;
    }
    return map;
  }, [employees]);

  const currentManagers = useMemo(
    () => employees
      .filter((e) => e.status === 'active' && (subordinatesByManager[e.id] ?? 0) > 0)
      .map((e) => ({ id: e.id, full_name: e.full_name })),
    [employees, subordinatesByManager],
  );
  const potentialManagers = useMemo(
    () => employees
      .filter((e) => e.status === 'active')
      .map((e) => ({ id: e.id, full_name: e.full_name })),
    [employees],
  );

  const metrics = useMemo(() => {
    let ativos = 0;
    let pendentes = 0;
    let desligados = 0;
    for (const e of employees) {
      const s = deriveStatus(e);
      if (s === 'ativo') ativos++;
      else if (s === 'convite_pendente') pendentes++;
      else if (s === 'desligado') desligados++;
    }
    return { ativos, pendentes, desligados };
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const status = deriveStatus(emp);
      if (status === 'desligado' && !showTerminated) return false;
      if (specialFilter === 'sem_feedback' && !specialSet.has(emp.id)) return false;

      const matchSearch =
        !search ||
        emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || status === statusFilter;
      const matchPos = positionFilter.length === 0
        || (emp.position?.id ? positionFilter.includes(emp.position.id) : false);
      const matchDep = departmentFilter.length === 0
        || departmentFilter.includes(emp.department?.id ?? '__none__');
      const matchMgr = managerFilter.length === 0
        || managerFilter.includes(emp.manager_id ?? '__none__');
      return matchSearch && matchStatus && matchPos && matchDep && matchMgr;
    });
  }, [employees, search, statusFilter, positionFilter, departmentFilter, managerFilter, showTerminated, specialFilter, specialSet]);

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (effectivePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, effectivePage]);

  const resetPage = useCallback(() => setPage(1), []);
  const onSearchChange = (v: string) => { setSearch(v); resetPage(); };
  const onStatusFilterChange = (v: string) => { setStatusFilter(v); resetPage(); };
  const onPositionFilterChange = (v: string[]) => { setPositionFilter(v); resetPage(); };
  const onDepartmentFilterChange = (v: string[]) => { setDepartmentFilter(v); resetPage(); };
  const onManagerFilterChange = (v: string[]) => { setManagerFilter(v); resetPage(); };
  const onShowTerminatedChange = (v: boolean) => { setShowTerminated(v); resetPage(); };

  function clearSpecialFilter() {
    const p = new URLSearchParams(searchParams?.toString() ?? '');
    p.delete('filter');
    router.replace(`/colaboradores${p.toString() ? `?${p.toString()}` : ''}`);
  }

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(emp: Employee) {
    const role = (emp.user_id && profileRoles[emp.user_id]) || 'user';
    setEditing({
      id: emp.id,
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone,
      positionId: emp.position?.id ?? null,
      departmentId: emp.department?.id ?? null,
      managerId: emp.manager?.id ?? null,
      role,
      hireDate: emp.hire_date,
      isSelf: emp.user_id === currentUserId,
      descendantIds: collectDescendantIds(emp.id, employees),
    });
    setSheetOpen(true);
  }

  function openStatusDialog(action: StatusAction, emp: Employee) {
    setStatusAction(action);
    setStatusTarget({
      id: emp.id,
      full_name: emp.full_name,
      subordinatesCount: subordinatesByManager[emp.id] ?? 0,
    });
  }

  async function handleResend(employeeId: string) {
    const result = await resendInvite(employeeId);
    if (result.error) { toast.error(result.error); return; }
    toast.success(result.warning ?? 'Convite reenviado!');
  }

  async function handleRevoke(inviteId: string) {
    const result = await revokeInvite(inviteId);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Convite revogado.');
  }

  const positionOptions = positions.map((p) => ({ value: p.id, label: p.name }));
  const departmentOptions = [
    { value: '__none__', label: 'Sem departamento' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];
  const managerOptions = [
    { value: '__none__', label: 'Sem gestor' },
    ...currentManagers.map((m) => ({ value: m.id, label: m.full_name })),
  ];

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        description="Ficha de RH + gerenciamento de acesso ao sistema."
        actions={
          isAdmin && (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="outline" disabled>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  }
                />
                <TooltipContent>Em breve</TooltipContent>
              </Tooltip>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Novo colaborador
              </Button>
            </>
          )
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v ?? 'all')} items={STATUS_FILTER_ITEMS}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_ITEMS.map((it) => (
                <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <MultiSelectFilter
            label="Cargos"
            options={positionOptions}
            value={positionFilter}
            onChange={onPositionFilterChange}
            width="w-40"
          />
          <MultiSelectFilter
            label="Departamentos"
            options={departmentOptions}
            value={departmentFilter}
            onChange={onDepartmentFilterChange}
            width="w-48"
          />
          <MultiSelectFilter
            label="Gestores"
            options={managerOptions}
            value={managerFilter}
            onChange={onManagerFilterChange}
            width="w-44"
          />

          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Colunas
                </Button>
              }
            />
            <PopoverContent align="end" className="w-48 p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Colunas adicionais</p>
              {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
                <label key={key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={columns[key]}
                    onChange={(e) => setColumns({ ...columns, [key]: e.target.checked })}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  {COLUMN_LABELS[key]}
                </label>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {specialFilter === 'sem_feedback' && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900/40 dark:bg-amber-950/30">
            <Badge variant="secondary">Sem feedback (90d)</Badge>
            <span className="text-muted-foreground">
              Mostrando apenas colaboradores ativos sem feedback recebido nos últimos 90 dias.
            </span>
            <Button variant="ghost" size="sm" onClick={clearSpecialFilter} className="ml-auto">
              Limpar filtro
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-2.5 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{metrics.ativos}</span> ativo{metrics.ativos === 1 ? '' : 's'}
            {' · '}
            <span className="font-medium text-foreground">{metrics.pendentes}</span> convite{metrics.pendentes === 1 ? '' : 's'} pendente{metrics.pendentes === 1 ? '' : 's'}
            {metrics.desligados > 0 && !showTerminated && (
              <>{' · '}<span className="font-medium text-foreground">{metrics.desligados}</span> desligado{metrics.desligados === 1 ? '' : 's'} oculto{metrics.desligados === 1 ? '' : 's'}</>
            )}
          </p>
          <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showTerminated}
              onChange={(e) => onShowTerminatedChange(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Mostrar desligados
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum colaborador encontrado"
            description={
              search || statusFilter !== 'all' || positionFilter.length > 0 || departmentFilter.length > 0 || managerFilter.length > 0
                ? 'Tente outros filtros.'
                : 'Adicione o primeiro colaborador.'
            }
            action={isAdmin ? (
              <Button onClick={openCreate}>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo colaborador
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="rounded-md border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {columns.email && <TableHead>E-mail</TableHead>}
                  <TableHead>Cargo</TableHead>
                  {columns.role && <TableHead>Papel</TableHead>}
                  <TableHead>Departamento</TableHead>
                  <TableHead>Gestor direto</TableHead>
                  {columns.admission && <TableHead>Admissão</TableHead>}
                  {columns.phone && <TableHead>Telefone</TableHead>}
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((emp) => {
                  const status = deriveStatus(emp);
                  const isSelf = emp.user_id === currentUserId;
                  const pendingInvite = emp.invite?.find(
                    (i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) > new Date(),
                  );
                  const expiredInvite = emp.invite?.find(
                    (i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) <= new Date(),
                  );
                  const role = (emp.user_id && profileRoles[emp.user_id]) || 'user';
                  const rolePill = ROLE_PILL[role];

                  return (
                    <TableRow
                      key={emp.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/colaboradores/${emp.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Link href={`/colaboradores/${emp.id}`} className="block hover:underline">
                          <p className="font-medium">
                            {emp.full_name}
                            {isSelf && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                          </p>
                        </Link>
                      </TableCell>
                      {columns.email && <TableCell>{emp.email}</TableCell>}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span>{emp.position?.name ?? '—'}</span>
                          {!columns.role && rolePill && (
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">· {rolePill}</span>
                          )}
                        </div>
                      </TableCell>
                      {columns.role && (
                        <TableCell>
                          {ROLE_PILL[role] ?? 'Colaborador'}
                        </TableCell>
                      )}
                      <TableCell>{emp.department?.name ?? '—'}</TableCell>
                      <TableCell>{emp.manager?.full_name ?? '—'}</TableCell>
                      {columns.admission && <TableCell>{formatDate(emp.hire_date)}</TableCell>}
                      {columns.phone && <TableCell>{emp.phone ?? '—'}</TableCell>}
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[status]}>
                          {STATUS_LABELS[status]}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/colaboradores/${emp.id}`)}>
                                Ver perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(emp)}>
                                Editar
                              </DropdownMenuItem>
                              {pendingInvite && (
                                <DropdownMenuItem onClick={() => handleRevoke(pendingInvite.id)}>
                                  Revogar convite
                                </DropdownMenuItem>
                              )}
                              {expiredInvite && (
                                <DropdownMenuItem onClick={() => handleResend(emp.id)}>
                                  Reenviar convite
                                </DropdownMenuItem>
                              )}
                              {status === 'sem_acesso' && (
                                <DropdownMenuItem onClick={() => handleResend(emp.id)}>
                                  Enviar convite
                                </DropdownMenuItem>
                              )}
                              {!isSelf && (
                                <>
                                  <DropdownMenuSeparator />
                                  {status === 'ativo' && (
                                    <DropdownMenuItem onClick={() => openStatusDialog('deactivate', emp)}>
                                      Desativar
                                    </DropdownMenuItem>
                                  )}
                                  {status === 'inativo' && (
                                    <DropdownMenuItem onClick={() => openStatusDialog('reactivate', emp)}>
                                      Reativar
                                    </DropdownMenuItem>
                                  )}
                                  {(status === 'ativo' || status === 'inativo') && (
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => openStatusDialog('terminate', emp)}
                                    >
                                      Desligar
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <PaginationControls
              page={effectivePage}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={(o) => { setSheetOpen(o); if (!o) setEditing(null); }}
        positions={positions}
        departments={departments}
        managers={potentialManagers}
        employee={editing}
        isAdmin={isAdmin}
      />

      <ConfirmStatusDialog
        open={!!statusAction}
        action={statusAction ?? 'deactivate'}
        target={statusTarget}
        managerCandidates={potentialManagers}
        onOpenChange={(o) => { if (!o) { setStatusAction(null); setStatusTarget(null); } }}
      />
    </div>
  );
}

function collectDescendantIds(rootId: string, all: Employee[]): string[] {
  const result: string[] = [];
  const queue = [rootId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const e of all) {
      if (e.manager_id === current) {
        result.push(e.id);
        queue.push(e.id);
      }
    }
  }
  return result;
}
