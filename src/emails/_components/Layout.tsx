import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

export interface LayoutProps {
  preheader: string;
  footerMessage: string;
  children: ReactNode;
}

const FONT_FAMILY =
  "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const bodyStyle = {
  backgroundColor: '#F5F5F5',
  fontFamily: FONT_FAMILY,
  margin: 0,
  padding: '40px 20px',
};

const containerStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  maxWidth: '600px',
  padding: '40px',
  margin: '0 auto',
};

const wordmarkStyle = {
  color: '#F97316',
  fontSize: '22px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: '0 0 32px 0',
  padding: 0,
};

const dividerStyle = {
  borderColor: '#E5E5E5',
  margin: '32px 0 20px 0',
};

const footerTextStyle = {
  color: '#737373',
  fontSize: '13px',
  lineHeight: 1.5,
  margin: '0 0 6px 0',
};

export function Layout({ preheader, footerMessage, children }: LayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section>
            <Text style={wordmarkStyle}>Evoluteam</Text>
          </Section>
          {children}
          <Hr style={dividerStyle} />
          <Text style={footerTextStyle}>Evoluteam · evolu.team</Text>
          <Text style={footerTextStyle}>{footerMessage}</Text>
        </Container>
      </Body>
    </Html>
  );
}
