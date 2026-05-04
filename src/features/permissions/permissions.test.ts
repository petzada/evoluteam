import { describe, expect, it } from 'vitest';
import {
  canChangeUserAccess,
  canDo,
  canGrantScreenPermissions,
  canInviteAs,
  getDisabledGrantPermissionKeys,
  normalizeScreenPermissions,
} from './permissions';
import { getRoleDisplayLabel, type Actor, type ScreenPermissions } from './types';

const baseActor = (partial: Partial<Actor> = {}): Actor => ({
  userId: 'u1',
  companyId: 'c1',
  role: 'user',
  employeeId: 'e1',
  employeeStatus: 'active',
  screenPermissions: null,
  ...partial,
});

const userWith = (perms: ScreenPermissions): Actor =>
  baseActor({
    role: 'user',
    screenPermissions: perms,
  });

describe('canDo', () => {
  it('admin_rh passa em qualquer tela e acao', () => {
    const adm = baseActor({ role: 'admin_rh' });
    expect(canDo(adm, 'colaboradores', 'edit')).toBe(true);
    expect(canDo(adm, 'pdi', 'view')).toBe(true);
    expect(canDo(adm, 'recrutamento_etapas', 'edit')).toBe(true);
    expect(canDo(adm, 'auditoria', 'view')).toBe(true);
    expect(canDo(adm, 'empresa', 'edit')).toBe(true);
  });

  it('director passa em view de telas operacionais, nunca em edit', () => {
    const dir = baseActor({ role: 'director' });
    expect(canDo(dir, 'colaboradores', 'view')).toBe(true);
    expect(canDo(dir, 'pdi', 'view')).toBe(true);
    expect(canDo(dir, 'avaliacoes', 'view')).toBe(true);
    expect(canDo(dir, 'feedbacks', 'view')).toBe(true);
    expect(canDo(dir, 'dashboard', 'view')).toBe(true);
    expect(canDo(dir, 'recrutamento_vagas', 'view')).toBe(true);
    expect(canDo(dir, 'colaboradores', 'edit')).toBe(false);
    expect(canDo(dir, 'pdi', 'edit')).toBe(false);
  });

  // Director nao tem acesso a nenhuma tela de Configuracoes.
  // Spec: permissoes.md linhas 40-43.
  it.each([
    'empresa',
    'cargos',
    'departamentos',
    'competencias',
    'auditoria',
  ] as const)('director nao ve nem edita tela de Configuracoes: %s', (screen) => {
    const dir = baseActor({ role: 'director' });
    expect(canDo(dir, screen, 'view')).toBe(false);
    expect(canDo(dir, screen, 'edit')).toBe(false);
  });

  it('user sem toggles nao passa em nada', () => {
    expect(canDo(baseActor(), 'colaboradores', 'view')).toBe(false);
    expect(canDo(baseActor(), 'pdi', 'edit')).toBe(false);
  });

  it('user com toggle especifico passa apenas nele', () => {
    const actor = userWith({ 'colaboradores.view': true, 'colaboradores.edit': true });
    expect(canDo(actor, 'colaboradores', 'view')).toBe(true);
    expect(canDo(actor, 'colaboradores', 'edit')).toBe(true);
    expect(canDo(actor, 'pdi', 'view')).toBe(false);
    expect(canDo(actor, 'avaliacoes', 'edit')).toBe(false);
  });

  it('trata edit como view quando o JSON chega sem a chave view', () => {
    const actor = userWith({ 'pdi.edit': true });
    expect(canDo(actor, 'pdi', 'view')).toBe(true);
    expect(canDo(actor, 'pdi', 'edit')).toBe(true);
  });

  it('null/undefined actor nao passa', () => {
    expect(canDo(null, 'colaboradores', 'view')).toBe(false);
    expect(canDo(undefined, 'colaboradores', 'view')).toBe(false);
  });

  // Matriz completa: cada tela com toggle isolado
  it.each([
    ['avaliacoes', 'view'],
    ['avaliacoes', 'edit'],
    ['feedbacks', 'view'],
    ['feedbacks', 'edit'],
    ['pdi', 'view'],
    ['pdi', 'edit'],
    ['recrutamento_vagas', 'view'],
    ['recrutamento_vagas', 'edit'],
    ['recrutamento_candidatos', 'view'],
    ['recrutamento_candidatos', 'edit'],
    ['recrutamento_etapas', 'view'],
    ['recrutamento_etapas', 'edit'],
    ['recrutamento_relatorios', 'view'],
    ['empresa', 'view'],
    ['empresa', 'edit'],
    ['cargos', 'view'],
    ['cargos', 'edit'],
    ['departamentos', 'view'],
    ['departamentos', 'edit'],
    ['competencias', 'view'],
    ['competencias', 'edit'],
    ['auditoria', 'view'],
    ['dashboard', 'view'],
  ] as const)('user com %s.%s: passa apenas nessa chave especifica', (screen, action) => {
    const key = `${screen}.${action}` as import('./types').ScreenPermissionKey;
    const withToggle = userWith({ [key]: true } as ScreenPermissions);
    const withoutToggle = userWith({});
    expect(canDo(withToggle, screen, action)).toBe(true);
    expect(canDo(withoutToggle, screen, action)).toBe(false);
  });
});

