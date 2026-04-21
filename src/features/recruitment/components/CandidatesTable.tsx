'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/date';
import { CandidateSheet } from './CandidateSheet';
import type { CandidateRow } from '../queries/candidates';
import { CANDIDATE_SOURCE_LABELS } from '../schema';

interface Props {
  candidates: CandidateRow[];
  canCreate: boolean;
}

export function CandidatesTable({ candidates, canCreate }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Candidatos"
        description="Banco global de candidatos da empresa."
        actions={canCreate && (
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo candidato
          </Button>
        )}
      />

      {candidates.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Nenhum candidato cadastrado"
          description="Cadastre o primeiro candidato no banco global."
          action={canCreate && (
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo candidato
            </Button>
          )}
        />
      ) : (
        <div className="rounded-md border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Vagas ativas</TableHead>
                <TableHead>Cadastrado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/40">
                  <TableCell>
                    <Link
                      href={`/recrutamento/candidatos/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{c.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {c.source === 'outro' && c.source_other
                        ? c.source_other
                        : CANDIDATE_SOURCE_LABELS[c.source]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.active_applications_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {canCreate && (
        <CandidateSheet open={sheetOpen} onOpenChange={setSheetOpen} initial={null} />
      )}
    </div>
  );
}
