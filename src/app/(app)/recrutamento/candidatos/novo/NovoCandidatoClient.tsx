'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateSheet } from '@/features/recruitment/components/CandidateSheet';

export function NovoCandidatoClient() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  function onOpenChange(v: boolean) {
    setOpen(v);
    if (!v) router.push('/recrutamento/candidatos');
  }
  return <CandidateSheet open={open} onOpenChange={onOpenChange} initial={null} />;
}
