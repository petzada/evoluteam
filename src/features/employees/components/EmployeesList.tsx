'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { MoreHorizontal, Plus, Search, UserPlus, Users } from 'lucide-react';
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
import { EmployeeSheet, type ExistingEmployee } from './EmployeeSheet';
import { resendInvite, revokeInvite, deactivateEmployee } from '../actions';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

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
}

function deriveStatus(emp: Employee): 'ativo' | 'convite_pendente' | 'convite_expirado' | 'sem_acesso' | 'inativo' {
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

const STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  convite_pendente: 'Convite pendente',
  convite_expirado: 'Convite expirado',
  sem_acesso: 'Sem acesso',
  inativo: 'Inativo',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  ativo: 'default',
  convite_pendente: 'secondary',
  convite_expirado: 'outline',
  sem_acesso: 'outline',
  inativo: 'outline',
};

export function EmployeesList({
  employees,
  positions,
  departments,
  currentUserId,
  isAdmin,
  profileRoles,
  openSheet = false,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(openSheet);
  const [editing, setEditing] = useState<ExistingEmployee | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        !search ||
        emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());
      const status = deriveStatus(emp);
      const matchStatus = statusFilter === 'all' || status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [employees, search, statusFilter]);

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
    });
    setSheetOpen(true);
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

  async function handleDeactivate(employeeId: string) {
    const result = await deactivateEmployee(employeeId);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Colaborador desativado.');
  }

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        description="Gerencie sua equipe, papéis e convites."
        actions={
          isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo colaborador
            </Button>
          )
        }
      />

      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="convite_pendente">Convite pendente</SelectItem>
              <SelectItem value="convite_expirado">Convite expirado</SelectItem>
              <SelectItem value="sem_acesso">Sem acesso</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum colaborador encontrado"
            description={search || statusFilter !== 'all' ? 'Tente outros filtros.' : 'Adicione o primeiro colaborador.'}
            action={isAdmin ? (
              <Button onClick={openCreate}>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo colaborador
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / E-mail</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Gestor direto</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => {
                  const status = deriveStatus(emp);
                  const isSelf = emp.user_id === currentUserId;
                  const pendingInvite = emp.invite?.find(
                    (i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) > new Date(),
                  );
                  const expiredInvite = emp.invite?.find(
                    (i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) <= new Date(),
                  );

                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {emp.full_name}
                            {isSelf && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">{emp.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{emp.position?.name ?? '—'}</TableCell>
                      <TableCell>{emp.department?.name ?? '—'}</TableCell>
                      <TableCell>{emp.manager?.full_name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[status]}>
                          {STATUS_LABELS[status]}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                              {!isSelf && status === 'ativo' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeactivate(emp.id)}
                                  >
                                    Desativar
                                  </DropdownMenuItem>
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
          </div>
        )}
      </div>

      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={(o) => { setSheetOpen(o); if (!o) setEditing(null); }}
        positions={positions}
        departments={departments}
        managers={employees.filter((e) => e.full_name).map((e) => ({ id: e.id, full_name: e.full_name }))}
        employee={editing}
      />
    </div>
  );
}
