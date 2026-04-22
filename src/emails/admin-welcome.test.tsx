import { describe, expect, it } from 'vitest';
import { renderAdminWelcome } from './admin-welcome';

describe('renderAdminWelcome', () => {
  const recoveryUrl = 'https://evolu.team/forgot-password';

  it('retorna subject correto', async () => {
    const { subject } = await renderAdminWelcome({ recoveryUrl });
    expect(subject).toBe('Bem-vindo ao Evoluteam — defina sua senha');
  });

  it('HTML contém CTA com href do recoveryUrl', async () => {
    const { html } = await renderAdminWelcome({ recoveryUrl });
    expect(html).toContain(`href="${recoveryUrl}"`);
    expect(html).toContain('Definir minha senha');
  });

  it('HTML contém wordmark "Evoluteam"', async () => {
    const { html } = await renderAdminWelcome({ recoveryUrl });
    expect(html).toContain('Evoluteam');
  });

  it('HTML contém preheader sobre conta de administrador', async () => {
    const { html } = await renderAdminWelcome({ recoveryUrl });
    expect(html).toContain('Sua conta de administrador está pronta');
  });
});
