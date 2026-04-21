import { createAdminSupabaseClient } from '@/lib/supabase/admin';

type ActivityAction =
  | 'company.created' | 'company.updated'
  | 'user.invited' | 'user.activated' | 'user.deactivated' | 'user.updated' | 'user.role_changed'
  | 'invite.sent' | 'invite.accepted' | 'invite.revoked' | 'invite.resent'
  | 'employee.created' | 'employee.updated' | 'employee.terminated'
  | 'review_cycle.created' | 'review_cycle.updated' | 'review_cycle.published'
  | 'review_cycle.closed' | 'review_cycle.archived' | 'review_cycle.reminded'
  | 'review_assignment.submitted' | 'review_assignment.cancelled'
  | 'review_result.released' | 'review_result.hidden'
  | 'feedback.created' | 'feedback.deleted'
  | 'pdi.created' | 'pdi.updated' | 'pdi.concluded' | 'pdi.cancelled' | 'pdi.deleted'
  | 'pdi_action.created' | 'pdi_action.updated'
  | 'department.created' | 'department.updated' | 'department.archived' | 'department.deleted'
  | 'role.created' | 'role.updated' | 'role.archived' | 'role.deleted'
  | 'competency.created' | 'competency.updated' | 'competency.archived' | 'competency.deleted'
  // FT-7 Recrutamento — declarados na Fundação; disparos nas ondas.
  | 'job_opening.created' | 'job_opening.updated'
  | 'job_opening.status_changed' | 'job_opening.archived'
  | 'candidate.created' | 'candidate.updated' | 'candidate.archived'
  | 'application.created' | 'application.stage_moved'
  | 'application.withdrawn' | 'application.rejected'
  | 'application.frozen' | 'application.hired'
  | 'recruitment_stage.created' | 'recruitment_stage.updated'
  | 'recruitment_stage.archived' | 'recruitment_stage.reordered'
  | 'candidate_feedback.created' | 'candidate_feedback.deleted'
  | 'candidate_scorecard.submitted' | 'candidate_scorecard.updated' | 'candidate_scorecard.deleted'
  | 'candidate_task.created' | 'candidate_task.updated'
  | 'candidate_task.completed' | 'candidate_task.reopened' | 'candidate_task.deleted';

