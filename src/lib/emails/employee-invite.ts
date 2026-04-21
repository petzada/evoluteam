export interface EmployeeInviteEmailInput {
  inviteUrl: string;
}

export function employeeInviteEmail({ inviteUrl }: EmployeeInviteEmailInput): {
  subject: string;
  html: string;
} {
  return {
    subject: 'Você foi convidado para o Evoluteam',
    html: `
      <p>Olá,</p>
      <p>Você foi convidado para acessar o Evoluteam.</p>
      <p><a href="${inviteUrl}">Clique aqui para aceitar o convite</a></p>
      <p>O link expira em 7 dias.</p>
    `,
  };
}
