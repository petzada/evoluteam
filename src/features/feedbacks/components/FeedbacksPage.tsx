'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { FeedbackSheet } from './FeedbackSheet';
import { FeedbackCard } from './FeedbackCard';
import { loadCompanyFeedbacksPage, markFeedbackAsRead } from '../actions';
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
type TabValue = 'received' | 'sent' | 'team' | 'company';

const LOCAL_PAGE_SIZE = 20;
const COMPANY_PAGE_SIZE = 20;

function filterByPeriod<T extends { created_at: string }>(rows: T[], period: PeriodFilter) {
  if (period === 'all') return rows;
  const map: Record<Exclude<PeriodFilter, 'all'>, number> = { '30d': 30, '6m': 183, '1y': 365 };
  const days = map[period];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return rows.filter((row) => new Date(row.created_at) >= cutoff);
}

function toFilterKey(typeFilter: string[], competencyFilter: string[], period: PeriodFilter) {
  const types = [...typeFilter].sort().join(',');
  const competencies = [...competencyFilter].sort().join(',');
  return `${types}|${competencies}|${period}`;
}

function appendUniqueFeedbacks(current: FeedbackRow[], next: FeedbackRow[]) {
  if (current.length === 0) return next;
  const knownIds = new Set(current.map((row) => row.id));
  const merged = [...current];
  for (const row of next) {
    if (knownIds.has(row.id)) continue;
    knownIds.add(row.id);
    merged.push(row);
  }
  return merged;
}

