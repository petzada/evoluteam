import { Button as REButton } from '@react-email/components';
import type { ReactNode } from 'react';

export interface ButtonProps {
  href: string;
  children: ReactNode;
}

const buttonStyle = {
  backgroundColor: '#F09469',
  borderRadius: '8px',
  color: '#0F172A',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '14px 28px',
  textDecoration: 'none',
};

export function Button({ href, children }: ButtonProps) {
  return (
    <REButton href={href} style={buttonStyle}>
      {children}
    </REButton>
  );
}
