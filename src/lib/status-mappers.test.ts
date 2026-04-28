import { describe, expect, it } from 'vitest';
import {
  deriveEmployeeListStatus,
  employeeListStatusToken,
  employeeRecordStatusToken,
  deriveReviewCycleStatus,
  reviewCycleStatusToken,
  reviewAssignmentStatusToken,
  pdiStatusToken,
  pdiActionStatusToken,
  recruitmentJobOpeningStatusToken,
  recruitmentApplicationStatusToken,
  taxonomyStatusToken,
} from './status-mappers';

describe('employee status mapping', () => {
  it('derives employee list statuses', () => {
    const now = new Date('2026-04-28T12:00:00.000Z');
    expect(
      deriveEmployeeListStatus({ status: 'active', user_id: 'u1', invite: [] }, now),
    ).toBe('ativo');
    expect(
      deriveEmployeeListStatus({ status: 'inactive', user_id: null, invite: [] }, now),
    ).toBe('inativo');
    expect(
      deriveEmployeeListStatus({ status: 'terminated', user_id: null, invite: [] }, now),
    ).toBe('desligado');
    expect(
      deriveEmployeeListStatus(
        {
          status: 'active',
          user_id: null,
          invite: [{ expires_at: '2026-04-29', accepted_at: null, revoked_at: null }],
        },
        now,
      ),
    ).toBe('convite_pendente');
    expect(
      deriveEmployeeListStatus(
        {
          status: 'active',
          user_id: null,
          invite: [{ expires_at: '2026-04-27', accepted_at: null, revoked_at: null }],
        },
        now,
      ),
    ).toBe('convite_expirado');
    expect(
      deriveEmployeeListStatus({ status: 'active', user_id: null, invite: [] }, now),
    ).toBe('sem_acesso');
  });

  it('maps employee tokens', () => {
    expect(employeeListStatusToken('ativo')).toBe('success');
    expect(employeeListStatusToken('inativo')).toBe('warning');
    expect(employeeListStatusToken('convite_pendente')).toBe('warning');
    expect(employeeListStatusToken('desligado')).toBe('danger');
    expect(employeeListStatusToken('convite_expirado')).toBe('danger');
    expect(employeeListStatusToken('sem_acesso')).toBe('neutral');
    expect(employeeRecordStatusToken('active')).toBe('success');
    expect(employeeRecordStatusToken('inactive')).toBe('warning');
    expect(employeeRecordStatusToken('terminated')).toBe('danger');
  });
});

describe('review status mapping', () => {
  it('derives cycle statuses', () => {
    const now = new Date('2026-04-28T12:00:00.000Z');
    expect(deriveReviewCycleStatus('draft', '2026-04-20', '2026-04-30', now)).toBe('draft');
    expect(deriveReviewCycleStatus('archived', '2026-04-20', '2026-04-30', now)).toBe('archived');
    expect(deriveReviewCycleStatus('closed', '2026-04-20', '2026-04-30', now)).toBe('closed');
    expect(deriveReviewCycleStatus('published', '2026-04-30', '2026-05-10', now)).toBe('scheduled');
    expect(deriveReviewCycleStatus('published', '2026-04-01', '2026-04-27', now)).toBe('closed');
    expect(deriveReviewCycleStatus('published', '2026-04-01', '2026-05-01', now)).toBe('in_progress');
  });

  it('maps review tokens', () => {
    expect(reviewCycleStatusToken('scheduled')).toBe('warning');
    expect(reviewCycleStatusToken('in_progress')).toBe('warning');
    expect(reviewCycleStatusToken('closed')).toBe('danger');
    expect(reviewCycleStatusToken('draft')).toBe('neutral');
    expect(reviewCycleStatusToken('archived')).toBe('archived');

    expect(reviewAssignmentStatusToken('pending')).toBe('warning');
    expect(reviewAssignmentStatusToken('in_progress')).toBe('warning');
    expect(reviewAssignmentStatusToken('submitted')).toBe('success');
    expect(reviewAssignmentStatusToken('cancelled')).toBe('danger');
  });
});

describe('pdi/recruitment/taxonomy status mapping', () => {
  it('maps pdi tokens', () => {
    expect(pdiStatusToken('nao_iniciado')).toBe('neutral');
    expect(pdiStatusToken('em_andamento')).toBe('warning');
    expect(pdiStatusToken('atrasado')).toBe('warning');
    expect(pdiStatusToken('concluido')).toBe('success');
    expect(pdiStatusToken('cancelado')).toBe('danger');

    expect(pdiActionStatusToken('pendente')).toBe('warning');
    expect(pdiActionStatusToken('em_andamento')).toBe('warning');
    expect(pdiActionStatusToken('atrasada')).toBe('warning');
    expect(pdiActionStatusToken('concluida')).toBe('success');
    expect(pdiActionStatusToken('cancelada')).toBe('danger');
  });

  it('maps recruitment and taxonomy tokens', () => {
    expect(recruitmentJobOpeningStatusToken('open')).toBe('success');
    expect(recruitmentJobOpeningStatusToken('paused')).toBe('warning');
    expect(recruitmentJobOpeningStatusToken('closed')).toBe('danger');
    expect(recruitmentJobOpeningStatusToken('cancelled')).toBe('danger');

    expect(recruitmentApplicationStatusToken('in_progress')).toBe('warning');
    expect(recruitmentApplicationStatusToken('frozen')).toBe('warning');
    expect(recruitmentApplicationStatusToken('hired')).toBe('success');
    expect(recruitmentApplicationStatusToken('rejected')).toBe('danger');
    expect(recruitmentApplicationStatusToken('withdrawn')).toBe('danger');

    expect(taxonomyStatusToken(false)).toBe('success');
    expect(taxonomyStatusToken(true)).toBe('archived');
  });
});
