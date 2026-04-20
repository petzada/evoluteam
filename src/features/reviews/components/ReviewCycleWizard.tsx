'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { WizardShell } from './WizardShell';
import { Step1Basics } from './wizard/Step1Basics';
import { Step2Participants } from './wizard/Step2Participants';
import { Step3Types } from './wizard/Step3Types';
import { Step4Form } from './wizard/Step4Form';
import { Step5Review } from './wizard/Step5Review';
import {
  DEFAULT_QUESTION_TEMPLATE,
  type CycleBasicsInput,
  type CycleTypesInput,
  type ParticipantsSelection,
  type QuestionInput,
} from '../schema';
import { createCycleDraft, publishCycle } from '../actions';

export interface WizardDependencies {
  positions: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  employees: {
    id: string;
    full_name: string;
    email: string;
    manager_id: string | null;
    position: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
  }[];
  competencies: { id: string; name: string }[];
}

interface Props {
  deps: WizardDependencies;
}

type Step = 1 | 2 | 3 | 4 | 5;

const emptyBasics = (): CycleBasicsInput => ({
  name: '',
  description: '',
  periodStart: '',
  periodEnd: '',
  responseStart: new Date().toISOString().split('T')[0],
  responseEnd: '',
});

export function ReviewCycleWizard({ deps }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  const [basics, setBasics] = useState<CycleBasicsInput>(emptyBasics);
  const [participants, setParticipants] = useState<ParticipantsSelection>({
    mode: 'all',
    departmentIds: [],
    positionIds: [],
    manualEmployeeIds: [],
    excludedEmployeeIds: [],
  });
  const [types, setTypes] = useState<CycleTypesInput>({
    includeSelf: true,
    includeManager: true,
  });
  const [questions, setQuestions] = useState<QuestionInput[]>(() =>
    DEFAULT_QUESTION_TEMPLATE.map((q) => ({ ...q })),
  );

  const resolvedParticipantIds = useMemo(
    () => resolveIds(deps.employees, participants),
    [deps.employees, participants],
  );

  async function handleSave(publish: boolean) {
    setLoading(true);
    const result = await createCycleDraft({
      basics,
      types,
      participants,
      questions,
    });
    if (result.error || !result.cycleId) {
      toast.error(result.error ?? 'Erro ao criar ciclo.');
      setLoading(false);
      return;
    }
    if (publish) {
      const pub = await publishCycle(result.cycleId);
      if (pub.error) {
        toast.error(pub.error);
        router.push(`/avaliacoes/${result.cycleId}`);
        setLoading(false);
        return;
      }
      toast.success(`Ciclo publicado! ${pub.assignments ?? 0} avaliações geradas.`);
    } else {
      toast.success('Rascunho salvo.');
    }
    router.push(`/avaliacoes/${result.cycleId}`);
  }

  return (
    <WizardShell step={step}>
      {step === 1 && (
        <Step1Basics
          value={basics}
          onChange={setBasics}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2Participants
          deps={deps}
          value={participants}
          onChange={setParticipants}
          resolvedIds={resolvedParticipantIds}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3Types
          value={types}
          onChange={setTypes}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <Step4Form
          competencies={deps.competencies}
          value={questions}
          onChange={setQuestions}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
        />
      )}
      {step === 5 && (
        <Step5Review
          deps={deps}
          basics={basics}
          participants={participants}
          resolvedIds={resolvedParticipantIds}
          types={types}
          questions={questions}
          loading={loading}
          onBack={() => setStep(4)}
          onEdit={(s) => setStep(s)}
          onSaveDraft={() => handleSave(false)}
          onPublish={() => handleSave(true)}
        />
      )}
    </WizardShell>
  );
}

function resolveIds(
  employees: WizardDependencies['employees'],
  selection: ParticipantsSelection,
): string[] {
  const set = new Set<string>();
  if (selection.mode === 'all') {
    for (const e of employees) set.add(e.id);
  } else {
    if (selection.departmentIds.length) {
      for (const e of employees) if (e.department?.id && selection.departmentIds.includes(e.department.id)) set.add(e.id);
    }
    if (selection.positionIds.length) {
      for (const e of employees) if (e.position?.id && selection.positionIds.includes(e.position.id)) set.add(e.id);
    }
    for (const id of selection.manualEmployeeIds) set.add(id);
  }
  for (const id of selection.excludedEmployeeIds) set.delete(id);
  return Array.from(set);
}

export { Button }; // re-export caso subcomponentes precisem
