'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEED_COMPETENCIES, type OnboardingStep1Input, type OnboardingStep2Input } from '../schema';

interface Props {
  company: OnboardingStep1Input;
  profile: OnboardingStep2Input;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingStep3Review({ company, profile, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Empresa</h3>
        <p className="font-medium">{company.name}</p>
        <p className="text-sm text-muted-foreground">{company.segment} · {company.teamSize} pessoas</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Você</h3>
        <p className="font-medium">{profile.fullName}</p>
        <p className="text-sm text-muted-foreground">{profile.positionName}</p>
        {profile.departmentName && (
          <p className="text-sm text-muted-foreground">{profile.departmentName}</p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Competências iniciais</h3>
        <div className="flex flex-wrap gap-2">
          {SEED_COMPETENCIES.map((c) => (
            <Badge key={c} variant="secondary">{c}</Badge>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Seu cargo já é o primeiro cadastrado. Você pode criar outros cargos em Configurações depois.
      </p>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Voltar</Button>
        <Button type="button" className="flex-1" onClick={onNext}>Próximo</Button>
      </div>
    </div>
  );
}
