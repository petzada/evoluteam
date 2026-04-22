import { Link } from '@react-email/components';
import { render } from '@react-email/render';
import type { ReactNode } from 'react';
import { Button } from './_components/Button';
import { Heading } from './_components/Heading';
import { Layout } from './_components/Layout';
import { Text } from './_components/Text';
import { daysUntil, formatDeadlineDate } from './_lib/format-deadline';

export interface EmployeeInviteProps {
  inviteUrl: string;
  inviteeName?: string;
  inviterName?: string;
  companyName?: string;
  roleLabel?: string;
  expiresAt: Date;
}

const linkStyle = { color: '#F97316', textDecoration: 'underline' };
const boldStyle = { color: '#171717', fontWeight: 600 };

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0];
}

function expiresInDays(expiresAt: Date): number {
  return Math.max(1, daysUntil(expiresAt));
}

function buildSubject(props: EmployeeInviteProps): string {
  if (props.inviterName && props.companyName) {
    return `${props.inviterName} convidou você para o ${props.companyName} no Evoluteam`;
  }
  return 'Você foi convidado para o Evoluteam';
}

function buildBody(props: EmployeeInviteProps): ReactNode {
  const { inviterName, companyName, roleLabel } = props;

  if (inviterName && companyName && roleLabel) {
    return (
      <>
        <strong style={boldStyle}>{inviterName}</strong> convidou você para
        participar do <strong style={boldStyle}>{companyName}</strong> no
        Evoluteam como <strong style={boldStyle}>{roleLabel}</strong>.
      </>
    );
  }

  if (companyName) {
    return (
      <>
        Você foi convidado para participar do{' '}
        <strong style={boldStyle}>{companyName}</strong> no Evoluteam.
      </>
    );
  }

  return (
    <>
      Você foi convidado para acessar o{' '}
      <strong style={boldStyle}>Evoluteam</strong>.
    </>
  );
}

export function EmployeeInviteEmail(props: EmployeeInviteProps) {
  const { inviteUrl, inviteeName, expiresAt } = props;
  const greeting = inviteeName ? `Olá, ${firstName(inviteeName)},` : 'Olá,';
  const days = expiresInDays(expiresAt);
  const dayWord = days === 1 ? 'dia' : 'dias';
  const expiryLine = `Este convite expira em ${days} ${dayWord} (${formatDeadlineDate(expiresAt)}).`;

  return (
    <Layout
      preheader="Aceite o convite para acessar a plataforma. O link expira em 7 dias."
      footerMessage="Se você não esperava este convite, pode ignorá-lo com segurança."
    >
      <Heading>Você foi convidado</Heading>
      <Text>{greeting}</Text>
      <Text>{buildBody(props)}</Text>
      <Text>
        O Evoluteam é a plataforma de gestão de pessoas onde seu time
        acompanha avaliações, feedback e desenvolvimento.
      </Text>
      <Button href={inviteUrl}>Aceitar convite</Button>
      <Text variant="muted">{expiryLine}</Text>
      <Text variant="muted">
        Se o botão não funcionar, copie e cole este link no navegador:
      </Text>
      <Text variant="muted">
        <Link href={inviteUrl} style={linkStyle}>
          {inviteUrl}
        </Link>
      </Text>
    </Layout>
  );
}

EmployeeInviteEmail.PreviewProps = {
  inviteUrl: 'https://evolu.team/convite/abc-123-token',
  inviteeName: 'João Silva Santos',
  inviterName: 'Marcio Petigrosso',
  companyName: 'Acme Corp',
  roleLabel: 'colaborador',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
} satisfies EmployeeInviteProps;

export async function renderEmployeeInvite(props: EmployeeInviteProps) {
  return {
    subject: buildSubject(props),
    html: await render(<EmployeeInviteEmail {...props} />),
  };
}

export default EmployeeInviteEmail;
