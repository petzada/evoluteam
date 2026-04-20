import { describe, it, expect } from 'vitest';
import {
  canSendFeedback, canReceiveFeedback, canViewFeedback, canDeleteFeedback,
  enforceVisibilityForType, type Actor,
} from './permissions';

const admin: Actor = { role: 'admin_rh', userId: 'u-admin', employeeId: 'e-admin', employeeStatus: 'active' };
const director: Actor = { role: 'director', userId: 'u-dir', employeeId: 'e-dir', employeeStatus: 'active' };
const user: Actor = { role: 'user', userId: 'u-user', employeeId: 'e-user', employeeStatus: 'active' };
const terminated: Actor = { role: 'user', userId: 'u-ex', employeeId: 'e-ex', employeeStatus: 'terminated' };

describe('canSendFeedback', () => {
  it('permite ativo/inativo', () => {
    expect(canSendFeedback(admin)).toBe(true);
    expect(canSendFeedback({ ...user, employeeStatus: 'inactive' })).toBe(true);
  });
  it('bloqueia desligado', () => {
    expect(canSendFeedback(terminated)).toBe(false);
  });
  it('bloqueia sem employeeId', () => {
    expect(canSendFeedback({ ...admin, employeeId: null })).toBe(false);
  });
});

describe('canReceiveFeedback', () => {
  it('aceita active e inactive', () => {
    expect(canReceiveFeedback({ status: 'active' })).toBe(true);
    expect(canReceiveFeedback({ status: 'inactive' })).toBe(true);
  });
  it('recusa terminated', () => {
    expect(canReceiveFeedback({ status: 'terminated' })).toBe(false);
  });
});

describe('canViewFeedback', () => {
  const base = { deletedAt: null, senderId: 'e-sender', recipientId: 'e-recipient' };

  it('sender lê sempre', () => {
    expect(canViewFeedback(
      { ...user, employeeId: 'e-sender' },
      { ...base, visibility: 'privado' },
      [],
    )).toBe(true);
  });

  it('recipient lê sempre', () => {
    expect(canViewFeedback(
      { ...user, employeeId: 'e-recipient' },
      { ...base, visibility: 'privado' },
      [],
    )).toBe(true);
  });

  it('admin NÃO lê privado', () => {
    expect(canViewFeedback(
      admin,
      { ...base, visibility: 'privado' },
      [],
    )).toBe(false);
  });

  it('admin lê visivel_para_rh', () => {
    expect(canViewFeedback(
      admin,
      { ...base, visibility: 'visivel_para_rh' },
      [],
    )).toBe(true);
  });

  it('admin NÃO lê visivel_para_gestor se não for gestor', () => {
    expect(canViewFeedback(
      admin,
      { ...base, visibility: 'visivel_para_gestor' },
      [],
    )).toBe(false);
  });

  it('gestor lê visivel_para_gestor se estiver na cadeia', () => {
    expect(canViewFeedback(
      user,
      { ...base, visibility: 'visivel_para_gestor' },
      ['e-user'],
    )).toBe(true);
  });

  it('gestor NÃO lê visivel_para_gestor fora da cadeia', () => {
    expect(canViewFeedback(
      user,
      { ...base, visibility: 'visivel_para_gestor' },
      ['e-other'],
    )).toBe(false);
  });

  it('gestor lê visivel_para_rh se estiver na cadeia', () => {
    expect(canViewFeedback(
      user,
      { ...base, visibility: 'visivel_para_rh' },
      ['e-user'],
    )).toBe(true);
  });

  it('deletado só admin lê (auditoria)', () => {
    expect(canViewFeedback(
      user,
      { ...base, visibility: 'privado', deletedAt: '2026-05-20T00:00:00Z' },
      [],
    )).toBe(false);
    expect(canViewFeedback(
      admin,
      { ...base, visibility: 'privado', deletedAt: '2026-05-20T00:00:00Z' },
      [],
    )).toBe(true);
  });

  it('director fora da cadeia NÃO lê visivel_para_gestor', () => {
    expect(canViewFeedback(
      director,
      { ...base, visibility: 'visivel_para_gestor' },
      [],
    )).toBe(false);
  });
});

describe('canDeleteFeedback', () => {
  it('só admin_rh deleta', () => {
    expect(canDeleteFeedback(admin)).toBe(true);
    expect(canDeleteFeedback(director)).toBe(false);
    expect(canDeleteFeedback(user)).toBe(false);
  });
});

describe('enforceVisibilityForType', () => {
  it('observacao_privada força privado', () => {
    expect(enforceVisibilityForType('observacao_privada', 'visivel_para_rh')).toBe('privado');
    expect(enforceVisibilityForType('observacao_privada', 'visivel_para_gestor')).toBe('privado');
    expect(enforceVisibilityForType('observacao_privada', 'privado')).toBe('privado');
  });
  it('outros tipos mantêm a visibilidade escolhida', () => {
    expect(enforceVisibilityForType('elogio', 'visivel_para_rh')).toBe('visivel_para_rh');
    expect(enforceVisibilityForType('reconhecimento', 'privado')).toBe('privado');
  });
});
