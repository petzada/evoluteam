'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ChevronDown, MoreVertical, Pencil, Trash2, Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import type { ScorecardRow } from '../queries/scorecards';
import type { ApplicationRow } from '../queries/applications';
import {
  APPLICATION_STATUS_LABELS, FEEDBACK_RECOMMENDATION_LABELS,
  SCORECARD_DIMENSION_LABELS, SALARY_EXPECTATION_LABELS,
  SCORECARD_EDIT_WINDOW_MINUTES, type FeedbackRecommendation,
} from '../schema';
import { ScorecardSheet, type ScorecardContext, type ScorecardEditInitial } from './ScorecardSheet';
import { deleteScorecard } from '../actions/scorecards';

interface Props {
  applications: ApplicationRow[];
  scorecards: ScorecardRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canSubmitScorecardForApp: (app: ApplicationRow) => boolean;
}

function recommendationColor(rec: FeedbackRecommendation): string {
  if (rec === 'advance') return 'bg-emerald-100 text-emerald-800';
  if (rec === 'doubt') return 'bg-amber-100 text-amber-900';
  return 'bg-rose-100 text-rose-900';
}

function statusVariant(status: ApplicationRow['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'hired') return 'default';
  if (status === 'rejected') return 'destructive';
  if (status === 'withdrawn') return 'secondary';
  if (status === 'in_progress') return 'default';
  return 'outline';
}

export function ScorecardsSection({
  applications, scorecards, currentEmployeeId, isAdmin, canSubmitScorecardForApp,
}: Props) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [context, setContext] = useState<ScorecardContext | null>(null);
  const [editInitial, setEditInitial] = useState<ScorecardEditInitial | null>(null);

  // Agrupar scorecards por application -> por stage
  const byAppStage = useMemo(() => {
    const out = new Map<string, Map<string, ScorecardRow[]>>();
    for (const sc of scorecards) {
      const stageMap = out.get(sc.application_id) ?? new Map<string, ScorecardRow[]>();
      const list = stageMap.get(sc.stage_id) ?? [];
      list.push(sc);
      stageMap.set(sc.stage_id, list);
      out.set(sc.application_id, stageMap);
    }
    return out;
  }, [scorecards]);

  function openNew(app: ApplicationRow) {
    setEditInitial(null);
    setContext({
      applicationId: app.id,
      candidateName: app.candidate?.name ?? 'Candidato',
      jobTitle: app.job_opening?.title ?? 'Vaga',
      stageName: app.current_stage?.name ?? '—',
    });
    setSheetOpen(true);
  }

  function openEdit(sc: ScorecardRow, app: ApplicationRow | null) {
    setEditInitial({
      id: sc.id,
      rating_communication: sc.rating_communication,
      rating_experience: sc.rating_experience,
      rating_role_fit: sc.rating_role_fit,
      rating_culture_fit: sc.rating_culture_fit,
      salary_expectation: sc.salary_expectation,
      comment: sc.comment,
      recommendation: sc.recommendation,
    });
    setContext({
      applicationId: sc.application_id,
      candidateName: app?.candidate?.name ?? 'Candidato',
      jobTitle: app?.job_opening?.title ?? 'Vaga',
      stageName: sc.stage?.name ?? app?.current_stage?.name ?? '—',
    });
    setSheetOpen(true);
  }

  async function onDelete(id: string) {
    const result = await deleteScorecard(id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    toast.success('Scorecard removido');
    router.refresh();
  }

  if (applications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Candidato ainda não foi vinculado a nenhuma vaga.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {applications.map((app) => {
          const stageMap = byAppStage.get(app.id) ?? new Map<string, ScorecardRow[]>();
          return (
            <ScorecardAppGroup
              key={app.id}
              app={app}
              stageMap={stageMap}
              defaultOpen={app.status === 'in_progress'}
              currentEmployeeId={currentEmployeeId}
              isAdmin={isAdmin}
              canSubmit={canSubmitScorecardForApp(app)}
              onNewScorecard={() => openNew(app)}
              onEditScorecard={(sc) => openEdit(sc, app)}
              onDeleteScorecard={onDelete}
            />
          );
        })}
      </div>

      <ScorecardSheet
        open={sheetOpen}
        onOpenChange={(v) => { if (!v) { setContext(null); setEditInitial(null); } setSheetOpen(v); }}
        context={context}
        initial={editInitial}
      />
    </>
  );
}

interface AppGroupProps {
  app: ApplicationRow;
  stageMap: Map<string, ScorecardRow[]>;
  defaultOpen: boolean;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canSubmit: boolean;
  onNewScorecard: () => void;
  onEditScorecard: (sc: ScorecardRow) => void;
  onDeleteScorecard: (id: string) => void;
}

function ScorecardAppGroup({
  app, stageMap, defaultOpen, currentEmployeeId, isAdmin, canSubmit,
  onNewScorecard, onEditScorecard, onDeleteScorecard,
}: AppGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const totalScorecards = Array.from(stageMap.values()).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 py-1.5 hover:text-foreground transition-colors"
      >
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !open && '-rotate-90')} />
        <span className="text-sm font-medium flex-1 text-left">{app.job_opening?.title ?? 'Vaga'}</span>
        <Badge variant={statusVariant(app.status)} className="text-[10px]">
          {APPLICATION_STATUS_LABELS[app.status]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {totalScorecards} {totalScorecards === 1 ? 'scorecard' : 'scorecards'}
        </span>
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          {canSubmit && (
            <button
              type="button"
              onClick={onNewScorecard}
              className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
            >
              <Star className="h-3.5 w-3.5" />
              Preencher scorecard
            </button>
          )}
          {totalScorecards === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhum scorecard registrado ainda.</p>
          ) : (
            Array.from(stageMap.entries()).map(([stageId, scs]) => (
              <StageBlock
                key={stageId}
                scorecards={scs}
                currentEmployeeId={currentEmployeeId}
                isAdmin={isAdmin}
                onEdit={onEditScorecard}
                onDelete={onDeleteScorecard}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface StageBlockProps {
  scorecards: ScorecardRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  onEdit: (sc: ScorecardRow) => void;
  onDelete: (id: string) => void;
}

function StageBlock({ scorecards, currentEmployeeId, isAdmin, onEdit, onDelete }: StageBlockProps) {
  if (scorecards.length === 1) {
    return <SingleScorecardCard sc={scorecards[0]} currentEmployeeId={currentEmployeeId} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} />;
  }
  return <ComparisonTable scorecards={scorecards} currentEmployeeId={currentEmployeeId} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} />;
}

function renderStars(value: number, max = 5) {
  return (
    <span className="inline-flex">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < value ? 'fill-primary text-primary' : 'text-muted-foreground/30',
          )}
        />
      ))}
    </span>
  );
}

