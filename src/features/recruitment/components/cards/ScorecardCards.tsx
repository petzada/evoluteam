'use client';

import { useEffect, useState } from 'react';
import { MoreVertical, Pencil, Trash2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import type { ScorecardRow } from '../../queries/scorecards';
import {
  FEEDBACK_RECOMMENDATION_LABELS,
  SCORECARD_DIMENSION_LABELS,
  SALARY_EXPECTATION_LABELS,
  SCORECARD_EDIT_WINDOW_MINUTES,
  type FeedbackRecommendation,
} from '../../schema';

export function recommendationColor(rec: FeedbackRecommendation): string {
  if (rec === 'advance') return 'bg-emerald-100 text-emerald-800';
  if (rec === 'doubt') return 'bg-amber-100 text-amber-900';
  return 'bg-rose-100 text-rose-900';
}

function useNowClock() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const t0 = setTimeout(update, 0);
    const id = setInterval(update, 30_000);
    return () => {
      clearTimeout(t0);
      clearInterval(id);
    };
  }, []);
  return now;
}

export function renderStars(value: number, max = 5) {
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

interface SingleProps {
  sc: ScorecardRow;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  onEdit: (sc: ScorecardRow) => void;
  onDelete: (id: string) => void;
}

export function SingleScorecardCard({ sc, currentEmployeeId, isAdmin, onEdit, onDelete }: SingleProps) {
  const isAuthor = sc.author_id === currentEmployeeId;
  const now = useNowClock();
  const createdAt = new Date(sc.created_at).getTime();
  const canEditByWindow = isAuthor && now > 0 && (now - createdAt) < SCORECARD_EDIT_WINDOW_MINUTES * 60 * 1000;
  const canDelete = canEditByWindow || isAdmin;
  const showKebab = canEditByWindow || canDelete;
  return (
    <div className="text-sm">
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

interface ComparisonProps {
  scorecards: ScorecardRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  onEdit: (sc: ScorecardRow) => void;
  onDelete: (id: string) => void;
}

export function ComparisonTable({ scorecards, currentEmployeeId, isAdmin, onEdit, onDelete }: ComparisonProps) {
  const now = useNowClock();
  const first = scorecards[0];
  const stageName = first?.stage?.name ?? '—';

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
    <div>
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

/** Bloco que decide entre single card ou comparison table baseado na qtd. */
interface StageBlockProps {
  scorecards: ScorecardRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  onEdit: (sc: ScorecardRow) => void;
  onDelete: (id: string) => void;
}

export function StageBlock({ scorecards, currentEmployeeId, isAdmin, onEdit, onDelete }: StageBlockProps) {
  if (scorecards.length === 1) {
    return <SingleScorecardCard sc={scorecards[0]} currentEmployeeId={currentEmployeeId} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} />;
  }
  return <ComparisonTable scorecards={scorecards} currentEmployeeId={currentEmployeeId} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} />;
}
