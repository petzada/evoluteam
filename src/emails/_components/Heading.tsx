import { Heading as REHeading } from '@react-email/components';
import type { ReactNode } from 'react';

export interface HeadingProps {
  children: ReactNode;
}

const headingStyle = {
  color: '#171717',
  fontSize: '22px',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  lineHeight: 1.3,
  margin: '0 0 16px 0',
};

export function Heading({ children }: HeadingProps) {
  return <REHeading style={headingStyle}>{children}</REHeading>;
}
