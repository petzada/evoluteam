'use client';

import { cn } from '@/lib/utils';
import {
  SCREEN_PERMISSION_MODULES,
  type ScreenAction,
  type ScreenKey,
  type ScreenPermissionKey,
  type ScreenPermissions,
} from '../types';

interface Props {
  value: ScreenPermissions;
  onChange: (next: ScreenPermissions) => void;
  /**
   * Lista de permissoes (no formato "<screen>.<action>") que o actor NAO
   * pode conceder — ficam desabilitadas. Usado pra limitar escalacao:
   * colaborador com colaboradores.edit so concede subset dos proprios toggles.
   */
  disabledKeys?: ScreenPermissionKey[];
  disabledReason?: string;
  title?: string;
}

export function ScreenPermissionsToggles({
  value, onChange, disabledKeys = [], disabledReason, title,
}: Props) {
  const setToggle = (screen: ScreenKey, action: ScreenAction, next: boolean) => {
    const key = `${screen}.${action}` as ScreenPermissionKey;
    const updated: ScreenPermissions = { ...value, [key]: next };
    // Regra: marcar edit auto-marca view. Desmarcar view auto-desmarca edit.
    if (action === 'edit' && next === true) {
      const viewKey = `${screen}.view` as ScreenPermissionKey;
      updated[viewKey] = true;
    }
    if (action === 'view' && next === false) {
      const editKey = `${screen}.edit` as ScreenPermissionKey;
      if (editKey in updated) updated[editKey] = false;
    }
    onChange(updated);
  };

  return (
    <div className="rounded-md border border-primary/25 bg-primary/5 p-3">
      {title && (
        <div className="text-[10px] font-semibold uppercase tracking-widest text-primary/80 mb-2">
          {title}
        </div>
      )}

      {SCREEN_PERMISSION_MODULES.map((section, sectionIdx) => (
        <div
          key={section.section}
          className={cn(sectionIdx > 0 && 'mt-3 pt-3 border-t border-primary/15')}
        >
          <div className="text-[10px] font-semibold uppercase tracking-widest text-primary/60 mb-1.5">
            {section.section}
          </div>
          <div className="grid grid-cols-[1fr_3.5rem_3.5rem] gap-x-3 gap-y-1 items-center">
            <div aria-hidden="true" />
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center">
              Ver
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center">
              Editar
            </div>

            {section.screens.map(({ key, label, description, hasEdit }) => {
              const viewKey = `${key}.view` as ScreenPermissionKey;
              const editKey = `${key}.edit` as ScreenPermissionKey;
              const viewOn = value[viewKey] === true;
              const editOn = hasEdit && value[editKey] === true;
              const viewDisabled = disabledKeys.includes(viewKey);
              const editDisabled = !hasEdit || disabledKeys.includes(editKey);

              return (
                <div key={key} className="contents">
                  <div className="py-1 min-w-0">
                    <div className="text-sm font-medium leading-tight">{label}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                      {description}
                    </div>
                  </div>
                  <ToggleCell
                    on={viewOn}
                    disabled={viewDisabled}
                    disabledReason={viewDisabled ? disabledReason : undefined}
                    ariaLabel={`${label}: visualizar ${viewOn ? 'ativado' : 'desativado'}`}
                    onClick={() => setToggle(key, 'view', !viewOn)}
                  />
                  {hasEdit ? (
                    <ToggleCell
                      on={editOn}
                      disabled={editDisabled}
                      disabledReason={editDisabled ? disabledReason : undefined}
                      ariaLabel={`${label}: editar ${editOn ? 'ativado' : 'desativado'}`}
                      onClick={() => setToggle(key, 'edit', !editOn)}
                    />
                  ) : (
                    <div className="text-muted-foreground/50 text-center text-xs">—</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ToggleCell({
  on, disabled, disabledReason, ariaLabel, onClick,
}: {
  on: boolean;
  disabled: boolean;
  disabledReason?: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        title={disabledReason}
        aria-pressed={on}
        aria-label={ariaLabel}
        className={cn(
          'relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0',
          on ? 'bg-primary' : 'bg-muted-foreground/30',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span
          className={cn(
            'inline-block size-3 rounded-full bg-white transition-transform',
            on ? 'translate-x-3.5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
