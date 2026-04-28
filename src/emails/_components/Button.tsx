import { Button as REButton } from '@react-email/components';
import type { ReactNode } from 'react';
import { BRAND } from '@/lib/brand';

export interface ButtonProps {
  href: string;
  children: ReactNode;
}

const buttonStyle = {
  backgroundColor: BRAND.colors.coral,
  borderRadius: '8px',
  color: BRAND.colors.slate,
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
