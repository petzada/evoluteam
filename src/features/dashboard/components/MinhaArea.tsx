import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SetAppTopBar } from '@/features/shell/AppTopBarContext';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Target, MessageSquare, Sparkles, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/date';
import { FEEDBACK_TYPE_LABELS } from '@/features/feedbacks/schema';
import { PDI_ACTION_STATUS_LABELS, type PdiActionStatus } from '@/features/pdi/schema';
import type {
  MyPendingAssignment,
  MyOpenPdiAction,
  MyRecentFeedback,
  MyCurrentPdi,
} from '../my-area-queries';

interface Props {
  firstName: string;
  assignments: MyPendingAssignment[];
  pdiActions: MyOpenPdiAction[];
  feedbacks: MyRecentFeedback[];
  currentPdi: MyCurrentPdi | null;
}

export function MinhaArea({ firstName, assignments, pdiActions, feedbacks, currentPdi }: Props) {
  const overdueCount = pdiActions.filter((a) => a.isOverdue).length;

  return (
    <div>
      <SetAppTopBar title={`Olá, ${firstName}`} />

      <div className="space-y-8">
        <section aria-labelledby="pendentes-heading" className="space-y-3">
          <h2
            id="pendentes-heading"
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
          >
            Pendências
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avaliações a responder
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Você não tem avaliações pendentes.</p>
                ) : (
                  <ul className="space-y-2">
                    {assignments.slice(0, 4).map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <Link
                            href={`/avaliacoes/${a.cycleId}/responder/${a.id}`}
                            className="font-medium hover:text-primary hover:underline truncate block"
                          >
                            {a.cycleName}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            Avaliando: {a.revieweeName} · prazo {formatDate(a.responseEnd)}
                          </p>
                        </div>
                      </li>
                    ))}
                    {assignments.length > 4 && (
                      <li className="text-xs text-muted-foreground pt-1">
                        +{assignments.length - 4} outras
                      </li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ações do PDI em aberto
                </CardTitle>
                {overdueCount > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Target className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                {pdiActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma ação aberta sob sua responsabilidade.</p>
                ) : (
                  <ul className="space-y-2">
                    {pdiActions.slice(0, 4).map((a) => (
                      <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <Link
                            href={`/pdi/${a.planId}`}
                            className="font-medium hover:text-primary hover:underline truncate block"
                          >
                            {a.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {a.planEmployeeName === '—' ? 'PDI' : `PDI de ${a.planEmployeeName}`}
                            {' · '}
                            prazo {formatDate(a.dueDate)}
                            {a.isOverdue && (
                              <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">atrasada</span>
                            )}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {PDI_ACTION_STATUS_LABELS[a.status as PdiActionStatus] ?? a.status}
                        </Badge>
                      </li>
                    ))}
                    {pdiActions.length > 4 && (
                      <li className="text-xs text-muted-foreground pt-1">
                        +{pdiActions.length - 4} outras
                      </li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-labelledby="contexto-heading" className="space-y-3">
          <h2
            id="contexto-heading"
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
          >
            Meu contexto
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Meu PDI atual
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {!currentPdi ? (
                  <p className="text-sm text-muted-foreground">Você ainda não tem um PDI em andamento.</p>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={`/pdi/${currentPdi.id}`}
                      className="font-medium hover:text-primary hover:underline block"
                    >
                      {currentPdi.objective}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {currentPdi.competencyName ? `${currentPdi.competencyName} · ` : ''}
                      prazo {formatDate(currentPdi.dueDate)}
                    </p>
                    {currentPdi.totalActions > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {currentPdi.doneActions} de {currentPdi.totalActions} ações concluídas
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Feedbacks recentes
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {feedbacks.length === 0 ? (
                  <EmptyState
                    icon={Sparkles}
                    title="Nenhum feedback recente"
                    description="Feedbacks que você receber aparecerão aqui."
                  />
                ) : (
                  <ul className="space-y-3">
                    {feedbacks.slice(0, 3).map((f) => (
                      <li key={f.id} className="text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {FEEDBACK_TYPE_LABELS[f.type as keyof typeof FEEDBACK_TYPE_LABELS] ?? f.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(f.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-foreground/80 line-clamp-2">
                          {f.excerpt}
                        </p>
                        {(f.authorName || f.competencyName) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {f.authorName && `Por ${f.authorName}`}
                            {f.authorName && f.competencyName && ' · '}
                            {f.competencyName}
                          </p>
                        )}
                      </li>
                    ))}
                    {feedbacks.length > 3 && (
                      <li className="text-xs text-muted-foreground pt-1">
                        <Link href="/feedbacks" className="hover:text-foreground">
                          Ver todos →
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="flex gap-2 pt-2">
          <Link href="/feedbacks">
            <Button variant="outline" size="sm">Feedbacks</Button>
          </Link>
          <Link href="/pdi">
            <Button variant="outline" size="sm">PDIs</Button>
          </Link>
          <Link href="/avaliacoes">
            <Button variant="outline" size="sm">Avaliações</Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
