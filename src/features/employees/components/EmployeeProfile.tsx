'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeSheet, type ExistingEmployee } from './EmployeeSheet';
import { ConfirmStatusDialog, type StatusAction } from './ConfirmStatusDialog';
import { FeedbackCard } from '@/features/feedbacks/components/FeedbackCard';
import type { FeedbackRow } from '@/features/feedbacks/queries';
import { formatDate, formatDateTime } from '@/lib/date';
import { ACTIVITY_LABELS } from '@/lib/activity';
import { resendInvite, revokeInvite, updateRole } from '../actions';

type Employee = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  hire_date: string;
  user_id: string | null;
  terminated_at: string | null;
  internal_notes?: string | null;
  position: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  manager: {
    id: string;
    full_name: string;
    position: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
  } | null;
  invite: { id: string; role: string; expires_at: string; accepted_at: string | null; revoked_at: string | null }[] | null;
};

type DirectReport = { id: string; full_name: string; position: { id: string; name: string } | null };
type ActivityLog = {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  actor_user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type Role = 'admin_rh' | 'director' | 'user';

interface Position { id: string; name: string }
interface Department { id: string; name: string }
interface ManagerOption { id: string; full_name: string }

interface Props {
  employee: Employee;
  directReports: DirectReport[];
  activityLog: ActivityLog[];
  role: Role | null;
  lastSignInAt: string | null;
  isAdmin: boolean;
  isSelf: boolean;
  canSeeInternalNotes: boolean;
  positions: Position[];
  departments: Department[];
  managers: ManagerOption[];
  descendantIds: string[];
  subordinatesCount: number;
  actors: Record<string, string>;
  feedbacks: FeedbackRow[];
}

const ROLE_LABELS: Record<Role, string> = {
  admin_rh: 'Admin RH',
  director: 'Diretor',
  user: 'Colaborador',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  terminated: 'Desligado',
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
}

export function EmployeeProfile({
  employee, directReports, activityLog, role, lastSignInAt, isAdmin, isSelf,
  canSeeInternalNotes, positions, departments, managers, descendantIds,
  subordinatesCount, actors, feedbacks,
}: Props) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);

  const existing: ExistingEmployee = {
    id: employee.id,
    full_name: employee.full_name,
    email: employee.email,
    phone: employee.phone,
    positionId: employee.position?.id ?? null,
    departmentId: employee.department?.id ?? null,
    managerId: employee.manager?.id ?? null,
    role: role ?? 'user',
    hireDate: employee.hire_date,
    isSelf,
    internalNotes: canSeeInternalNotes ? employee.internal_notes ?? null : null,
    descendantIds,
  };

  const accountActivity = useMemo(() => {
    if (!employee.user_id) return [];
    return activityLog
      .filter((l) => l.actor_user_id === employee.user_id)
      .slice(0, 10);
  }, [activityLog, employee.user_id]);

  const pendingInvite = employee.invite?.find(
    (i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) > new Date(),
  );
  const expiredInvite = employee.invite?.find(
    (i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) <= new Date(),
  );
  const acceptedInvite = employee.invite?.find((i) => i.accepted_at);

  async function handleResend() {
    const r = await resendInvite(employee.id);
    if (r.error) toast.error(r.error);
    else toast.success(r.warning ?? 'Convite reenviado!');
  }
  async function handleRevoke(inviteId: string) {
    const r = await revokeInvite(inviteId);
    if (r.error) toast.error(r.error);
    else toast.success('Convite revogado.');
  }
  async function handleRoleChange(newRole: Role) {
    if (!employee.user_id) return;
    const r = await updateRole(employee.user_id, newRole);
    if (r.error) toast.error(r.error);
    else { toast.success('Papel atualizado.'); router.refresh(); }
  }

  return (
    <div>
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href="/colaboradores" className="hover:text-foreground transition-colors">Colaboradores</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate">{employee.full_name}</span>
      </nav>

      <div className="flex items-start gap-4 pb-6 mb-6 border-b">
        <Avatar size="lg" className="size-14">
          <AvatarImage src={undefined} alt={employee.full_name} />
          <AvatarFallback className="text-base">{initials(employee.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold tracking-tight">{employee.full_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {employee.position && <span>{employee.position.name}</span>}
            {employee.department && <>
              <span>·</span>
              <span>{employee.department.name}</span>
            </>}
            <span>·</span>
            <Badge variant={employee.status === 'active' ? 'default' : 'outline'}>
              {STATUS_LABEL[employee.status] ?? employee.status}
            </Badge>
            {role && (
              <>
                <span>·</span>
                <span>{ROLE_LABELS[role]}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setSheetOpen(true)}>Editar</Button>
          )}
          {isAdmin && !isSelf && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-muted transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {pendingInvite && (
                  <DropdownMenuItem onClick={() => handleRevoke(pendingInvite.id)}>Revogar convite</DropdownMenuItem>
                )}
                {(expiredInvite || (!employee.user_id && !pendingInvite)) && (
                  <DropdownMenuItem onClick={handleResend}>
                    {expiredInvite ? 'Reenviar convite' : 'Enviar convite'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {employee.status === 'active' && (
                  <DropdownMenuItem onClick={() => setStatusAction('deactivate')}>Desativar</DropdownMenuItem>
                )}
                {employee.status === 'inactive' && (
                  <DropdownMenuItem onClick={() => setStatusAction('reactivate')}>Reativar</DropdownMenuItem>
                )}
                {(employee.status === 'active' || employee.status === 'inactive') && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setStatusAction('terminate')}
                  >
                    Desligar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="acesso">Acesso</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabDisabled label="Avaliações" tip="Disponível quando FT-2 for implementada" />
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabDisabled label="PDI" tip="Disponível quando FT-4 for implementada" />
        </TabsList>

        <TabsContent value="dados" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-1">
              <section className="rounded-md border divide-y">
                <FieldRow label="Nome completo" value={employee.full_name} />
                <FieldRow label="E-mail" value={employee.email} />
                <FieldRow label="Telefone" value={employee.phone ?? '—'} />
                <FieldRow label="Cargo" value={employee.position?.name ?? '—'} />
                <FieldRow label="Departamento" value={employee.department?.name ?? '—'} />
                <FieldRow
                  label="Gestor direto"
                  value={employee.manager ? (
                    <Link href={`/colaboradores/${employee.manager.id}`} className="text-primary hover:underline">
                      {employee.manager.full_name}
                      {employee.manager.position && (
                        <span className="text-muted-foreground"> ({employee.manager.position.name}{employee.manager.department ? ` · ${employee.manager.department.name}` : ''})</span>
                      )}
                    </Link>
                  ) : '—'}
                />
                <FieldRow label="Data de admissão" value={formatDate(employee.hire_date)} />
                <FieldRow
                  label="Status"
                  value={
                    <span className="flex items-center gap-1.5">
                      <StatusDot status={employee.status} />
                      {STATUS_LABEL[employee.status] ?? employee.status}
                      {employee.status === 'terminated' && employee.terminated_at && (
                        <span className="text-muted-foreground text-xs">· desligado em {formatDate(employee.terminated_at)}</span>
                      )}
                    </span>
                  }
                />
              </section>

              {canSeeInternalNotes && (
                <section className="rounded-md border p-4 mt-4 bg-amber-50/40 dark:bg-amber-950/10">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-500 mb-2">
                    Observações internas · visível só para RH
                  </p>
                  {employee.internal_notes ? (
                    <p className="whitespace-pre-wrap text-sm text-foreground">{employee.internal_notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhuma observação.</p>
                  )}
                </section>
              )}
            </div>

            <aside className="space-y-4">
              {subordinatesCount > 0 && (
                <section className="rounded-md border p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Liderados diretos ({subordinatesCount})
                  </p>
                  <ul className="space-y-2">
                    {directReports.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={`/colaboradores/${r.id}`}
                          className="block rounded-md px-2 py-1.5 hover:bg-muted transition-colors text-sm"
                        >
                          <p className="font-medium">{r.full_name}</p>
                          {r.position && <p className="text-xs text-muted-foreground">{r.position.name}</p>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="rounded-md border p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Acesso ao sistema
                </p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Papel</dt>
                    <dd className="font-medium">{role ? ROLE_LABELS[role] : '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Último login</dt>
                    <dd>{lastSignInAt ? formatDateTime(lastSignInAt) : '—'}</dd>
                  </div>
                  <div className="flex justify-between items-start">
                    <dt className="text-muted-foreground">Convite</dt>
                    <dd className="text-right">
                      {acceptedInvite ? (
                        <span>Aceito em {formatDate(acceptedInvite.accepted_at!)}</span>
                      ) : pendingInvite ? (
                        <span className="text-amber-600">Pendente · expira em {formatDate(pendingInvite.expires_at)}</span>
                      ) : expiredInvite ? (
                        <span className="text-destructive">Expirado</span>
                      ) : employee.user_id ? (
                        <span>—</span>
                      ) : (
                        <span className="text-muted-foreground">Sem acesso</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="acesso" className="mt-6 max-w-2xl">
          <div className="space-y-6">
            <section className="rounded-md border divide-y">
              <FieldRow label="E-mail" value={employee.email} />
              <FieldRow label="Papel atual" value={role ? ROLE_LABELS[role] : '—'} />
              <FieldRow label="Último login" value={lastSignInAt ? formatDateTime(lastSignInAt) : '—'} />
            </section>

            {isAdmin && employee.user_id && !isSelf && (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Alterar papel
                </p>
                <div className="flex items-center gap-2 max-w-sm">
                  <Select value={role ?? 'user'} onValueChange={(v) => handleRoleChange(v as Role)}
                    items={(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => ({ value, label }))}
                  >
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
            )}

            {isAdmin && (
              <section className="flex flex-wrap gap-2">
                {(expiredInvite || (!employee.user_id && !pendingInvite)) && (
                  <Button variant="outline" onClick={handleResend}>
                    {expiredInvite ? 'Reenviar convite' : 'Enviar convite'}
                  </Button>
                )}
                {pendingInvite && (
                  <Button variant="outline" onClick={() => handleRevoke(pendingInvite.id)}>
                    Revogar convite
                  </Button>
                )}
              </section>
            )}

            <section>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Atividade da conta
              </p>
              {accountActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade registrada{lastSignInAt ? '' : ' e nenhum login conhecido'}.
                </p>
              ) : (
                <ol className="rounded-md border divide-y">
                  {accountActivity.map((log) => (
                    <li key={log.id} className="px-4 py-2 text-sm flex justify-between gap-4">
                      <span className="font-medium">{ACTIVITY_LABELS[log.action] ?? log.action}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Histórico detalhado de logins não está disponível nesta versão — apenas o último login é exibido.
              </p>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          {activityLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
          ) : (
            <ol className="space-y-3">
              {activityLog.map((log) => (
                <li key={log.id} className="flex gap-3 rounded-md border p-3 text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {ACTIVITY_LABELS[log.action] ?? log.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTime(log.created_at)}
                      {log.actor_user_id && actors[log.actor_user_id]
                        ? ` · por ${actors[log.actor_user_id]}`
                        : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>

        <TabsContent value="feedbacks" className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {feedbacks.length} feedback{feedbacks.length === 1 ? '' : 's'} recebido{feedbacks.length === 1 ? '' : 's'}
              <span className="text-muted-foreground/70"> · conforme sua visibilidade</span>
            </p>
            {!isSelf && (
              <Link href={`/feedbacks/novo?recipient=${employee.id}`}>
                <Button size="sm" variant="outline">Enviar feedback</Button>
              </Link>
            )}
          </div>
          {feedbacks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhum feedback para exibir.</p>
          ) : (
            <ul className="space-y-3">
              {feedbacks.map((fb) => (
                <li key={fb.id}>
                  <FeedbackCard
                    feedback={fb}
                    perspective="received"
                    isAdmin={isAdmin}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        positions={positions}
        departments={departments}
        managers={managers}
        employee={existing}
        isAdmin={isAdmin}
      />

      <ConfirmStatusDialog
        open={!!statusAction}
        action={statusAction ?? 'deactivate'}
        target={{ id: employee.id, full_name: employee.full_name, subordinatesCount }}
        managerCandidates={managers}
        onOpenChange={(o) => !o && setStatusAction(null)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-3">
      <p className="w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground flex-1 min-w-0">{value}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'active' ? 'bg-emerald-500'
      : status === 'inactive' ? 'bg-muted-foreground/60'
        : status === 'terminated' ? 'bg-destructive' : 'bg-muted-foreground';
  return <span className={`inline-block size-2 rounded-full ${color}`} />;
}

function TabDisabled({ label, tip }: { label: string; tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex items-center rounded-md px-2 py-1 text-sm text-muted-foreground/50 cursor-not-allowed">
            {label}
            <span className="ml-1.5 text-[10px] uppercase">em breve</span>
          </span>
        }
      />
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}
