import { describe, expect, it } from 'vitest';
import { renderReviewReminder } from './review-reminder';

const baseProps = {
  pendingCount: 3,
  cycleUrl: 'https://evolu.team/avaliacoes/abc-123',
  responseEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
};

describe('renderReviewReminder', () => {
  describe('subject', () => {
    it('plural com cycleName', async () => {
      const { subject } = await renderReviewReminder({
        ...baseProps,
        cycleName: 'Avaliação Q2 2026',
      });
      expect(subject).toBe(
        'Lembrete: você tem 3 avaliações pendentes em "Avaliação Q2 2026"',
      );
    });

    it('singular com cycleName', async () => {
      const { subject } = await renderReviewReminder({
        ...baseProps,
        pendingCount: 1,
        cycleName: 'Avaliação Q2 2026',
      });
      expect(subject).toBe(
        'Lembrete: você tem 1 avaliação pendente em "Avaliação Q2 2026"',
      );
    });

    it('fallback sem cycleName', async () => {
      const { subject } = await renderReviewReminder(baseProps);
      expect(subject).toBe('Lembrete: você tem 3 avaliações pendentes');
    });
  });

  describe('saudação', () => {
    it('usa primeiro nome quando reviewerName presente', async () => {
      const { html } = await renderReviewReminder({
        ...baseProps,
        reviewerName: 'João Silva Santos',
      });
      expect(html).toContain('Olá, João,');
    });

    it('genérica quando reviewerName ausente', async () => {
      const { html } = await renderReviewReminder(baseProps);
      expect(html).toContain('Olá,');
      expect(html).not.toContain('Olá, ,');
    });
  });

  describe('corpo', () => {
    it('contém pendingCount + cycleName', async () => {
      const { html } = await renderReviewReminder({
        ...baseProps,
        cycleName: 'Avaliação Q2 2026',
      });
      expect(html).toContain('3 avaliações pendentes');
      expect(html).toContain('Avaliação Q2 2026');
    });

    it('singular sem cycleName', async () => {
      const { html } = await renderReviewReminder({
        ...baseProps,
        pendingCount: 1,
      });
      expect(html).toContain('1 avaliação pendente');
    });
  });

  describe('prazo', () => {
    it('"termina em N dias" quando daysLeft > 1', async () => {
      const { html } = await renderReviewReminder({
        ...baseProps,
        responseEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      });
      expect(html).toContain('em 6 dias');
    });

    it('"termina amanhã" quando daysLeft = 1', async () => {
      const { html } = await renderReviewReminder({
        ...baseProps,
        responseEnd: new Date(Date.now() + 23 * 60 * 60 * 1000),
      });
      expect(html).toContain('amanhã');
    });

    it('"termina hoje" quando daysLeft = 0', async () => {
      const { html } = await renderReviewReminder({
        ...baseProps,
        responseEnd: new Date(Date.now() - 1000),
      });
      expect(html).toContain('hoje');
    });

    it('"prazo expirou" quando responseEnd já passou ha mais de 1 dia', async () => {
      const { html } = await renderReviewReminder({
        ...baseProps,
        responseEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });
      expect(html).toContain('prazo de resposta expirou');
    });

    it('omite linha de prazo quando responseEnd ausente', async () => {
      const props = { ...baseProps };
      delete (props as { responseEnd?: Date }).responseEnd;
      const { html } = await renderReviewReminder(props);
      expect(html).not.toContain('O ciclo termina');
      expect(html).not.toContain('prazo de resposta');
    });
  });

  describe('CTA', () => {
    it('HTML contém href do cycleUrl', async () => {
      const { html } = await renderReviewReminder(baseProps);
      expect(html).toContain(`href="${baseProps.cycleUrl}"`);
      expect(html).toContain('Abrir avaliações');
    });
  });
});