describe('canGrantScreenPermissions (escalacao restrita)', () => {
  it('admin_rh concede qualquer subset', () => {
    const adm = baseActor({ role: 'admin_rh' });
    expect(canGrantScreenPermissions(adm, { 'pdi.edit': true, 'auditoria.view': true })).toBe(true);
  });

  it('user com colaboradores.edit concede apenas subset dos proprios', () => {
    const actor = userWith({
      'colaboradores.view': true,
      'colaboradores.edit': true,
      'pdi.view': true,
      'pdi.edit': true,
    });
    // Subset dos proprios: OK
    expect(canGrantScreenPermissions(actor, { 'pdi.view': true })).toBe(true);
    expect(canGrantScreenPermissions(actor, { 'pdi.edit': true })).toBe(true);
    expect(canGrantScreenPermissions(actor, { 'colaboradores.view': true })).toBe(true);
    // Algo que ele nao tem: falha
    expect(canGrantScreenPermissions(actor, { 'avaliacoes.edit': true })).toBe(false);
    expect(canGrantScreenPermissions(actor, { 'auditoria.view': true })).toBe(false);
  });

  it('normaliza edit=>view antes de validar subset', () => {
    const actor = userWith({
      'colaboradores.view': true,
      'colaboradores.edit': true,
      'pdi.edit': true,
    });
    expect(canGrantScreenPermissions(actor, { 'pdi.edit': true })).toBe(true);
    expect(canGrantScreenPermissions(actor, { 'avaliacoes.edit': true })).toBe(false);
  });

  it('user sem colaboradores.edit nao concede nada', () => {
    const actor = userWith({ 'colaboradores.view': true });
    expect(canGrantScreenPermissions(actor, { 'colaboradores.view': true })).toBe(false);
  });

  it('director nao concede nada', () => {
    expect(
      canGrantScreenPermissions(baseActor({ role: 'director' }), { 'pdi.view': true }),
    ).toBe(false);
  });
});

describe('normalizeScreenPermissions / getDisabledGrantPermissionKeys', () => {
  it('remove false e auto-marca view quando edit=true', () => {
    expect(normalizeScreenPermissions({
      'pdi.edit': true,
      'feedbacks.view': false,
    })).toEqual({
      'pdi.view': true,
      'pdi.edit': true,
    });
  });

  it('considera chaves ausentes como bloqueadas para concessao', () => {
    const disabled = getDisabledGrantPermissionKeys({
      'colaboradores.view': true,
      'colaboradores.edit': true,
      'pdi.edit': true,
    });
    expect(disabled).not.toContain('colaboradores.view');
    expect(disabled).not.toContain('colaboradores.edit');
    expect(disabled).not.toContain('pdi.view');
    expect(disabled).not.toContain('pdi.edit');
    expect(disabled).toContain('avaliacoes.view');
    expect(disabled).toContain('auditoria.view');
  });
});

