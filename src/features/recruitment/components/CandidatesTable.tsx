'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { formatDate } from '@/lib/date';
import { CandidateSheet } from './CandidateSheet';
import type { CandidateRow } from '../queries/candidates';
import {
  CANDIDATE_SOURCE_LABELS, CANDIDATE_SOURCES, type CandidateSource,
} from '../schema';

interface Props {
  candidates: CandidateRow[];
  canCreate: boolean;
}

type ActiveAppFilter = 'all' | 'yes' | 'no';

const ACTIVE_APP_ITEMS = [
  { value: 'all', label: 'Todos' },
  { value: 'yes', label: 'Com aplicação ativa' },
  { value: 'no', label: 'Sem aplicação ativa' },
];

export function CandidatesTable({ candidates, canCreate }: Props) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [activeAppFilter, setActiveAppFilter] = useState<ActiveAppFilter>('all');

  const sourceOptions = useMemo(
    () => CANDIDATE_SOURCES.map((s) => ({ value: s, label: CANDIDATE_SOURCE_LABELS[s] })),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => {
      if (q) {
        const hit = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (sourceFilter.length > 0 && !sourceFilter.includes(c.source)) return false;
      if (activeAppFilter === 'yes' && c.active_applications_count === 0) return false;
      if (activeAppFilter === 'no' && c.active_applications_count > 0) return false;
      return true;
    });
  }, [candidates, search, sourceFilter, activeAppFilter]);

  const hasFilters = search.length > 0 || sourceFilter.length > 0 || activeAppFilter !== 'all';

  return (
    <div>
      <PageHeader
        title="Candidatos"
        description="Banco global de candidatos da empresa."
        actions={canCreate && (
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo candidato
          </Button>
        )}
      />

      {candidates.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Nenhum candidato cadastrado"
          description="Cadastre o primeiro candidato no banco global."
          action={canCreate && (
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo candidato
            </Button>
          )}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <MultiSelectFilter
              label="Origens"
              options={sourceOptions}
              value={sourceFilter}
              onChange={setSourceFilter}
              width="w-44"
            />
            <Select
              value={activeAppFilter}
              onValueChange={(v) => setActiveAppFilter((v ?? 'all') as ActiveAppFilter)}
              items={ACTIVE_APP_ITEMS}
            >
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVE_APP_ITEMS.map((it) => (
                  <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Nenhum candidato encontrado"
              description={hasFilters ? 'Tente outros filtros.' : 'Cadastre o primeiro candidato.'}
            />
          ) : (
            <div className="rounded-md border bg-card shadow-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Vagas ativas</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/recrutamento/candidatos/${c.id}`)}
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm">{c.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {c.source === 'outro' && c.source_other
                            ? c.source_other
                            : CANDIDATE_SOURCE_LABELS[c.source as CandidateSource]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.active_applications_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {canCreate && (
        <CandidateSheet open={sheetOpen} onOpenChange={setSheetOpen} initial={null} />
      )}
    </div>
  );
}
