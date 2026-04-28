import type { PdiActionComputedStatus, PdiComputedStatus } from '@/features/pdi/schema';
import type { ApplicationStatus, JobOpeningStatus } from '@/features/recruitment/schema';
import type { StatusToken } from '@/lib/status-colors';

export type EmployeeListStatus =
  | 'ativo'
  | 'inativo'
  | 'desligado'
  | 'convite_pendente'
  | 'convite_expirado'
  | 'sem_acesso';

export type EmployeeRecordStatus = 'active' | 'inactive' | 'terminated' | string;

interface InviteStatusSource {
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

interface EmployeeListStatusSource {
  status: string;
  user_id: string | null;
  invite?: InviteStatusSource[] | null;
}

export function deriveEmployeeListStatus(
  employee: EmployeeListStatusSource,
  now: Date = new Date(),
): EmployeeListStatus {
  if (employee.status === 'terminated') return 'desligado';
  if (employee.status === 'inactive') return 'inativo';
  if (employee.user_id) return 'ativo';

  const invites = employee.invite ?? [];
  const pending = invites.some(
    (invite) =>
      !invite.accepted_at &&
      !invite.revoked_at &&
      new Date(invite.expires_at) > now,
  );
  if (pending) return 'convite_pendente';

  const expired = invites.some(
    (invite) =>
      !invite.accepted_at &&
      !invite.revoked_at &&
      new Date(invite.expires_at) <= now,
  );
  if (expired) return 'convite_expirado';

  return 'sem_acesso';
}

export function employeeListStatusToken(status: EmployeeListStatus): StatusToken {
  switch (status) {
    case 'ativo':
      return 'success';
    case 'inativo':
    case 'convite_pendente':
      return 'warning';
    case 'desligado':
    case 'convite_expirado':
      return 'danger';
    case 'sem_acesso':
    default:
      return 'neutral';
  }
}

export function employeeRecordStatusToken(status: EmployeeRecordStatus): StatusToken {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'warning';
    case 'terminated':
      return 'danger';
    default:
      return 'neutral';
  }
}

export type ReviewCycleDerivedStatus = 'draft' | 'scheduled' | 'in_progress' | 'closed' | 'archived';

export const REVIEW_CYCLE_STATUS_LABELS: Record<ReviewCycleDerivedStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  closed: 'Encerrado',
  archived: 'Arquivado',
};

export function deriveReviewCycleStatus(
  status: string,
  responseStart: string,
  responseEnd: string,
  now: Date = new Date(),
): ReviewCycleDerivedStatus {
  if (status === 'draft') return 'draft';
  if (status === 'closed') return 'closed';
  if (status === 'archived') return 'archived';
  if (new Date(responseStart) > now) return 'scheduled';
  if (new Date(responseEnd) < now) return 'closed';
  return 'in_progress';
}

export function reviewCycleStatusToken(status: ReviewCycleDerivedStatus): StatusToken {
  switch (status) {
    case 'scheduled':
    case 'in_progress':
      return 'warning';
    case 'closed':
      return 'danger';
    case 'draft':
      return 'neutral';
    case 'archived':
    default:
      return 'archived';
  }
}

export const REVIEW_ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em progresso',
  submitted: 'Enviado',
  cancelled: 'Cancelado',
};

export function reviewAssignmentStatusToken(status: string): StatusToken {
  switch (status) {
    case 'pending':
    case 'in_progress':
      return 'warning';
    case 'submitted':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function pdiStatusToken(status: PdiComputedStatus): StatusToken {
  switch (status) {
    case 'em_andamento':
    case 'atrasado':
      return 'warning';
    case 'concluido':
      return 'success';
    case 'cancelado':
      return 'danger';
    case 'nao_iniciado':
    default:
      return 'neutral';
  }
}

export function pdiActionStatusToken(status: PdiActionComputedStatus): StatusToken {
  switch (status) {
    case 'em_andamento':
    case 'pendente':
    case 'atrasada':
      return 'warning';
    case 'concluida':
      return 'success';
    case 'cancelada':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function recruitmentJobOpeningStatusToken(status: JobOpeningStatus): StatusToken {
  switch (status) {
    case 'open':
      return 'success';
    case 'paused':
      return 'warning';
    case 'closed':
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function recruitmentApplicationStatusToken(status: ApplicationStatus): StatusToken {
  switch (status) {
    case 'hired':
      return 'success';
    case 'in_progress':
    case 'frozen':
      return 'warning';
    case 'rejected':
    case 'withdrawn':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function taxonomyStatusToken(isArchived: boolean): StatusToken {
  return isArchived ? 'archived' : 'success';
}
