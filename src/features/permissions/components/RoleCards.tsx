'use client';

import { cn } from '@/lib/utils';
import { ROLE_LABELS, type Role } from '../types';

type RoleCardDef = {
  role: Role;
  description: string;
};

const ROLE_CARDS: RoleCardDef[] = [
  { role: 'user', description: 'Acesso ao proprio perfil, feedbacks e PDI.' },
  { role: 'rh', description: 'Voce escolhe em quais areas atua.' },
  { role: 'admin_rh', description: 'Acesso total, incluindo configuracoes.' },
  { role: 'director', description: 'Ve tudo e opina em PDI, ciclo e candidato.' },
];

interface Props {
  value: Role;
  onChange: (role: Role) => void;
  disabledRoles?: Role[];
  disabledReason?: string;
}

export function RoleCards({ value, onChange, disabledRoles = [], disabledReason }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {ROLE_CARDS.map(({ role, description }) => {
        const isSelected = value === role;
        const isDisabled = disabledRoles.includes(role);
        const tooltipText = isDisabled ? disabledReason : undefined;

        return (
          <button
            key={role}
            type="button"
            disabled={isDisabled}
            onClick={() => { if (!isDisabled) onChange(role); }}
            title={tooltipText}
            className={cn(
              'text-left flex items-start gap-2.5 rounded-md border p-3 transition-colors',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:border-muted-foreground/40',
              isDisabled && 'opacity-50 cursor-not-allowed hover:border-border',
            )}
          >
            <span
              className={cn(
                'mt-0.5 size-3.5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-colors',
                isSelected ? 'border-primary' : 'border-muted-foreground/40',
              )}
            >
              {isSelected && <span className="size-1.5 rounded-full bg-primary" />}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-tight">{ROLE_LABELS[role]}</div>
              <div className="mt-0.5 text-xs text-muted-foreground leading-snug">{description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
