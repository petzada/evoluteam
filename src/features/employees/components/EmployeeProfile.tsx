'use client';

import { useState } from 'react';
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
import { AccessSheet } from '@/features/permissions/components/AccessSheet';
import {
  getRoleDisplayLabel,
  type Role as CentralRole,
  type ScreenPermissions,
} from '@/features/permissions/types';
import { EmployeeSheet, type ExistingEmployee } from './EmployeeSheet';
import { ConfirmStatusDialog, type StatusAction } from './ConfirmStatusDialog';
import { FeedbackCard } from '@/features/feedbacks/components/FeedbackCard';
import type { FeedbackRow } from '@/features/feedbacks/queries';
import type { ReviewCycleForEmployee } from '@/features/reviews/queries';
import { PdiCard } from '@/features/pdi/components/PdiCard';
import {
  PdiSheet, type EmployeeOption as PdiEmployeeOption, type CompetencyOption as PdiCompetencyOption,
  type CycleOption as PdiCycleOption,
} from '@/features/pdi/components/PdiSheet';
import type { PlanRow } from '@/features/pdi/queries';
import { computePdiStatus } from '@/features/pdi/utils';
import {
  PDI_STATUSES, PDI_STATUS_LABELS, type PdiComputedStatus,
} from '@/features/pdi/schema';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { formatDate, formatDateTime } from '@/lib/date';
import { ACTIVITY_LABELS } from '@/lib/activity';
import { statusClass } from '@/lib/status-colors';
import {
  deriveReviewCycleStatus,
  employeeRecordStatusToken,
  REVIEW_CYCLE_STATUS_LABELS,
  reviewCycleStatusToken,
} from '@/lib/status-mappers';
import { resendInvite, revokeInvite } from '../actions';

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

type Role = CentralRole;

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
  reviewCycles: ReviewCycleForEmployee[];
  canSeeResults: boolean;
  initialTab?: string;
  pdis: PlanRow[];
  canCreatePdi: boolean;
  pdiEmployees: PdiEmployeeOption[];
  pdiCompetencies: PdiCompetencyOption[];
  pdiCycles: PdiCycleOption[];
  actorEmployeeId: string | null;
  recruitmentSource?: {
    candidateId: string;
    jobOpeningId: string;
    jobTitle: string;
    hiredAt: string;
  } | null;
  // FT-9 · drawer de Gerenciar acesso
  targetScreenPermissions: ScreenPermissions;
  currentActorRole: CentralRole;
  /**
   * true se o actor atual e admin_rh; false se e Colaborador com
   * colaboradores.edit (so concede 'user' e subset dos proprios toggles).
   */
  actorIsAdmin: boolean;
  actorScreenPermissions?: ScreenPermissions;
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  terminated: 'Desligado',
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
}

const VALID_TABS = ['dados', 'acesso', 'historico', 'avaliacoes', 'feedbacks', 'pdi'] as const;

