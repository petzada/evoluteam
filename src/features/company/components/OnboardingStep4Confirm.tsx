'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createCompany } from '../actions';
import type { OnboardingStep1Input, OnboardingStep2Input } from '../schema';

interface Props {
  company: OnboardingStep1Input;
  profile: OnboardingStep2Input;
  onBack: () => void;
}

export function OnboardingStep4Confirm({ company, profile, onBack }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    const result = await createCompany({
      company: {
        name: company.name,
        cnpj: company.cnpj,
        segment: company.segment,
        teamSize: company.teamSize,
      },
      profile: {
        fullName: profile.fullName,
        positionName: profile.positionName,
        departmentName: profile.departmentName,
        hireDate: profile.hireDate,
        phone: profile.phone,
      },
    });
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
    // redirect happens inside createCompany on success
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Empresa</p>
            <p className="font-medium">{company.name}</p>
            <p className="text-sm text-muted-foreground">{company.segment}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Você</p>
            <p className="font-medium">{profile.fullName}</p>
            <p className="text-sm text-muted-foreground">{profile.positionName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Estrutura</p>
            <p className="text-sm text-muted-foreground">1 cargo · 7 competências</p>
            {profile.departmentName && (
              <p className="text-sm text-muted-foreground">1 departamento: {profile.departmentName}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={loading}>
          Voltar
        </Button>
        <Button type="button" className="flex-1" onClick={handleCreate} disabled={loading}>
          {loading ? 'Criando…' : 'Criar minha empresa'}
        </Button>
      </div>
    </div>
  );
}
