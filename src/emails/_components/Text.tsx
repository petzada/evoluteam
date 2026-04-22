import { Text as REText } from '@react-email/components';
import type { ReactNode } from 'react';

export interface TextProps {
  children: ReactNode;
  variant?: 'default' | 'muted';
}

const defaultStyle = {
  color: '#404040',
  fontSize: '15px',
  lineHeight: 1.6,
  margin: '0 0 16px 0',
};

const mutedStyle = {
  color: '#737373',
  fontSize: '13px',
  lineHeight: 1.5,
  margin: '0 0 8px 0',
  wordBreak: 'break-all' as const,
};

export function Text({ children, variant = 'default' }: TextProps) {
  const style = variant === 'muted' ? mutedStyle : defaultStyle;
  return <REText style={style}>{children}</REText>;
}
