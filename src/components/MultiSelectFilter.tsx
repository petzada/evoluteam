'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  placeholder?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  width?: string;
  emptyText?: string;
}

export function MultiSelectFilter({
  label, placeholder, options, value, onChange, width = 'w-44', emptyText = 'Nenhuma opção',
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    if (!lower) return options;
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, search]);

  const buttonLabel = value.length === 0
    ? placeholder ?? `Todos os ${label.toLowerCase()}`
    : value.length === 1
      ? options.find((o) => o.value === value[0])?.label ?? label
      : `${value.length} ${label.toLowerCase()}`;

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  function clear() {
    onChange([]);
    setSearch('');
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" className={cn('justify-between', width)}>
            <span className="truncate">{buttonLabel}</span>
            {value.length > 0 ? (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Limpar ${label}`}
                onClick={(e) => { e.stopPropagation(); clear(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clear(); } }}
                className="ml-1 inline-flex items-center justify-center rounded hover:bg-muted p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </span>
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${label.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">{emptyText}</p>
          ) : (
            filtered.map((opt) => {
              const checked = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left"
                >
                  <span className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border',
                    checked ? 'bg-primary border-primary text-primary-foreground' : 'border-input',
                  )}>
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex-1 truncate">{opt.label}</span>
                </button>
              );
            })
          )}
        </div>
        {value.length > 0 && (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" onClick={clear} className="w-full justify-center">
              Limpar seleção
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
