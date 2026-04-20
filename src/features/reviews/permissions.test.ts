import { describe, it, expect } from 'vitest';
import {
  canCreateCycle, canEditCycle, canSeeCycle, canAnswerAssignment,
  canSeeResultOf, canReleaseResult, isCycleFieldEditable,
} from './permissions';

const admin = { role: 'admin_rh', userId: 'u-admin', employeeId: 'e-admin' };
const director = { role: 'director', userId: 'u-dir', employeeId: 'e-dir' };
const user = { role: 'user', userId: 'u-user', employeeId: 'e-user' };

describe('canCreateCycle', () => {
  it('só admin_rh cria', () => {
    expect(canCreateCycle(admin)).toBe(true);
    expect(canCreateCycle(director)).toBe(false);
    expect(canCreateCycle(user)).toBe(false);
  });
});

describe('canEditCycle', () => {
  it('admin_rh edita draft/published/closed', () => {
    expect(canEditCycle(admin, { status: 'draft' })).toBe(true);
    expect(canEditCycle(admin, { status: 'published' })).toBe(true);
    expect(canEditCycle(admin, { status: 'closed' })).toBe(true);
  });
  it('admin_rh NÃO edita archived', () => {
    expect(canEditCycle(admin, { status: 'archived' })).toBe(false);
  });
  it('director não edita', () => {
    expect(canEditCycle(director, { status: 'draft' })).toBe(false);
  });
});

describe('isCycleFieldEditable', () => {
  it('draft é livre', () => {
    expect(isCycleFieldEditable('name', 'draft')).toBe(true);
    expect(isCycleFieldEditable('form', 'draft')).toBe(true);
    expect(isCycleFieldEditable('participants', 'draft')).toBe(true);
  });
  it('published libera só descrição, responseWindow e participants', () => {
    expect(isCycleFieldEditable('description', 'published')).toBe(true);
    expect(isCycleFieldEditable('responseWindow', 'published')).toBe(true);
    expect(isCycleFieldEditable('participants', 'published')).toBe(true);
    expect(isCycleFieldEditable('name', 'published')).toBe(false);
    expect(isCycleFieldEditable('form', 'published')).toBe(false);
  });
  it('closed/archived trava tudo', () => {
    expect(isCycleFieldEditable('description', 'closed')).toBe(false);
    expect(isCycleFieldEditable('description', 'archived')).toBe(false);
  });
});

describe('canSeeCycle', () => {
  it('admin e director veem sempre', () => {
    expect(canSeeCycle(admin, { isParticipant: false, isReviewer: false })).toBe(true);
    expect(canSeeCycle(director, { isParticipant: false, isReviewer: false })).toBe(true);
  });
  it('user só vê se envolvido', () => {
    expect(canSeeCycle(user, { isParticipant: false, isReviewer: false })).toBe(false);
    expect(canSeeCycle(user, { isParticipant: true, isReviewer: false })).toBe(true);
    expect(canSeeCycle(user, { isParticipant: false, isReviewer: true })).toBe(true);
  });
});

describe('canAnswerAssignment', () => {
  it('reviewer responde se pending/in_progress', () => {
    expect(
      canAnswerAssignment({ role: 'user', userId: 'u', employeeId: 'e1' },
        { reviewerEmployeeId: 'e1', status: 'pending' }),
    ).toBe(true);
    expect(
      canAnswerAssignment({ role: 'user', userId: 'u', employeeId: 'e1' },
        { reviewerEmployeeId: 'e1', status: 'in_progress' }),
    ).toBe(true);
  });
  it('não responde se submitted/cancelled', () => {
    expect(
      canAnswerAssignment({ role: 'user', userId: 'u', employeeId: 'e1' },
        { reviewerEmployeeId: 'e1', status: 'submitted' }),
    ).toBe(false);
  });
  it('não responde se não for reviewer', () => {
    expect(
      canAnswerAssignment({ role: 'user', userId: 'u', employeeId: 'e-other' },
        { reviewerEmployeeId: 'e1', status: 'pending' }),
    ).toBe(false);
  });
});

describe('canSeeResultOf', () => {
  it('admin e director sempre', () => {
    expect(canSeeResultOf(admin, {
      targetEmployeeId: 'e1', isReleased: false, descendantsOfActor: [],
    })).toBe(true);
    expect(canSeeResultOf(director, {
      targetEmployeeId: 'e1', isReleased: false, descendantsOfActor: [],
    })).toBe(true);
  });
  it('self só vê quando liberado', () => {
    expect(canSeeResultOf(user, {
      targetEmployeeId: 'e-user', isReleased: false, descendantsOfActor: [],
    })).toBe(false);
    expect(canSeeResultOf(user, {
      targetEmployeeId: 'e-user', isReleased: true, descendantsOfActor: [],
    })).toBe(true);
  });
  it('gestor vê descendentes independente de liberação', () => {
    expect(canSeeResultOf(user, {
      targetEmployeeId: 'e-sub', isReleased: false, descendantsOfActor: ['e-sub'],
    })).toBe(true);
  });
  it('user fora da hierarquia não vê alheio', () => {
    expect(canSeeResultOf(user, {
      targetEmployeeId: 'e-outsider', isReleased: true, descendantsOfActor: [],
    })).toBe(false);
  });
});

describe('canReleaseResult', () => {
  it('só admin_rh', () => {
    expect(canReleaseResult(admin)).toBe(true);
    expect(canReleaseResult(director)).toBe(false);
    expect(canReleaseResult(user)).toBe(false);
  });
});
