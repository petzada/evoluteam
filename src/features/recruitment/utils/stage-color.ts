import type { PipelineSnapshotStage } from '@/lib/supabase/types';

export function stageColumnBorder(kind: PipelineSnapshotStage['kind']): string {
  switch (kind) {
    case 'entry':          return 'border-t-blue-600';
    case 'intermediate':   return 'border-t-slate-300';
    case 'hired_terminal': return 'border-t-emerald-600';
  }
}

export function stageColumnTint(kind: PipelineSnapshotStage['kind']): string {
  return kind === 'hired_terminal' ? 'bg-emerald-50/40' : '';
}
