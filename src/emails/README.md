# Templates de e-mail (react-email)

Templates transacionais do Evoluteam, escritos como componentes React e renderizados para HTML via `@react-email/render`. Despachados pelo Resend via `sendEmail()` (`src/lib/email.ts`).

## Preview local

```bash
pnpm email:dev
```

Abre `http://localhost:3001` com hot reload. Lista todos os templates em `src/emails/*.tsx` e permite enviar e-mail de teste pra um endereço.

## Estrutura

```
src/emails/
├─ _components/   # Layout, Button, Heading, Text — reusar sempre
├─ _lib/          # Helpers (role-label, etc.)
├─ <template>.tsx
└─ <template>.test.tsx
```

## Padrão para novo template

Cada template exporta o componente React e uma função `render*` que retorna `{ subject, html }`:

```tsx
// src/emails/meu-template.tsx
import { render } from '@react-email/render';
import { Layout } from './_components/Layout';
import { Heading } from './_components/Heading';
import { Text } from './_components/Text';
import { Button } from './_components/Button';

export interface MeuTemplateProps {
  nome: string;
  url: string;
}

export function MeuTemplateEmail({ nome, url }: MeuTemplateProps) {
  return (
    <Layout
      preheader="Texto curto que aparece ao lado do subject na caixa de entrada."
      footerMessage="Mensagem específica do template."
    >
      <Heading>Título</Heading>
      <Text>Olá, {nome},</Text>
      <Text>Corpo do e-mail.</Text>
      <Button href={url}>CTA</Button>
      <Text variant="muted">Se o botão não funcionar, copie e cole este link no navegador:</Text>
      <Text variant="muted">{url}</Text>
    </Layout>
  );
}

export async function renderMeuTemplate(props: MeuTemplateProps) {
  return {
    subject: 'Assunto do e-mail',
    html: await render(<MeuTemplateEmail {...props} />),
  };
}

export default MeuTemplateEmail; // para o `email dev` detectar
```

## Regras visuais (quirks de cliente de e-mail)

- **Estilos inline** via `style={{}}`. Sem CSS externo, sem classes.
- **Sem Flexbox/Grid**. Usar `<Section>`, `<Row>`, `<Column>` (renderizam tabelas).
- **Cores em HEX**. Outlook ignora OKLCH.
- **Imagens**: `width`/`height` explícitos + `alt` obrigatório.
- **Font stack**: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

## Integração com `sendEmail()`

```ts
import { sendEmail } from '@/lib/email';
import { renderMeuTemplate } from '@/emails/meu-template';

await sendEmail({
  to: email,
  ...(await renderMeuTemplate({ nome: 'Marcio', url: 'https://...' })),
});
```

`sendEmail()` recebe `{ to, subject, html }` — interface não muda quando você adiciona novos templates.

## Testes

Use `toContain()` em strings do HTML renderizado, não snapshots cegos (whitespace muda entre upgrades do `@react-email/render`). Verifique: subject correto, href do CTA, preheader presente, variantes/fallbacks de conteúdo. Exemplo: `employee-invite.test.tsx`.
