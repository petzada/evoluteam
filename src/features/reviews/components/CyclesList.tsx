'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/date';
import type { CycleRow } from '../queries';

export type AssignmentForUser = {
  id: string;
  cycle_id: string;
  status: string;
  type: string;
  reviewee: { id: string; full_name: string; position: { id: string; name: string } | null } | null;
  cycle: { id: string; name: string; response_end: string; status: string } | null;
};

interface Props {
  cycles: (CycleRow & { progress?: { submitted: number; total: number } })[];
  pending: AssignmentForUser[];
  isAdmin: boolean;
}

type DerivedStatus = 'draft' | 'scheduled' | 'in_progress' | 'closed' | 'archived';

function deriveStatus(cycle: CycleRow): DerivedStatus {
  if (cycle.status === 'draft') return 'draft';
  if (cycle.status === 'closed') return 'closed';
  if (cycle.status === 'archived') return 'archived';
  const now = new Date();
  if (new Date(cycle.response_start) > now) return 'scheduled';
  if (new Date(cycle.response_end) < now) return 'closed';
  return 'in_progress';
}

const STATUS_LABELS: Record<DerivedStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  closed: 'Encerrado',
  archived: 'Arquivado',
};

const STATUS_VARIANTS: Record<DerivedStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  scheduled: 'secondary',
  in_progress: 'default',
  closed: 'outline',
  archived: 'outline',
};

const FILTER_ITEMS = [
  { value: 'all', label: 'Todos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'closed', label: 'Encerrado' },
  { value: 'archived', label: 'Arquivado' },
];

export function CyclesList({ cycles, pending, isAdmin }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return cycles.filter((c) => {
      const matchSearch = !lower || c.name.toLowerCase().includes(lower);
      const matchStatus = status === 'all' || deriveStatus(c) === status;
      return matchSearch && matchStatus;
    });
  }, [cycles, search, status]);

  return (
    <div>
      <PageHeader
        title="Avaliações"
        description="Ciclos de avaliação de desempenho da empresa."
        actions={isAdmin && (
          <Link href="/avaliacoes/nova">
            <Button><Plus className="h-4 w-4 mr-2" />Novo ciclo</Button>
          </Link>
        )}
      />

      {pending.length > 0 && (
        <section className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-3">
            Pendentes para você ({pending.length})
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pending.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/avaliacoes/${a.cycle_id}/responder/${a.id}`}
                  className="block rounded-md border border-primary/40 bg-primary/5 p-4 hover:bg-primary/10 transition-colors"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                    {a.type === 'self' ? 'Autoavaliação' : 'Avaliação do gestor'}
                  </p>
                  <p className="font-medium">
                    {a.type === 'self' ? 'Sobre você' : `Sobre ${a.reviewee?.full_name ?? '—'}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.cycle?.name} · prazo {a.cycle?.response_end ? formatDate(a.cycle.response_end) : '—'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ciclo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v ?? 'all')} items={FILTER_ITEMS}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILTER_ITEMS.map((it) => (
              <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium">Nenhum ciclo encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || status !== 'all' ? 'Tente outros filtros.' : 'Crie o primeiro ciclo de avaliação.'}
          </p>
          {isAdmin && !search && status === 'all' && (
            <Link href="/avaliacoes/nova">
              <Button className="mt-4"><Plus className="h-4 w-4 mr-2" />Novo ciclo</Button>
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => {
            const derived = deriveStatus(c);
            const progress = c.progress;
            const pct = progress && progress.total > 0
              ? Math.round((progress.submitted / progress.total) * 100)
              : null;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/avaliacoes/${c.id}`)}
                  className="w-full text-left rounded-md border p-4 hover:bg-muted/30 transition-colors flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{c.name}</p>
                      <Badge variant={STATUS_VARIANTS[derived]}>{STATUS_LABELS[derived]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Período: {formatDate(c.period_start)} – {formatDate(c.period_end)}
                      {' · '}
                      Resposta: {formatDate(c.response_start)} – {formatDate(c.response_end)}
                    </p>
                  </div>
                  {pct !== null && (
                    <div className="text-right min-w-[88px]">
                      <p className="text-sm font-medium">{pct}%</p>
                      <p className="text-xs text-muted-foreground">{progress!.submitted}/{progress!.total}</p>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