export async function logActivity({
  companyId,
  actorUserId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  companyId: string;
  actorUserId?: string | null;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabaseClient();
  await supabase.from('activity_logs').insert({
    company_id: companyId,
    actor_user_id: actorUserId ?? null,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata: (metadata ?? {}) as Record<string, unknown> as never,
  });
}

export const ACTIVITY_LABELS: Record<string, string> = {
  'company.created': 'Empresa criada',
  'company.updated': 'Empresa atualizada',
  'user.invited': 'Usuário convidado',
  'user.activated': 'Usuário ativado',
  'user.deactivated': 'Usuário desativado',
  'user.updated': 'Usuário atualizado',
  'user.role_changed': 'Papel alterado',
  'invite.sent': 'Convite enviado',
  'invite.accepted': 'Convite aceito',
  'invite.revoked': 'Convite revogado',
  'invite.resent': 'Convite reenviado',
  'employee.created': 'Colaborador criado',
  'employee.updated': 'Colaborador atualizado',
  'employee.terminated': 'Colaborador desligado',
  'review_cycle.created': 'Ciclo de avaliação criado',
  'review_cycle.updated': 'Ciclo atualizado',
  'review_cycle.published': 'Ciclo publicado',
  'review_cycle.closed': 'Ciclo encerrado',
  'review_cycle.archived': 'Ciclo arquivado',
  'review_cycle.reminded': 'Lembretes enviados',
  'review_assignment.submitted': 'Avaliação enviada',
  'review_assignment.cancelled': 'Avaliação cancelada',
  'review_result.released': 'Resultado liberado',
  'review_result.hidden': 'Resultado ocultado',
  'feedback.created': 'Feedback enviado',
  'feedback.deleted': 'Feedback removido',
  'pdi.created': 'PDI criado',
  'pdi.updated': 'PDI atualizado',
  'pdi.concluded': 'PDI concluído',
  'pdi.cancelled': 'PDI cancelado',
  'pdi.deleted': 'PDI removido',
  'pdi_action.created': 'Ação do PDI adicionada',
  'pdi_action.updated': 'Ação do PDI atualizada',
  'department.created': 'Departamento criado',
  'department.updated': 'Departamento atualizado',
  'department.archived': 'Departamento arquivado',
  'department.deleted': 'Departamento removido',
  'role.created': 'Cargo criado',
  'role.updated': 'Cargo atualizado',
  'role.archived': 'Cargo arquivado',
  'role.deleted': 'Cargo removido',
  'competency.created': 'Competência criada',
  'competency.updated': 'Competência atualizada',
  'competency.archived': 'Competência arquivada',
  'competency.deleted': 'Competência removida',
  // FT-7 Recrutamento
  'job_opening.created': 'Vaga criada',
  'job_opening.updated': 'Vaga atualizada',
  'job_opening.status_changed': 'Status da vaga alterado',
  'job_opening.archived': 'Vaga arquivada',
  'candidate.created': 'Candidato cadastrado',
  'candidate.updated': 'Candidato atualizado',
  'candidate.archived': 'Candidato arquivado',
  'application.created': 'Candidato vinculado à vaga',
  'application.stage_moved': 'Candidato movido de etapa',
  'application.withdrawn': 'Candidato marcado como desistente',
  'application.rejected': 'Candidato reprovado',
  'application.frozen': 'Candidato congelado',
  'application.hired': 'Candidato contratado',
  'recruitment_stage.created': 'Etapa de recrutamento criada',
  'recruitment_stage.updated': 'Etapa de recrutamento atualizada',
  'recruitment_stage.archived': 'Etapa de recrutamento arquivada',
  'recruitment_stage.reordered': 'Etapas de recrutamento reordenadas',
  'candidate_feedback.created': 'Feedback registrado',
  'candidate_feedback.deleted': 'Feedback removido',
  'candidate_scorecard.submitted': 'Scorecard registrado',
  'candidate_scorecard.updated': 'Scorecard atualizado',
  'candidate_scorecard.deleted': 'Scorecard removido',
  'candidate_task.created': 'Tarefa criada',
  'candidate_task.updated': 'Tarefa atualizada',
  'candidate_task.completed': 'Tarefa concluída',
  'candidate_task.reopened': 'Tarefa reaberta',
  'candidate_task.deleted': 'Tarefa removida',
};

const ROLE_DISPLAY: Record<string, string> = {
  admin_rh: 'Admin RH',
  director: 'Diretor',
  user: 'Colaborador',
};

type MetadataRecord = Record<string, unknown>;

type MetadataEntry = { label: string; value: string };

function pickString(meta: MetadataRecord, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
    if (typeof v === 'number') return String(v);
  }
  return null;
}

function pickRole(meta: MetadataRecord, ...keys: string[]): string | null {
  const raw = pickString(meta, ...keys);
  if (!raw) return null;
  return ROLE_DISPLAY[raw] ?? raw;
}

