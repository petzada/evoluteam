'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { FeedbackSheet } from './FeedbackSheet';
import { FeedbackCard } from './FeedbackCard';
import { markFeedbackAsRead } from '../actions';
import {
  FEEDBACK_TYPES, FEEDBACK_TYPE_LABELS, type FeedbackType,
} from '../schema';
import type { FeedbackRow } from '../queries';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  status: string;
  position: { id: string; name: string } | null;
}

interface Props {
  received: FeedbackRow[];
  sent: FeedbackRow[];
  team: FeedbackRow[];
  company: FeedbackRow[];
  hasTeam: boolean;
  canReadCompany: boolean;
  employees: Employee[];
  competencies: { id: string; name: string }[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  initialOpenSheet?: boolean;
  unreadCount: number;
}

type PeriodFilter = 'all' | '30d' | '6m' | '1y';

function filterByPeriod<T extends { created_at: string }>(rows: T[], period: PeriodFilter) {
  if (period === 'all') return rows;
  const map: Record<Exclude<PeriodFilter, 'all'>, number> = { '30d': 30, '6m': 183, '1y': 365 };
  const days = map[period];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return rows.filter((r) => new Date(r.created_at) >= cutoff);
}

export function FeedbacksPage({
  received, sent, team, company, hasTeam, canReadCompany, employees, competencies,
  currentEmployeeId, isAdmin, initialOpenSheet, unreadCount,
}: Props) {
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(!!initialOpenSheet);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [competencyFilter, setCompetencyFilter] = useState<string[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('all');

  const presetRecipientId = searchParams.get('recipient');

  const applyFilters = useMemo(
    () => (rows: FeedbackRow[]) => {
      let out = rows;
      if (typeFilter.length) out = out.filter((r) => typeFilter.includes(r.type));
      if (competencyFilter.length) {
        out = out.filter((r) =>
          competencyFilter.includes(r.competency_id ?? '__none__'),
        );
      }
      return filterByPeriod(out, period);
    },
    [typeFilter, competencyFilter, period],
  );

  const filteredReceived = useMemo(() => applyFilters(received), [applyFilters, received]);
  const filteredSent = useMemo(() => applyFilters(sent), [applyFilters, sent]);
  const filteredTeam = useMemo(() => applyFilters(team), [applyFilters, team]);
  const filteredCompany = useMemo(() => applyFilters(company), [applyFilters, company]);

  // Marca automaticamente como lido quando abre a página pela 1ª vez
  useEffect(() => {
    if (!currentEmployeeId) return;
    for (const fb of received) {
      if (!fb.read_at) {
        void markFeedbackAsRead(fb.id);
      }
    }
  }, [received, currentEmployeeId]);

  return (
    <div>
      <PageHeader
        title="Feedbacks"
        description="Registre reconhecimentos, orientações e observações ao longo do ano."
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Enviar feedback
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <MultiSelectFilter
          label="Tipos"
          options={(FEEDBACK_TYPES as unknown as FeedbackType[]).map((t) => ({
            value: t, label: FEEDBACK_TYPE_LABELS[t],
          }))}
          value={typeFilter}
          onChange={setTypeFilter}
          width="w-44"
        />
        <MultiSelectFilter
          label="Competências"
          options={[
            { value: '__none__', label: 'Sem competência' },
            ...competencies.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={competencyFilter}
          onChange={setCompetencyFilter}
          width="w-52"
        />
        <Select
          value={period}
          onValueChange={(v) => setPeriod((v as PeriodFilter) ?? 'all')}
          items={[
            { value: 'all', label: 'Qualquer período' },
            { value: '30d', label: 'Últimos 30 dias' },
            { value: '6m', label: 'Últimos 6 meses' },
            { value: '1y', label: 'Último ano' },
          ]}
        >
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer período</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">
            Recebidos {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/20 px-1.5 text-[10px] font-semibold text-primary">
                {unreadCount} novos
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Enviados</TabsTrigger>
          {hasTeam && <TabsTrigger value="team">Minha equipe</TabsTrigger>}
          {canReadCompany && <TabsTrigger value="company">Empresa</TabsTrigger>}
        </TabsList>

        <TabsContent value="received" className="mt-6">
          <FeedbackList
            items={filteredReceived}
            emptyMessage="Nenhum feedback recebido ainda."
            perspective="received"
            unreadSet={new Set(received.filter((r) => !r.read_at).map((r) => r.id))}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <FeedbackList
            items={filteredSent}
            emptyMessage="Você ainda não enviou feedbacks."
            perspective="sent"
            isAdmin={isAdmin}
          />
        </TabsContent>

        {hasTeam && (
          <TabsContent value="team" className="mt-6">
            <FeedbackList
              items={filteredTeam}
              emptyMessage="Nenhum feedback visível da sua equipe."
              perspective="team"
              isAdmin={isAdmin}
            />
          </TabsContent>
        )}

        {canReadCompany && (
          <TabsContent value="company" className="mt-6">
            <FeedbackList
              items={filteredCompany}
              emptyMessage="Nenhum feedback visível no escopo da empresa."
              perspective="team"
              isAdmin={isAdmin}
            />
          </TabsContent>
        )}
      </Tabs>

      <FeedbackSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        employees={employees}
        competencies={competencies}
        currentEmployeeId={currentEmployeeId}
        presetRecipientId={presetRecipientId}
      />
    </div>
  );
}

const PAGE_SIZE = 20;

function FeedbackList({
  items, emptyMessage, perspective, unreadSet, isAdmin,
}: {
  items: FeedbackRow[];
  emptyMessage: string;
  perspective: 'received' | 'sent' | 'team';
  unreadSet?: Set<string>;
  isAdmin: boolean;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const slice = items.slice(0, visible);
  const hasMore = items.length > visible;

  return (
    <>
      <ul className="space-y-3">
        {slice.map((fb) => (
          <li key={fb.id}>
            <FeedbackCard
              feedback={fb}
              perspective={perspective}
              isAdmin={isAdmin}
              unread={unreadSet?.has(fb.id)}
            />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Carregar mais ({items.length - visible} restantes)
          </Button>
        </div>
      )}
    </>
  );
}
