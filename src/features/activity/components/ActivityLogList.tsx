'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateTime } from '@/lib/date';
import { ACTIVITY_LABELS, humanizeActivityMetadata } from '@/lib/activity';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/EmptyState';
import { PaginationControls } from '@/components/PaginationControls';
import { ScrollText } from 'lucide-react';
import type { ActivityLogEntry } from '../queries';

interface Props {
  logs: ActivityLogEntry[];
  total: number;
  pageSize: number;
  page: number;
}

export function ActivityLogList({ logs, total, pageSize, page }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (next <= 1) params.delete('page'); else params.set('page', String(next));
    const qs = params.toString();
    router.push(`/configuracoes/auditoria${qs ? `?${qs}` : ''}`);
  }

  if (logs.length === 0 && page === 1) {
    return (
      <EmptyState
        icon={ScrollText}
        title="Nenhum evento registrado"
        description="As ações da equipe aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data/hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const label = ACTIVITY_LABELS[log.action] ?? log.action;
              const entries = humanizeActivityMetadata(log.action, log.metadata);
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    <p className="font-medium">{label}</p>
                    {entries.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entries.map((e, i) => (
                          <span key={i}>
                            {i > 0 && <span className="text-muted-foreground/40"> · </span>}
                            {e.label}: <b className="font-medium text-foreground/80">{e.value}</b>
                          </span>
                        ))}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{log.actorName}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onChange={goToPage}
      />
    </div>
  );
}
