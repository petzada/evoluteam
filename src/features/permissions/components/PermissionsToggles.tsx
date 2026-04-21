'use client';

import { cn } from '@/lib/utils';
import { RH_PERMISSION_MODULES, type RhPermissions, type RhPermissionKey } from '../types';

interface Props {
  value: RhPermissions;
  onChange: (next: RhPermissions) => void;
  disabledKeys?: RhPermissionKey[];
  disabledReason?: string;
  title?: string;
}

export function PermissionsToggles({
  value, onChange, disabledKeys = [], disabledReason, title,
}: Props) {
  return (
    <div className="rounded-md border border-primary/25 bg-primary/5 p-3">
      {title && (
        <div className="text-[10px] font-semibold uppercase tracking-widest text-primary/80 mb-2">
          {title}
        </div>
      )}
      <ul className="space-y-0.5">
        {RH_PERMISSION_MODULES.map(({ key, label, description }) => {
          const on = value[key];
          const isDisabled = disabledKeys.includes(key);
          return (
            <li
              key={key}
              className="flex items-start justify-between gap-3 py-2 border-t first:border-t-0 border-primary/15"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-tight">{label}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{description}</div>
              </div>
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => onChange({ ...value, [key]: !on })}
                title={isDisabled ? disabledReason : undefined}
                aria-pressed={on}
                aria-label={`${label}: ${on ? 'ativado' : 'desativado'}`}
                className={cn(
                  'relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0 mt-1',
                  on ? 'bg-primary' : 'bg-muted-foreground/30',
                  isDisabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'inline-block size-3 rounded-full bg-white transition-transform',
                    on ? 'translate-x-3.5' : 'translate-x-0.5',
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