export function humanizeActivityMetadata(
  action: string,
  metadata: unknown,
): MetadataEntry[] {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return [];
  const meta = metadata as MetadataRecord;
  const entries: MetadataEntry[] = [];

  const push = (label: string, value: string | null | undefined) => {
    if (!value) return;
    entries.push({ label, value });
  };

  switch (action) {
    case 'invite.sent':
    case 'invite.resent': {
      push('Convidado', pickString(meta, 'invitee_name', 'name', 'full_name', 'email'));
      push('Papel', pickRole(meta, 'role'));
      break;
    }
    case 'invite.accepted':
    case 'invite.revoked': {
      push('Convidado', pickString(meta, 'invitee_name', 'name', 'full_name', 'email'));
      break;
    }
    case 'employee.created':
    case 'employee.updated':
    case 'employee.terminated': {
      push('Colaborador', pickString(meta, 'employee_name', 'name', 'full_name'));
      push('Cargo', pickString(meta, 'position_name', 'position'));
      break;
    }
    case 'user.invited':
    case 'user.activated':
    case 'user.deactivated':
    case 'user.updated': {
      push('Usuário', pickString(meta, 'user_name', 'name', 'full_name', 'email'));
      break;
    }
    case 'user.role_changed': {
      push('Usuário', pickString(meta, 'user_name', 'name', 'full_name', 'email'));
      push('De', pickRole(meta, 'old_role', 'from_role', 'previous_role'));
      push('Para', pickRole(meta, 'new_role', 'to_role', 'role'));
      break;
    }
    case 'review_cycle.created':
    case 'review_cycle.updated':
    case 'review_cycle.published':
    case 'review_cycle.closed':
    case 'review_cycle.archived':
    case 'review_cycle.reminded': {
      push('Ciclo', pickString(meta, 'cycle_name', 'name'));
      push('Participantes', pickString(meta, 'participants', 'participant_count'));
      break;
    }
    case 'review_assignment.submitted':
    case 'review_assignment.cancelled': {
      push('Ciclo', pickString(meta, 'cycle_name'));
      push('Avaliado', pickString(meta, 'reviewee_name'));
      push('Avaliador', pickString(meta, 'reviewer_name'));
      break;
    }
    case 'review_result.released':
    case 'review_result.hidden': {
      push('Ciclo', pickString(meta, 'cycle_name'));
      push('Colaborador', pickString(meta, 'employee_name'));
      break;
    }
    case 'feedback.created':
    case 'feedback.deleted': {
      push('Destinatário', pickString(meta, 'recipient_name'));
      push('Tipo', pickString(meta, 'type_label', 'type'));
      break;
    }
    case 'pdi.created':
    case 'pdi.updated':
    case 'pdi.concluded':
    case 'pdi.cancelled':
    case 'pdi.deleted': {
      push('Colaborador', pickString(meta, 'employee_name'));
      push('Ações', pickString(meta, 'actions_summary', 'actions'));
      break;
    }
    case 'pdi_action.created':
    case 'pdi_action.updated': {
      push('Ação', pickString(meta, 'action_title', 'title'));
      push('Responsável', pickString(meta, 'responsible_name'));
      break;
    }
    case 'department.created':
    case 'department.updated':
    case 'department.archived':
    case 'department.deleted': {
      push('Departamento', pickString(meta, 'department_name', 'name'));
      break;
    }
    case 'role.created':
    case 'role.updated':
    case 'role.archived':
    case 'role.deleted': {
      push('Cargo', pickString(meta, 'role_name', 'name'));
      break;
    }
    case 'competency.created':
    case 'competency.updated':
    case 'competency.archived':
    case 'competency.deleted': {
      push('Competência', pickString(meta, 'competency_name', 'name'));
      break;
    }
    // FT-7 Recrutamento
    case 'job_opening.created':
    case 'job_opening.updated':
    case 'job_opening.archived': {
      push('Vaga', pickString(meta, 'title'));
      break;
    }
    case 'job_opening.status_changed': {
      push('Vaga', pickString(meta, 'title'));
      push('De', pickString(meta, 'from_status_label', 'from_status'));
      push('Para', pickString(meta, 'to_status_label', 'to_status'));
      break;
    }
    case 'candidate.created':
    case 'candidate.updated':
    case 'candidate.archived': {
      push('Candidato', pickString(meta, 'name'));
      break;
    }
    case 'application.created': {
      push('Candidato', pickString(meta, 'candidate_name'));
      push('Vaga', pickString(meta, 'job_title'));
      break;
    }
    case 'application.stage_moved': {
      push('Candidato', pickString(meta, 'candidate_name'));
      push('Vaga', pickString(meta, 'job_title'));
      push('De', pickString(meta, 'from_stage'));
      push('Para', pickString(meta, 'to_stage'));
      break;
    }
    case 'application.withdrawn':
    case 'application.rejected':
    case 'application.frozen':
    case 'application.hired': {
      push('Candidato', pickString(meta, 'candidate_name'));
      push('Vaga', pickString(meta, 'job_title'));
      push('Motivo', pickString(meta, 'reason_label', 'reason'));
      push('Notas', pickString(meta, 'notes'));
      break;
    }
    case 'recruitment_stage.created':
    case 'recruitment_stage.updated':
    case 'recruitment_stage.archived': {
      push('Etapa', pickString(meta, 'name'));
      break;
    }
    case 'recruitment_stage.reordered': {
      break;
    }
    case 'candidate_feedback.created':
    case 'candidate_feedback.deleted': {
      push('Candidato', pickString(meta, 'candidate_name'));
      push('Vaga', pickString(meta, 'job_title'));
      break;
    }
    case 'candidate_scorecard.submitted':
    case 'candidate_scorecard.updated':
    case 'candidate_scorecard.deleted': {
      push('Candidato', pickString(meta, 'candidate_name'));
      push('Vaga', pickString(meta, 'job_title'));
      break;
    }
    case 'candidate_task.created':
    case 'candidate_task.updated':
    case 'candidate_task.completed':
    case 'candidate_task.reopened':
    case 'candidate_task.deleted': {
      push('Tarefa', pickString(meta, 'title'));
      push('Candidato', pickString(meta, 'candidate_name'));
      break;
    }
    default:
      break;
  }

  return entries;
}
