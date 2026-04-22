import { Link } from '@react-email/components';
import { render } from '@react-email/render';
import { Button } from './_components/Button';
import { Heading } from './_components/Heading';
import { Layout } from './_components/Layout';
import { Text } from './_components/Text';

export interface AdminWelcomeProps {
  recoveryUrl: string;
}

const linkStyle = { color: '#F97316', textDecoration: 'underline' };

export function AdminWelcomeEmail({ recoveryUrl }: AdminWelcomeProps) {
  return (
    <Layout
      preheader="Sua conta de administrador está pronta. Defina sua senha para começar."
      footerMessage="Se você não esperava este email, pode ignorá-lo."
    >
      <Heading>Bem-vindo ao Evoluteam</Heading>
      <Text>Olá,</Text>
      <Text>
        Sua conta de administrador no Evoluteam foi criada. Para começar,
        defina sua senha e finalize o cadastro da sua empresa.
      </Text>
      <Button href={recoveryUrl}>Definir minha senha</Button>
      <Text variant="muted">
        Se o botão não funcionar, copie e cole este link no navegador:
      </Text>
      <Text variant="muted">
        <Link href={recoveryUrl} style={linkStyle}>
          {recoveryUrl}
        </Link>
      </Text>
    </Layout>
  );
}

AdminWelcomeEmail.PreviewProps = {
  recoveryUrl: 'https://evolu.team/forgot-password',
} satisfies AdminWelcomeProps;

export async function renderAdminWelcome(props: AdminWelcomeProps) {
  return {
    subject: 'Bem-vindo ao Evoluteam — defina sua senha',
    html: await render(<AdminWelcomeEmail {...props} />),
  };
}

export default AdminWelcomeEmail;