describe('canInviteAs', () => {
  it('admin_rh pode conceder qualquer role', () => {
    const adm = baseActor({ role: 'admin_rh' });
    expect(canInviteAs(adm, 'user')).toBe(true);
    expect(canInviteAs(adm, 'director')).toBe(true);
    expect(canInviteAs(adm, 'admin_rh')).toBe(true);
  });

  it('user com colaboradores.edit concede apenas Colaborador', () => {
    const actor = userWith({ 'colaboradores.view': true, 'colaboradores.edit': true });
    expect(canInviteAs(actor, 'user')).toBe(true);
    expect(canInviteAs(actor, 'director')).toBe(false);
    expect(canInviteAs(actor, 'admin_rh')).toBe(false);
  });

  it('user sem colaboradores.edit nao concede nada', () => {
    const actor = userWith({ 'pdi.view': true });
    expect(canInviteAs(actor, 'user')).toBe(false);
  });

  it('director e user comum nao concedem nada', () => {
    expect(canInviteAs(baseActor({ role: 'director' }), 'user')).toBe(false);
    expect(canInviteAs(baseActor(), 'user')).toBe(false);
  });

  it('null actor nao concede nada', () => {
    expect(canInviteAs(null, 'user')).toBe(false);
  });
});

describe('getRoleDisplayLabel', () => {
  it('user sem toggles mostra "Colaborador"', () => {
    expect(getRoleDisplayLabel('user', null)).toBe('Colaborador');
    expect(getRoleDisplayLabel('user', {})).toBe('Colaborador');
    expect(getRoleDisplayLabel('user', undefined)).toBe('Colaborador');
  });

  it('user com colaboradores.edit vira "Supervisor"', () => {
    expect(getRoleDisplayLabel('user', { 'colaboradores.edit': true })).toBe('Supervisor');
    expect(getRoleDisplayLabel('user', {
      'colaboradores.view': true,
      'colaboradores.edit': true,
      'pdi.view': true,
    })).toBe('Supervisor');
  });

  it('user com apenas colaboradores.view continua "Colaborador"', () => {
    expect(getRoleDisplayLabel('user', { 'colaboradores.view': true })).toBe('Colaborador');
  });

  it('director ignora toggles e mantem "Diretor"', () => {
    expect(getRoleDisplayLabel('director', null)).toBe('Diretor');
    expect(getRoleDisplayLabel('director', { 'colaboradores.edit': true })).toBe('Diretor');
  });

  it('admin_rh sempre "Administrador"', () => {
    expect(getRoleDisplayLabel('admin_rh', null)).toBe('Administrador');
    expect(getRoleDisplayLabel('admin_rh', { 'colaboradores.edit': true })).toBe('Administrador');
  });
});

describe('canChangeUserAccess', () => {
  it('ninguem pode alterar o proprio role', () => {
    const adm = baseActor({ role: 'admin_rh', userId: 'same' });
    expect(canChangeUserAccess(adm, { userId: 'same', role: 'admin_rh' }, 'user')).toBe(false);
  });

  it('admin_rh pode alterar qualquer outro usuario para qualquer role', () => {
    const adm = baseActor({ role: 'admin_rh' });
    expect(canChangeUserAccess(adm, { userId: 'other', role: 'user' }, 'director')).toBe(true);
    expect(canChangeUserAccess(adm, { userId: 'other', role: 'director' }, 'admin_rh')).toBe(true);
  });

  it('user com colaboradores.edit pode editar Colaboradores mantendo como Colaborador', () => {
    const actor = userWith({ 'colaboradores.view': true, 'colaboradores.edit': true });
    expect(canChangeUserAccess(actor, { userId: 'other', role: 'user' }, 'user')).toBe(true);
    // Nao pode escalar:
    expect(canChangeUserAccess(actor, { userId: 'other', role: 'user' }, 'director')).toBe(false);
    expect(canChangeUserAccess(actor, { userId: 'other', role: 'user' }, 'admin_rh')).toBe(false);
    // Nao pode editar quem ja tem role privilegiado:
    expect(canChangeUserAccess(actor, { userId: 'other', role: 'director' }, 'user')).toBe(false);
  });

  it('user sem colaboradores.edit nao altera ninguem', () => {
    const actor = userWith({ 'pdi.view': true });
    expect(canChangeUserAccess(actor, { userId: 'other', role: 'user' }, 'user')).toBe(false);
  });

  it('director e user comum nao alteram ninguem', () => {
    expect(
      canChangeUserAccess(baseActor({ role: 'director' }), { userId: 'other', role: 'user' }, 'user'),
    ).toBe(false);
    expect(canChangeUserAccess(baseActor(), { userId: 'other', role: 'user' }, 'user')).toBe(false);
  });
});
