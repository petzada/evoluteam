'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ScorecardRow } from '../queries/scorecards';
import type { ApplicationRow } from '../queries/applications';
import { APPLICATION_STATUS_LABELS } from '../schema';
import { ScorecardSheet, type ScorecardContext, type ScorecardEditInitial } from './ScorecardSheet';
import { deleteScorecard } from '../actions/scorecards';
import { StageBlock } from './cards/ScorecardCards';

interface Props {
  applications: ApplicationRow[];
  scorecards: ScorecardRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canSubmitScorecardForApp: (app: ApplicationRow) => boolean;
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
      <div className="space-y-3">
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
    <div className="rounded-md border bg-card p-4 shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 hover:text-foreground transition-colors"
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
        <div className="mt-3 space-y-3">
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
            <ul className="divide-y">
              {Array.from(stageMap.entries()).map(([stageId, scs]) => (
                <li key={stageId} className="pt-3 first:pt-0">
                  <StageBlock
                    scorecards={scs}
                    currentEmployeeId={currentEmployeeId}
                    isAdmin={isAdmin}
                    onEdit={onEditScorecard}
                    onDelete={onDeleteScorecard}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