export function FeedbacksPage({
  received,
  sent,
  team,
  hasTeam,
  canReadCompany,
  employees,
  competencies,
  currentEmployeeId,
  isAdmin,
  initialOpenSheet,
  unreadCount,
}: Props) {
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(!!initialOpenSheet);
  const [activeTab, setActiveTab] = useState<TabValue>('received');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [competencyFilter, setCompetencyFilter] = useState<string[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [companyRows, setCompanyRows] = useState<FeedbackRow[]>([]);
  const [companyPage, setCompanyPage] = useState(0);
  const [companyHasMore, setCompanyHasMore] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [companyInitialized, setCompanyInitialized] = useState(false);

  const presetRecipientId = searchParams.get('recipient');
  const companyRequestRef = useRef(0);
  const companyLoadedFilterKeyRef = useRef('');
  const companyFilterKey = useMemo(
    () => toFilterKey(typeFilter, competencyFilter, period),
    [typeFilter, competencyFilter, period],
  );

  const applyFilters = useMemo(
    () => (rows: FeedbackRow[]) => {
      let output = rows;
      if (typeFilter.length > 0) {
        output = output.filter((row) => typeFilter.includes(row.type));
      }
      if (competencyFilter.length > 0) {
        output = output.filter((row) => competencyFilter.includes(row.competency_id ?? '__none__'));
      }
      return filterByPeriod(output, period);
    },
    [typeFilter, competencyFilter, period],
  );

  const filteredReceived = useMemo(() => applyFilters(received), [applyFilters, received]);
  const filteredSent = useMemo(() => applyFilters(sent), [applyFilters, sent]);
  const filteredTeam = useMemo(() => applyFilters(team), [applyFilters, team]);

  const loadCompanyPage = useCallback(async (page: number, replace: boolean) => {
    if (!canReadCompany) return;
    const requestId = ++companyRequestRef.current;
    setCompanyLoading(true);
    setCompanyError(null);

    const result = await loadCompanyFeedbacksPage({
      page,
      pageSize: COMPANY_PAGE_SIZE,
      typeFilter,
      competencyFilter,
      period,
    });

    if (requestId !== companyRequestRef.current) return;
    setCompanyLoading(false);
    if ('error' in result) {
      setCompanyError(result.error);
      if (replace) {
        setCompanyRows([]);
        setCompanyPage(0);
        setCompanyHasMore(false);
      }
      setCompanyInitialized(true);
      companyLoadedFilterKeyRef.current = companyFilterKey;
      return;
    }

    setCompanyRows((prev) => (replace ? result.rows : appendUniqueFeedbacks(prev, result.rows)));
    setCompanyPage(result.page);
    setCompanyHasMore(result.hasMore);
    setCompanyInitialized(true);
    companyLoadedFilterKeyRef.current = companyFilterKey;
  }, [canReadCompany, typeFilter, competencyFilter, period, companyFilterKey]);

  useEffect(() => {
    if (!currentEmployeeId) return;
    for (const feedback of received) {
      if (feedback.read_at) continue;
      void markFeedbackAsRead(feedback.id);
    }
  }, [received, currentEmployeeId]);

  useEffect(() => {
    if (!canReadCompany || activeTab !== 'company') return;
    if (!companyInitialized || companyLoadedFilterKeyRef.current !== companyFilterKey) {
      void loadCompanyPage(0, true);
    }
  }, [canReadCompany, activeTab, companyInitialized, companyFilterKey, loadCompanyPage]);

  const handleLoadMoreCompany = useCallback(() => {
    if (!companyHasMore || companyLoading) return;
    void loadCompanyPage(companyPage + 1, false);
  }, [companyHasMore, companyLoading, companyPage, loadCompanyPage]);

  const handleRetryCompany = useCallback(() => {
    void loadCompanyPage(0, true);
  }, [loadCompanyPage]);

  return (
    <div>
      <PageHeader
        title="Feedbacks"
        description="Registre reconhecimentos, orientacoes e observacoes ao longo do ano."
        actions={(
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Enviar feedback
          </Button>
        )}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectFilter
          label="Tipos"
          options={(FEEDBACK_TYPES as unknown as FeedbackType[]).map((type) => ({
            value: type,
            label: FEEDBACK_TYPE_LABELS[type],
          }))}
          value={typeFilter}
          onChange={setTypeFilter}
          width="w-44"
        />
        <MultiSelectFilter
          label="Competencias"
          options={[
            { value: '__none__', label: 'Sem competencia' },
            ...competencies.map((competency) => ({ value: competency.id, label: competency.name })),
          ]}
          value={competencyFilter}
          onChange={setCompetencyFilter}
          width="w-52"
        />
        <Select
          value={period}
          onValueChange={(value) => setPeriod((value as PeriodFilter) ?? 'all')}
          items={[
            { value: 'all', label: 'Qualquer periodo' },
            { value: '30d', label: 'Ultimos 30 dias' },
            { value: '6m', label: 'Ultimos 6 meses' },
            { value: '1y', label: 'Ultimo ano' },
          ]}
        >
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer periodo</SelectItem>
            <SelectItem value="30d">Ultimos 30 dias</SelectItem>
            <SelectItem value="6m">Ultimos 6 meses</SelectItem>
            <SelectItem value="1y">Ultimo ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
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
            unreadSet={new Set(received.filter((row) => !row.read_at).map((row) => row.id))}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <FeedbackList
            items={filteredSent}
            emptyMessage="Voce ainda nao enviou feedbacks."
            perspective="sent"
            isAdmin={isAdmin}
          />
        </TabsContent>

        {hasTeam && (
          <TabsContent value="team" className="mt-6">
            <FeedbackList
              items={filteredTeam}
              emptyMessage="Nenhum feedback visivel da sua equipe."
              perspective="team"
              isAdmin={isAdmin}
            />
          </TabsContent>
        )}

        {canReadCompany && (
          <TabsContent value="company" className="mt-6">
            <CompanyFeedbackList
              items={companyRows}
              isAdmin={isAdmin}
              loading={companyLoading}
              hasMore={companyHasMore}
              error={companyError}
              onLoadMore={handleLoadMoreCompany}
              onRetry={handleRetryCompany}
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

function FeedbackList({
  items,
  emptyMessage,
  perspective,
  unreadSet,
  isAdmin,
}: {
  items: FeedbackRow[];
  emptyMessage: string;
  perspective: 'received' | 'sent' | 'team';
  unreadSet?: Set<string>;
  isAdmin: boolean;
}) {
  const [visible, setVisible] = useState(LOCAL_PAGE_SIZE);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const slice = items.slice(0, visible);
  const hasMore = items.length > visible;

  return (
    <>
      <ul className="space-y-3">
        {slice.map((feedback) => (
          <li key={feedback.id}>
            <FeedbackCard
              feedback={feedback}
              perspective={perspective}
              isAdmin={isAdmin}
              unread={unreadSet?.has(feedback.id)}
            />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisible((value) => value + LOCAL_PAGE_SIZE)}
          >
            Carregar mais ({items.length - visible} restantes)
          </Button>
        </div>
      )}
    </>
  );
}

function CompanyFeedbackList({
  items,
  isAdmin,
  loading,
  hasMore,
  error,
  onLoadMore,
  onRetry,
}: {
  items: FeedbackRow[];
  isAdmin: boolean;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Carregando feedbacks da empresa...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {error ?? 'Nenhum feedback visivel no escopo da empresa.'}
        </p>
        {error && (
          <Button className="mt-4" variant="outline" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Recarregar
          </Button>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((feedback) => (
          <li key={feedback.id}>
            <FeedbackCard
              feedback={feedback}
              perspective="team"
              isAdmin={isAdmin}
            />
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={loading}>
            {loading ? 'Carregando...' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </>
  );
}
