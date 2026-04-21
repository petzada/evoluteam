export interface AdminWelcomeEmailInput {
  recoveryUrl: string;
}

export function adminWelcomeEmail({ recoveryUrl }: AdminWelcomeEmailInput): {
  subject: string;
  html: string;
} {
  return {
    subject: 'Bem-vindo ao Evoluteam — defina sua senha',
    html: `
      <p>Olá,</p>
      <p>Sua conta de administrador no Evoluteam foi criada.</p>
      <p>Para começar, defina sua senha pelo link abaixo:</p>
      <p><a href="${recoveryUrl}">Definir minha senha</a></p>
      <p>Após definir a senha, faça login e finalize o cadastro da sua empresa.</p>
    `,
  };
}