export function EmployeeProfile({
  employee, directReports, activityLog, role, lastSignInAt, isAdmin, isSelf,
  targetScreenPermissions, currentActorRole, actorIsAdmin, actorScreenPermissions,
  canSeeInternalNotes, positions, departments, managers, descendantIds,
  subordinatesCount, actors, feedbacks, reviewCycles, canSeeResults, initialTab,
  pdis, canCreatePdi, pdiEmployees, pdiCompetencies, pdiCycles, actorEmployeeId,
  recruitmentSource,
}: Props) {
  const resolvedInitialTab = VALID_TABS.includes(initialTab as typeof VALID_TABS[number])
    ? (initialTab as typeof VALID_TABS[number])
    : 'dados';
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pdiSheetOpen, setPdiSheetOpen] = useState(false);
  const [accessSheetOpen, setAccessSheetOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [pdiStatusFilter, setPdiStatusFilter] = useState<string[]>([]);
  const [pdiCompetencyFilter, setPdiCompetencyFilter] = useState<string[]>([]);

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
            <Badge className={statusClass(employeeRecordStatusToken(employee.status))}>
              {STATUS_LABEL[employee.status] ?? employee.status}
            </Badge>
            {role && (
              <>
                <span>·</span>
                <span>{getRoleDisplayLabel(role, targetScreenPermissions)}</span>
              </>
            )}
            {recruitmentSource && (
              <>
                <span>·</span>
                <Link
                  href={`/recrutamento/candidatos/${recruitmentSource.candidateId}`}
                  className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-900 text-[10.5px] font-medium px-2 py-0.5 hover:bg-sky-200 transition-colors"
                  title={`Contratado(a) via processo seletivo "${recruitmentSource.jobTitle}"`}
                >
                  📥 via recrutamento
                </Link>
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

      <Tabs defaultValue={resolvedInitialTab}>
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="acesso">Acesso</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabsTrigger value="pdi">PDI</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-1">
              <section className="rounded-md border bg-card shadow-card divide-y">
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
                <section className="rounded-md border bg-card p-4 shadow-card">
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

              <section className="rounded-md border bg-card p-4 shadow-card">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Acesso ao sistema
                </p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Papel</dt>
                    <dd className="font-medium">{role ? getRoleDisplayLabel(role, targetScreenPermissions) : '—'}</dd>
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
            <section className="rounded-md border bg-card shadow-card divide-y">
              <FieldRow label="E-mail" value={employee.email} />
              <FieldRow label="Papel atual" value={role ? getRoleDisplayLabel(role, targetScreenPermissions) : '—'} />
              <FieldRow label="Último login" value={lastSignInAt ? formatDateTime(lastSignInAt) : '—'} />
            </section>

            {employee.user_id && !isSelf && (actorIsAdmin || (!actorIsAdmin && role === 'user')) && (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Acesso
                </p>
                <Button variant="outline" size="sm" onClick={() => setAccessSheetOpen(true)}>
                  Gerenciar acesso
                </Button>
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

          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          {activityLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
          ) : (
            <ol className="space-y-3">
              {activityLog.map((log) => (
                <li key={log.id} className="flex gap-3 rounded-md border bg-card p-3 text-sm shadow-card">
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

        <TabsContent value="avaliacoes" className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {reviewCycles.length} ciclo{reviewCycles.length === 1 ? '' : 's'} de avaliação
              <span className="text-muted-foreground/70"> · conforme sua visibilidade</span>
            </p>
          </div>
          {reviewCycles.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Este colaborador ainda não participou de nenhum ciclo.
            </p>
          ) : (
            <ul className="space-y-3">
              {reviewCycles.map((c) => {
                const canView = canSeeResults || (isSelf && c.isReleased);
                const resultHref = `/avaliacoes/${c.cycleId}/resultados/${employee.id}`;
                const cycleDerivedStatus = deriveReviewCycleStatus(
                  c.status,
                  c.responseStart,
                  c.responseEnd,
                );
                return (
                  <li key={c.cycleId} className="rounded-md border bg-card p-4 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/avaliacoes/${c.cycleId}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {c.cycleName}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Período {formatDate(c.periodStart)} – {formatDate(c.periodEnd)}
                          {' · '}
                          Prazo {formatDate(c.responseStart)} – {formatDate(c.responseEnd)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge className={statusClass(reviewCycleStatusToken(cycleDerivedStatus))}>
                          {REVIEW_CYCLE_STATUS_LABELS[cycleDerivedStatus]}
                        </Badge>
                        {isSelf && !c.isReleased && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            Resultado não liberado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-muted-foreground">Média geral</span>
                        <span className="text-lg font-semibold">
                          {c.avgOverall !== null ? c.avgOverall.toFixed(1) : '—'}
                        </span>
                        {c.avgOverall !== null && (
                          <span className="text-xs text-muted-foreground">/5</span>
                        )}
                      </div>
                      {canView ? (
                        <Link href={resultHref}>
                          <Button size="sm" variant="outline">Ver resultado</Button>
                        </Link>
                      ) : (
                        <Button size="sm" variant="outline" disabled>Ver resultado</Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
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

        <TabsContent value="pdi" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground">
              {pdis.length} PDI{pdis.length === 1 ? '' : 's'}
              <span className="text-muted-foreground/70"> · conforme sua visibilidade</span>
            </p>
            {canCreatePdi && (
              <Button size="sm" onClick={() => setPdiSheetOpen(true)}>
                Criar PDI
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <MultiSelectFilter
              label="Status"
              options={([...PDI_STATUSES, 'atrasado'] as PdiComputedStatus[]).map((s) => ({
                value: s, label: PDI_STATUS_LABELS[s],
              }))}
              value={pdiStatusFilter}
              onChange={setPdiStatusFilter}
              width="w-44"
            />
            <MultiSelectFilter
              label="Competências"
              options={[
                { value: '__none__', label: 'Sem competência' },
                ...pdiCompetencies.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={pdiCompetencyFilter}
              onChange={setPdiCompetencyFilter}
              width="w-52"
            />
          </div>
          {(() => {
            const filtered = pdis.filter((p) => {
              if (pdiStatusFilter.length && !pdiStatusFilter.includes(computePdiStatus(p))) return false;
              if (pdiCompetencyFilter.length && !pdiCompetencyFilter.includes(p.competency_id ?? '__none__')) return false;
              return true;
            });
            if (filtered.length === 0) {
              return (
                <p className="text-sm text-muted-foreground italic">Nenhum PDI para exibir.</p>
              );
            }
            return (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <PdiCard plan={p} showEmployee={false} />
                  </li>
                ))}
              </ul>
            );
          })()}
        </TabsContent>
      </Tabs>

      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        positions={positions}
        departments={departments}
        managers={managers}
        employee={existing}
        canManageEmployees={isAdmin}
        actorIsAdmin={actorIsAdmin}
        actorScreenPermissions={actorScreenPermissions}
      />

      <PdiSheet
        open={pdiSheetOpen}
        onOpenChange={setPdiSheetOpen}
        employees={pdiEmployees}
        competencies={pdiCompetencies}
        cycles={pdiCycles}
        isAdmin={isAdmin}
        actorEmployeeId={actorEmployeeId}
        presetEmployeeId={employee.id}
      />

      {employee.user_id && (
        <AccessSheet
          open={accessSheetOpen}
          onOpenChange={setAccessSheetOpen}
          profileId={employee.user_id}
          fullName={employee.full_name}
          email={employee.email}
          initialRole={(role ?? 'user')}
          initialScreenPermissions={targetScreenPermissions}
          currentActorRole={currentActorRole}
          actorIsAdmin={actorIsAdmin}
          actorScreenPermissions={actorScreenPermissions}
        />
      )}

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
  const token = employeeRecordStatusToken(status);
  const color =
    token === 'success' ? 'bg-emerald-500'
      : token === 'warning' ? 'bg-amber-500'
        : token === 'danger' ? 'bg-red-500'
          : 'bg-slate-400';
  return <span className={`inline-block size-2 rounded-full ${color}`} />;
}

