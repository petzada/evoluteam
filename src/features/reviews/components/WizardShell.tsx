'use client';

import { cn } from '@/lib/utils';

const STEPS = ['Dados', 'Participantes', 'Tipos', 'Formulário', 'Revisar'];

interface Props {
  step: 1 | 2 | 3 | 4 | 5;
  children: React.ReactNode;
}

export function WizardShell({ step, children }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, idx) => {
          const n = idx + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  (active || done) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {n}
              </div>
              <span className={cn('text-[10px]', active ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>
    </div>
  );
}
