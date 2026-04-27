'use client';

import { useState } from 'react';
import { OnboardingStep1Company } from './OnboardingStep1Company';
import { OnboardingStep2Profile } from './OnboardingStep2Profile';
import { OnboardingStep3Review } from './OnboardingStep3Review';
import { OnboardingStep4Confirm } from './OnboardingStep4Confirm';
import type { OnboardingStep1Input, OnboardingStep2Input } from '../schema';

const STEP_LABELS = ['Empresa', 'Seus dados', 'Revisar', 'Confirmar'];

export function OnboardingWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [company, setCompany] = useState<OnboardingStep1Input | null>(null);
  const [profile, setProfile] = useState<OnboardingStep2Input | null>(null);

  return (
    <div className="w-full max-w-md">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEP_LABELS.map((label, idx) => {
          const n = idx + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                  done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                ].join(' ')}
              >
                {n}
              </div>
              <span className={`text-[10px] ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-8 shadow-card">
        {step === 1 && (
          <>
            <h2 className="mb-6 text-lg font-semibold">Dados da empresa</h2>
            <OnboardingStep1Company
              defaultValues={company ?? undefined}
              onNext={(data) => { setCompany(data); setStep(2); }}
            />
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="mb-6 text-lg font-semibold">Seus dados de colaborador</h2>
            <OnboardingStep2Profile
              defaultValues={profile ?? undefined}
              onNext={(data) => { setProfile(data); setStep(3); }}
              onBack={() => setStep(1)}
            />
          </>
        )}
        {step === 3 && company && profile && (
          <>
            <h2 className="mb-6 text-lg font-semibold">Revisar estrutura inicial</h2>
            <OnboardingStep3Review
              company={company}
              profile={profile}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          </>
        )}
        {step === 4 && company && profile && (
          <>
            <h2 className="mb-6 text-lg font-semibold">Tudo certo?</h2>
            <OnboardingStep4Confirm
              company={company}
              profile={profile}
              onBack={() => setStep(3)}
            />
          </>
        )}
      </div>
    </div>
  );
}
