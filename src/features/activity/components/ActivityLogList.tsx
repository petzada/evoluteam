import { formatDateTime } from '@/lib/date';
import { ACTIVITY_LABELS } from '@/lib/activity';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/EmptyState';
import { ScrollText } from 'lucide-react';

type LogEntry = {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
  created_at: string;
  actor_user_id: string | null;
  actorName: string;
};

interface Props {
  logs: LogEntry[];
}

export function ActivityLogList({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="Nenhum evento registrado"
        description="As ações da equipe aparecerão aqui."
      />
    );
  }

  return (
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
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <p className="font-medium">{ACTIVITY_LABELS[log.action] ?? log.action}</p>
                {typeof log.metadata === 'object' && log.metadata !== null && !Array.isArray(log.metadata) && Object.keys(log.metadata).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Object.entries(log.metadata as Record<string, string>)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </p>
                )}
              </TableCell>
              <TableCell>{log.actorName}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatDateTime(log.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
