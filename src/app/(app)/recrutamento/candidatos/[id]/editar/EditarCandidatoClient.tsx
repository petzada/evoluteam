'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CandidateSheet, type CandidateInitial,
} from '@/features/recruitment/components/CandidateSheet';

export function EditarCandidatoClient({ initial }: { initial: CandidateInitial }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  function onOpenChange(v: boolean) {
    setOpen(v);
    if (!v) router.push(`/recrutamento/candidatos/${initial.id}`);
  }
  return <CandidateSheet open={open} onOpenChange={onOpenChange} initial={initial} redirectAfterCreate={false} />;
}
