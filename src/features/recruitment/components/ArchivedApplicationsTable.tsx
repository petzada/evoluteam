'use client';

import Link from 'next/link';
import { Archive } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/date';
import { statusClass } from '@/lib/status-colors';
import { recruitmentApplicationStatusToken } from '@/lib/status-mappers';
import { cn } from '@/lib/utils';
import type { ApplicationRow } from '../queries/applications';
import {
  APPLICATION_STATUS_LABELS, REJECTION_REASON_LABELS, WITHDRAWAL_REASON_LABELS,
  CANDIDATE_SOURCE_LABELS, type CandidateSource,
  type RejectionReason, type WithdrawalReason,
} from '../schema';

interface Props {
  applications: ApplicationRow[];
}

export function ArchivedApplicationsTable({ applications }: Props) {
  if (applications.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title="Nenhum candidato finalizado"
        description="Candidatos desistentes, reprovados, contratados ou congelados aparecem aqui."
      />
    );
  }
  return (
    <div className="rounded-md border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidato</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Saiu em</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => {
            const source = app.candidate?.source as CandidateSource | undefined;
            const sourceLabel = source === 'outro' && app.candidate?.source_other
              ? app.candidate.source_other
              : source ? CANDIDATE_SOURCE_LABELS[source] : '—';
            const reasonLabel =
              app.status === 'rejected' && app.rejection_reason
                ? REJECTION_REASON_LABELS[app.rejection_reason as RejectionReason]
                : app.status === 'withdrawn' && app.withdrawal_reason
                  ? WITHDRAWAL_REASON_LABELS[app.withdrawal_reason as WithdrawalReason]
                  : app.status === 'frozen' && app.frozen_reason_notes
                    ? app.frozen_reason_notes
                    : app.reason_other ?? '—';
            return (
              <TableRow key={app.id}>
                <TableCell>
                  <Link
                    href={`/recrutamento/candidatos/${app.candidate_id}`}
                    className="font-medium hover:underline"
                  >
                    {app.candidate?.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{sourceLabel}</Badge>
                </TableCell>
                <TableCell className="text-sm">{app.current_stage?.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge className={cn(statusClass(recruitmentApplicationStatusToken(app.status)))}>
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{reasonLabel}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(app.updated_at)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
