import { createServerSupabaseClient } from '@/lib/supabase/server';

export type FeedbackRow = {
  id: string;
  company_id: string;
  sender_id: string;
  recipient_id: string;
  type: string;
  competency_id: string | null;
  message: string;
  visibility: string;
  read_at: string | null;
  created_at: string;
  deleted_at: string | null;
  sender: { id: string; full_name: string; status: string; position: { id: string; name: string } | null } | null;
  recipient: { id: string; full_name: string; status: string; position: { id: string; name: string } | null } | null;
  competency: { id: string; name: string } | null;
};

export type FeedbackPeriodFilter = 'all' | '30d' | '6m' | '1y';

export type ListCompanyFeedbacksPageInput = {
  page?: number;
  pageSize?: number;
  typeFilter?: string[];
  competencyFilter?: string[];
  period?: FeedbackPeriodFilter;
  /** Busca por nome do remetente ou destinatário (colaborador da empresa). */
  nameQuery?: string | null;
};

export type CompanyFeedbacksPage = {
  rows: FeedbackRow[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const BASE_SELECT = `
  id, company_id, sender_id, recipient_id, type, competency_id, message, visibility,
  read_at, created_at, deleted_at,
  sender:employees!sender_id(id, full_name, status, position:positions(id, name)),
  recipient:employees!recipient_id(id, full_name, status, position:positions(id, name)),
  competency:competencies(id, name)
`;

const NO_COMPETENCY_FILTER_VALUE = '__none__';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const PERIOD_DAYS: Record<Exclude<FeedbackPeriodFilter, 'all'>, number> = {
  '30d': 30,
  '6m': 183,
  '1y': 365,
};

export async function listMyReceivedFeedbacks(employeeId: string): Promise<FeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('recipient_id', employeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as FeedbackRow[];
}

export async function listMySentFeedbacks(employeeId: string): Promise<FeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('sender_id', employeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as FeedbackRow[];
}

export async function listTeamFeedbacks(descendantIds: string[]): Promise<FeedbackRow[]> {
  if (descendantIds.length === 0) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .in('recipient_id', descendantIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as FeedbackRow[];
}

export async function listCompanyFeedbacksPage(
  companyId: string,
  input: ListCompanyFeedbacksPageInput = {},
): Promise<CompanyFeedbacksPage> {
  const supabase = await createServerSupabaseClient();
  const page = Math.max(0, Math.trunc(input.page ?? 0));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(input.pageSize ?? DEFAULT_PAGE_SIZE)));
  const typeFilter = Array.from(new Set(input.typeFilter ?? [])).filter(Boolean);
  const competencyFilter = Array.from(new Set(input.competencyFilter ?? [])).filter(Boolean);
  const period = input.period ?? 'all';

  let matchingEmployeeIds: string[] | null = null;
  const rawName = input.nameQuery?.trim();
  if (rawName) {
    const { data: emps } = await supabase
      .from('employees')
      .select('id')
      .eq('company_id', companyId)
      .ilike('full_name', `%${rawName}%`);
    matchingEmployeeIds = (emps ?? []).map((e: { id: string }) => e.id);
    if (matchingEmployeeIds.length === 0) {
      return {
        rows: [],
        page,
        pageSize,
        hasMore: false,
      };
    }
  }

  let query = supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (typeFilter.length > 0) {
    query = query.in('type', typeFilter);
  }

  if (competencyFilter.length > 0) {
    const competencyIds = competencyFilter.filter((value) => value !== NO_COMPETENCY_FILTER_VALUE);
    const includesNone = competencyFilter.includes(NO_COMPETENCY_FILTER_VALUE);
    if (includesNone && competencyIds.length > 0) {
      query = query.or(`competency_id.is.null,competency_id.in.(${competencyIds.join(',')})`);
    } else if (includesNone) {
      query = query.is('competency_id', null);
    } else {
      query = query.in('competency_id', competencyIds);
    }
  }

  if (period !== 'all') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[period]);
    query = query.gte('created_at', cutoff.toISOString());
  }

  if (matchingEmployeeIds && matchingEmployeeIds.length > 0) {
    const joined = matchingEmployeeIds.join(',');
    query = query.or(`sender_id.in.(${joined}),recipient_id.in.(${joined})`);
  }

  const from = page * pageSize;
  const to = from + pageSize;
  const { data } = await query.range(from, to);
  const rows = (data ?? []) as unknown as FeedbackRow[];

  return {
    rows: rows.slice(0, pageSize),
    page,
    pageSize,
    hasMore: rows.length > pageSize,
  };
}

export async function listFeedbacksForEmployee(employeeId: string): Promise<FeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('recipient_id', employeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as FeedbackRow[];
}

export async function listFeedbacksForReviewee(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
): Promise<FeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('recipient_id', employeeId)
    .is('deleted_at', null)
    .gte('created_at', `${periodStart}T00:00:00Z`)
    .lte('created_at', `${periodEnd}T23:59:59Z`)
    .order('created_at', { ascending: false })
    .limit(10);
  return (data ?? []) as unknown as FeedbackRow[];
}

export async function countUnreadFeedbacks(employeeId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from('feedbacks')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', employeeId)
    .is('deleted_at', null)
    .is('read_at', null);
  return count ?? 0;
}

export async function listDeletedFeedbacksForAudit(companyId: string): Promise<FeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('company_id', companyId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .limit(50);
  return (data ?? []) as unknown as FeedbackRow[];
}