function subscribeTick(callback: () => void) {
  const id = setInterval(callback, 30_000);
  return () => clearInterval(id);
}

function useNowClock() {
  return useSyncExternalStore(subscribeTick, () => Date.now(), () => 0);
}

interface SingleProps {
  sc: ScorecardRow;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  onEdit: (sc: ScorecardRow) => void;
  onDelete: (id: string) => void;
}

function SingleScorecardCard({ sc, currentEmployeeId, isAdmin, onEdit, onDelete }: SingleProps) {
  const isAuthor = sc.author_id === currentEmployeeId;
  const now = useNowClock();
  const createdAt = new Date(sc.created_at).getTime();
  const canEditByWindow = isAuthor && now > 0 && (now - createdAt) < SCORECARD_EDIT_WINDOW_MINUTES * 60 * 1000;
  const canDelete = canEditByWindow || isAdmin;
  const showKebab = canEditByWindow || canDelete;
  return (
    <div className="rounded-md border p-4 text-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium">{sc.author?.full_name ?? '—'}</span>
          {sc.stage && <Badge variant="outline" className="text-[9px] py-0">{sc.stage.name}</Badge>}
          <span className="text-xs text-muted-foreground">· {formatDate(sc.created_at)}</span>
        </div>
        {showKebab && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded p-0.5 hover:bg-muted" aria-label="Ações">
              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEditByWindow && (
                <DropdownMenuItem onClick={() => onEdit(sc)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem onClick={() => onDelete(sc.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Remover
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <RatingRow label="Comunicação" value={sc.rating_communication} />
        <RatingRow label="Experiência" value={sc.rating_experience} />
        <RatingRow label="Aderência" value={sc.rating_role_fit} />
        <RatingRow label="Fit cultural" value={sc.rating_culture_fit} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {sc.salary_expectation && (
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium',
            sc.salary_expectation === 'compatible' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900',
          )}>
            Salário: {SALARY_EXPECTATION_LABELS[sc.salary_expectation]}
          </span>
        )}
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', recommendationColor(sc.recommendation))}>
          {FEEDBACK_RECOMMENDATION_LABELS[sc.recommendation]}
        </span>
      </div>
      {sc.comment && (
        <p className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground border-l-2 border-muted pl-2">
          {sc.comment}
        </p>
      )}
    </div>
  );
}

function RatingRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {renderStars(value)}
    </div>
  );
}

function ComparisonTable({ scorecards, currentEmployeeId, isAdmin, onEdit, onDelete }: {
  scorecards: ScorecardRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  onEdit: (sc: ScorecardRow) => void;
  onDelete: (id: string) => void;
}) {
  const now = useNowClock();
  const first = scorecards[0];
  const stageName = first?.stage?.name ?? '—';

  // Conta divergências
  const dims = ['rating_communication', 'rating_experience', 'rating_role_fit', 'rating_culture_fit'] as const;
  let divergent = 0;
  for (const d of dims) {
    const values = scorecards.map((s) => s[d]);
    const min = Math.min(...values), max = Math.max(...values);
    if (max - min >= 1) divergent += 1;
  }
  const salaryValues = new Set(scorecards.map((s) => s.salary_expectation).filter((v): v is NonNullable<typeof v> => v !== null));
  if (salaryValues.size > 1) divergent += 1;
  const recValues = new Set(scorecards.map((s) => s.recommendation));
  if (recValues.size > 1) divergent += 1;
  const totalRows = dims.length + 2;

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{stageName}</span>
          <Badge variant="outline" className="text-[10px]">{scorecards.length} avaliadores</Badge>
        </div>
        {divergent > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 font-medium">
            ⚠ divergência em {divergent} de {totalRows}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-2 pr-2 font-medium">Dimensão</th>
              {scorecards.map((sc) => (
                <th key={sc.id} className="pb-2 pl-3 font-medium">
                  <div className="flex items-center gap-1">
                    <span>{sc.author?.full_name ?? '—'}</span>
                    {renderKebab(sc, currentEmployeeId, isAdmin, now, onEdit, onDelete)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dims.map((d) => {
              const values = scorecards.map((s) => s[d]);
              const min = Math.min(...values), max = Math.max(...values);
              const diverge = max - min >= 1;
              return (
                <tr key={d} className={cn(diverge && 'bg-amber-50/50')}>
                  <td className="py-1 pr-2 text-muted-foreground">{SCORECARD_DIMENSION_LABELS[d]}</td>
                  {scorecards.map((sc) => (
                    <td key={sc.id} className="py-1 pl-3">{renderStars(sc[d])}</td>
                  ))}
                </tr>
              );
            })}
            <tr className={cn(salaryValues.size > 1 && 'bg-amber-50/50')}>
              <td className="py-1 pr-2 text-muted-foreground">Salário</td>
              {scorecards.map((sc) => (
                <td key={sc.id} className="py-1 pl-3">
                  {sc.salary_expectation ? SALARY_EXPECTATION_LABELS[sc.salary_expectation] : '—'}
                </td>
              ))}
            </tr>
            <tr className={cn(recValues.size > 1 && 'bg-amber-50/50')}>
              <td className="py-1 pr-2 text-muted-foreground">Recomendação</td>
              {scorecards.map((sc) => (
                <td key={sc.id} className="py-1 pl-3">
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', recommendationColor(sc.recommendation))}>
                    {FEEDBACK_RECOMMENDATION_LABELS[sc.recommendation]}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {scorecards.filter((s) => s.comment).length > 0 && (
        <div className="mt-3 space-y-2">
          {scorecards.filter((s) => s.comment).map((sc) => (
            <div key={sc.id} className="rounded bg-muted/40 border-l-2 border-muted px-2 py-1.5">
              <p className="text-[10.5px] font-medium">{sc.author?.full_name ?? '—'}</p>
              <p className="text-xs whitespace-pre-wrap text-muted-foreground">{sc.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderKebab(
  sc: ScorecardRow,
  currentEmployeeId: string | null,
  isAdmin: boolean,
  now: number,
  onEdit: (sc: ScorecardRow) => void,
  onDelete: (id: string) => void,
) {
  const isAuthor = sc.author_id === currentEmployeeId;
  const createdAt = new Date(sc.created_at).getTime();
  const canEditByWindow = isAuthor && now > 0 && (now - createdAt) < SCORECARD_EDIT_WINDOW_MINUTES * 60 * 1000;
  const canDelete = canEditByWindow || isAdmin;
  if (!canEditByWindow && !canDelete) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded p-0.5 hover:bg-muted" aria-label="Ações">
        <MoreVertical className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEditByWindow && (
          <DropdownMenuItem onClick={() => onEdit(sc)}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onClick={() => onDelete(sc.id)} className="text-destructive">
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Remover
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
