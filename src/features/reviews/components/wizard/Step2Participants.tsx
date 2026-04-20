'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import type { ParticipantsSelection } from '../../schema';
import type { WizardDependencies } from '../ReviewCycleWizard';

interface Props {
  deps: WizardDependencies;
  value: ParticipantsSelection;
  onChange: (v: ParticipantsSelection) => void;
  resolvedIds: string[];
  onBack: () => void;
  onNext: () => void;
}

export function Step2Participants({ deps, value, onChange, resolvedIds, onBack, onNext }: Props) {
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);

  const resolvedSet = useMemo(() => new Set(resolvedIds), [resolvedIds]);
  const excludedSet = useMemo(() => new Set(value.excludedEmployeeIds), [value.excludedEmployeeIds]);

  const filteredEmployees = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return deps.employees.filter((e) =>
      !lower || e.full_name.toLowerCase().includes(lower) || e.email.toLowerCase().includes(lower),
    );
  }, [deps.employees, search]);

  const withoutManager = useMemo(
    () => deps.employees.filter((e) => resolvedSet.has(e.id) && !e.manager_id).length,
    [deps.employees, resolvedSet],
  );

  function toggleExclusion(id: string) {
    const next = excludedSet.has(id)
      ? value.excludedEmployeeIds.filter((x) => x !== id)
      : [...value.excludedEmployeeIds, id];
    onChange({ ...value, excludedEmployeeIds: next });
  }

  function toggleManual(id: string) {
    const has = value.manualEmployeeIds.includes(id);
    const next = has
      ? value.manualEmployeeIds.filter((x) => x !== id)
      : [...value.manualEmployeeIds, id];
    onChange({ ...value, manualEmployeeIds: next });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Participantes</h2>
        <p className="text-sm text-muted-foreground">
          Selecione quem será avaliado no ciclo. Você pode combinar "todos os ativos" ou filtros por departamento, cargo e seleção manual.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={value.mode === 'all'}
              onChange={() => onChange({ ...value, mode: 'all' })}
            />
            <span className="text-sm">Todos os colaboradores ativos</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={value.mode === 'filters'}
              onChange={() => onChange({ ...value, mode: 'filters' })}
            />
            <span className="text-sm">Por filtros</span>
          </label>
        </div>

        {value.mode === 'filters' && (
          <div className="rounded-md border p-4 space-y-3 bg-muted/20">
            <div className="flex flex-wrap gap-3">
              <MultiSelectFilter
                label="Departamentos"
                options={deps.departments.map((d) => ({ value: d.id, label: d.name }))}
                value={value.departmentIds}
                onChange={(next) => onChange({ ...value, departmentIds: next })}
                width="w-52"
              />
              <MultiSelectFilter
                label="Cargos"
                options={deps.positions.map((p) => ({ value: p.id, label: p.name }))}
                value={value.positionIds}
                onChange={(next) => onChange({ ...value, positionIds: next })}
                width="w-48"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Selecionar colaboradores específicos
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-56 overflow-auto rounded border bg-background">
                {filteredEmployees.slice(0, 60).map((e) => {
                  const checked = value.manualEmployeeIds.includes(e.id);
                  return (
                    <label key={e.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer text-sm border-b last:border-b-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleManual(e.id)}
                      />
                      <span className="flex-1">
                        {e.full_name}
                        <span className="text-muted-foreground"> · {e.position?.name ?? '—'} · {e.department?.name ?? '—'}</span>
                      </span>
                    </label>
                  );
                })}
                {filteredEmployees.length > 60 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Mostrando primeiros 60. Refine a busca para ver mais.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md border p-4 bg-primary/5">
        <p className="text-sm">
          <span className="font-medium">{resolvedIds.length}</span> colaborador(es) serão avaliados
          {excludedSet.size > 0 && ` · ${excludedSet.size} excluído(s)`}
          {withoutManager > 0 && ` · ${withoutManager} sem gestor`}
        </p>
        {resolvedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setShowList((v) => !v)}
            className="mt-2 text-xs text-primary hover:underline"
          >
            {showList ? 'Ocultar lista' : 'Ver/desmarcar individualmente'}
          </button>
        )}
        {showList && (
          <ul className="mt-3 max-h-56 overflow-auto space-y-1">
            {resolvedIds.map((id) => {
              const e = deps.employees.find((x) => x.id === id);
              if (!e) return null;
              const excluded = excludedSet.has(id);
              return (
                <li key={id}>
                  <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-background cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={!excluded}
                      onChange={() => toggleExclusion(id)}
                    />
                    <span className={excluded ? 'line-through text-muted-foreground' : ''}>
                      {e.full_name}
                      <span className="text-muted-foreground"> · {e.position?.name ?? '—'}{!e.manager_id ? ' · sem gestor' : ''}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-between gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button disabled={resolvedIds.length === 0} onClick={onNext}>Próximo</Button>
      </div>
    </div>
  );
}
