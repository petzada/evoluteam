import { describe, expect, it } from 'vitest';
import { renderEmployeeInvite } from './employee-invite';

const baseProps = {
  inviteUrl: 'https://evolu.team/convite/abc-123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

describe('renderEmployeeInvite', () => {
  describe('subject', () => {
    it('personaliza quando inviterName + companyName presentes', async () => {
      const { subject } = await renderEmployeeInvite({
        ...baseProps,
        inviterName: 'Marcio',
        companyName: 'Acme',
      });
      expect(subject).toBe('Marcio convidou você para o Acme no Evoluteam');
    });

    it('fallback quando falta inviterName', async () => {
      const { subject } = await renderEmployeeInvite({
        ...baseProps,
        companyName: 'Acme',
      });
      expect(subject).toBe('Você foi convidado para o Evoluteam');
    });

    it('fallback quando falta companyName', async () => {
      const { subject } = await renderEmployeeInvite({
        ...baseProps,
        inviterName: 'Marcio',
      });
      expect(subject).toBe('Você foi convidado para o Evoluteam');
    });

    it('fallback quando faltam todos dados opcionais', async () => {
      const { subject } = await renderEmployeeInvite(baseProps);
      expect(subject).toBe('Você foi convidado para o Evoluteam');
    });
  });

  describe('corpo com fallback em cascata', () => {
    it('renderiza inviterName + companyName + roleLabel quando completos', async () => {
      const { html } = await renderEmployeeInvite({
        ...baseProps,
        inviterName: 'Marcio Petigrosso',
        companyName: 'Acme Corp',
        roleLabel: 'colaborador',
      });
      expect(html).toContain('Marcio Petigrosso');
      expect(html).toContain('Acme Corp');
      expect(html).toContain('colaborador');
      expect(html).toContain('convidou você para participar');
    });

    it('renderiza apenas companyName quando sem inviterName', async () => {
      const { html } = await renderEmployeeInvite({
        ...baseProps,
        companyName: 'Acme Corp',
      });
      expect(html).toContain('Acme Corp');
      expect(html).toContain('Você foi convidado para participar');
    });

    it('renderiza versão genérica quando sem dados opcionais', async () => {
      const { html } = await renderEmployeeInvite(baseProps);
      expect(html).toContain('Você foi convidado para acessar');
    });
  });

  describe('saudação', () => {
    it('usa primeiro nome quando inviteeName presente', async () => {
      const { html } = await renderEmployeeInvite({
        ...baseProps,
        inviteeName: 'João Silva Santos',
      });
      expect(html).toContain('Olá, João,');
    });

    it('fallback genérico quando inviteeName ausente', async () => {
      const { html } = await renderEmployeeInvite(baseProps);
      expect(html).toContain('Olá,');
      expect(html).not.toContain('Olá, ,');
    });
  });

  describe('expiração', () => {
    it('mostra 7 dias quando expiresAt é 7 dias no futuro', async () => {
      const { html } = await renderEmployeeInvite({
        ...baseProps,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      expect(html).toContain('7 dias');
    });

    it('mostra piso de 1 dia mesmo quando expiração já passou', async () => {
      const { html } = await renderEmployeeInvite({
        ...baseProps,
        expiresAt: new Date(Date.now() - 1000),
      });
      expect(html).toContain('1 dia');
      expect(html).not.toContain('0 dias');
    });

    it('formata data de expiração em pt-BR', async () => {
      const { html } = await renderEmployeeInvite({
        ...baseProps,
        expiresAt: new Date('2026-04-28T00:00:00Z'),
      });
      expect(html).toContain('de abril de 2026');
    });
  });

  describe('CTA', () => {
    it('HTML contém CTA com href do inviteUrl', async () => {
      const { html } = await renderEmployeeInvite(baseProps);
      expect(html).toContain(`href="${baseProps.inviteUrl}"`);
      expect(html).toContain('Aceitar convite');
    });
  });
});
