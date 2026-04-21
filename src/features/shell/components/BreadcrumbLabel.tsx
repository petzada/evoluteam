'use client';

import { useRegisterBreadcrumbLabel } from '../BreadcrumbContext';

export function BreadcrumbLabel({ segment, label }: { segment: string; label: string }) {
  useRegisterBreadcrumbLabel(segment, label);
  return null;
}
