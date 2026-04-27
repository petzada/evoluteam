'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobOpeningSheet } from '@/features/recruitment/components/JobOpeningSheet';

interface TaxonomyItem { id: string; name: string }
interface ManagerItem { id: string; full_name: string }

interface Props {
  departments: TaxonomyItem[];
  positions: TaxonomyItem[];
  managers: ManagerItem[];
  canCreateDepartments: boolean;
  canCreatePositions: boolean;
}

export function NovaVagaClient({
  departments,
  positions,
  managers,
  canCreateDepartments,
  canCreatePositions,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function onOpenChange(v: boolean) {
    setOpen(v);
    if (!v) router.push('/recrutamento/vagas');
  }

  return (
    <JobOpeningSheet
      open={open}
      onOpenChange={onOpenChange}
      departments={departments}
      positions={positions}
      managers={managers}
      canCreateDepartments={canCreateDepartments}
      canCreatePositions={canCreatePositions}
      initial={null}
    />
  );
}
