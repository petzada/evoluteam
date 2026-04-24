import { Button as REButton } from '@react-email/components';
import type { ReactNode } from 'react';

export interface ButtonProps {
  href: string;
  children: ReactNode;
}

const buttonStyle = {
  backgroundColor: '#2563EB',
  borderRadius: '8px',
  color: '#FFFFFF',
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
