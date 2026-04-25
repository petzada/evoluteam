import { render } from '@react-email/render';
import { Heading } from './_components/Heading';
import { Layout } from './_components/Layout';
import { Text } from './_components/Text';
import { teamSizeLabels, type LeadInput } from '@/features/landing/schema';

export interface LeadNotificationProps extends LeadInput {
  source: string;
}

const labelStyle = { color: '#171717', fontWeight: 600 };

function line(label: string, value: string) {
  return (
    <Text>
      <span style={labelStyle}>{label}:</span> {value}
    </Text>
  );
}

function buildSubject(props: LeadNotificationProps) {
  return `Novo lead Evoluteam: ${props.company}`;
}

export function LeadNotificationEmail(props: LeadNotificationProps) {
  return (
    <Layout
      preheader={`Novo pedido de demo de ${props.fullName} (${props.company}).`}
      footerMessage="Este email foi gerado pelo formulário público da landing."
    >
      <Heading>Novo pedido de demonstração</Heading>
      {line('Nome', props.fullName)}
      {line('E-mail', props.email)}
      {line('Empresa', props.company)}
      {line('Papel', props.role)}
      {line('Tamanho do time', teamSizeLabels[props.teamSize])}
      {line('Origem', props.source)}
      {props.reason ? (
        <Text>
          <span style={labelStyle}>Motivo:</span> {props.reason}
        </Text>
      ) : (
        <Text variant="muted">Motivo não informado.</Text>
      )}
    </Layout>
  );
}

LeadNotificationEmail.PreviewProps = {
  fullName: 'Ana Martins',
  email: 'ana@empresa.com',
  company: 'Empresa Exemplo',
  role: 'RH',
  teamSize: '51-150',
  reason: 'Queremos sair da planilha antes do próximo ciclo.',
  source: 'landing',
} satisfies LeadNotificationProps;

export async function renderLeadNotification(props: LeadNotificationProps) {
  return {
    subject: buildSubject(props),
    html: await render(<LeadNotificationEmail {...props} />),
  };
}

export default LeadNotificationEmail;
