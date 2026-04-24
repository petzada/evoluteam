import { Link } from '@react-email/components';
import { render } from '@react-email/render';
import { Button } from './_components/Button';
import { Heading } from './_components/Heading';
import { Layout } from './_components/Layout';
import { Text } from './_components/Text';
import { daysUntil, formatDeadlineDate } from './_lib/format-deadline';

export interface ReviewReminderProps {
  reviewerName?: string;
  cycleName?: string;
  pendingCount: number;
  responseEnd?: Date;
  cycleUrl: string;
}

const linkStyle = { color: '#2563EB', textDecoration: 'underline' };

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0];
}

function pendingNoun(count: number): string {
  return count === 1 ? 'avaliação pendente' : 'avaliações pendentes';
}

function buildSubject(props: ReviewReminderProps): string {
  const noun = pendingNoun(props.pendingCount);
  return props.cycleName
    ? `Lembrete: você tem ${props.pendingCount} ${noun} em "${props.cycleName}"`
    : `Lembrete: você tem ${props.pendingCount} ${noun}`;
}

function buildPreheader(responseEnd?: Date): string {
  if (!responseEnd) return 'Você tem avaliações pendentes. Finalize quando puder.';
  const days = daysUntil(responseEnd);
  if (days <= 0) return 'O prazo de resposta está acabando. Finalize agora.';
  if (days === 1) return 'O ciclo termina amanhã. Não esqueça de finalizar.';
  return `O ciclo termina em ${days} dias. Não esqueça de finalizar.`;
}

function buildDeadlineLine(responseEnd: Date): string {
  const days = daysUntil(responseEnd);
  const dateStr = formatDeadlineDate(responseEnd);
  if (days < 0) return 'O prazo de resposta expirou.';
  if (days === 0) return 'O ciclo termina hoje.';
  if (days === 1) return `O ciclo termina amanhã (${dateStr}).`;
  return `O ciclo termina em ${dateStr} (em ${days} dias).`;
}

function buildBodyLine(props: ReviewReminderProps): string {
  const noun = pendingNoun(props.pendingCount);
  if (props.cycleName) {
    return `Você tem ${props.pendingCount} ${noun} no ciclo "${props.cycleName}".`;
  }
  return `Você tem ${props.pendingCount} ${noun}.`;
}

export function ReviewReminderEmail(props: ReviewReminderProps) {
  const { reviewerName, responseEnd, cycleUrl } = props;
  const greeting = reviewerName ? `Olá, ${firstName(reviewerName)},` : 'Olá,';
  const bodyLine = buildBodyLine(props);
  const deadlineLine = responseEnd ? buildDeadlineLine(responseEnd) : null;

  return (
    <Layout
      preheader={buildPreheader(responseEnd)}
      footerMessage="Você está recebendo este email porque foi designado como avaliador."
    >
      <Heading>Você tem avaliações pendentes</Heading>
      <Text>{greeting}</Text>
      <Text>{bodyLine}</Text>
      {deadlineLine && <Text variant="muted">{deadlineLine}</Text>}
      <Button href={cycleUrl}>Abrir avaliações</Button>
      <Text variant="muted">
        Se o botão não funcionar, copie e cole este link no navegador:
      </Text>
      <Text variant="muted">
        <Link href={cycleUrl} style={linkStyle}>
          {cycleUrl}
        </Link>
      </Text>
    </Layout>
  );
}

ReviewReminderEmail.PreviewProps = {
  reviewerName: 'João Silva Santos',
  cycleName: 'Avaliação Q2 2026',
  pendingCount: 3,
  responseEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
  cycleUrl: 'https://evolu.team/avaliacoes/abc-123',
} satisfies ReviewReminderProps;

export async function renderReviewReminder(props: ReviewReminderProps) {
  return {
    subject: buildSubject(props),
    html: await render(<ReviewReminderEmail {...props} />),
  };
}

export default ReviewReminderEmail;
