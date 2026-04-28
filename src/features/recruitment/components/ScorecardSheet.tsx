'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ScorecardInputSchema, type ScorecardInput,
  SCORECARD_DIMENSION_LABELS, SALARY_EXPECTATIONS, SALARY_EXPECTATION_LABELS,
  FEEDBACK_RECOMMENDATIONS, FEEDBACK_RECOMMENDATION_LABELS,
  type FeedbackRecommendation, type SalaryExpectation,
} from '../schema';
import { createScorecard, updateScorecard } from '../actions/scorecards';

export interface ScorecardContext {
  applicationId: string;
  candidateName: string;
  candidateEmail?: string | null;
  jobTitle: string;
  stageName: string;
}

export interface ScorecardEditInitial {
  id: string;
  rating_communication: number;
  rating_experience: number;
  rating_role_fit: number;
  rating_culture_fit: number;
  salary_expectation: SalaryExpectation | null;
  comment: string | null;
  recommendation: FeedbackRecommendation;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ScorecardContext | null;
  initial?: ScorecardEditInitial | null;
}

const DIMENSIONS: Array<keyof typeof SCORECARD_DIMENSION_LABELS> = [
  'rating_communication', 'rating_experience', 'rating_role_fit', 'rating_culture_fit',
];

function defaultsFor(initial: ScorecardEditInitial | null | undefined): ScorecardInput {
  return {
    rating_communication: initial?.rating_communication ?? 3,
    rating_experience: initial?.rating_experience ?? 3,
    rating_role_fit: initial?.rating_role_fit ?? 3,
    rating_culture_fit: initial?.rating_culture_fit ?? 3,
    salary_expectation: initial?.salary_expectation ?? null,
    comment: initial?.comment ?? '',
    recommendation: initial?.recommendation ?? 'advance',
  };
}

export function ScorecardSheet({ open, onOpenChange, context, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial;

  const form = useForm<ScorecardInput>({
    resolver: zodResolver(ScorecardInputSchema),
    defaultValues: defaultsFor(initial),
  });

  async function onSubmit(values: ScorecardInput) {
    if (!context) return;
    setLoading(true);
    try {
      const result = isEdit && initial
        ? await updateScorecard(initial.id, values)
        : await createScorecard(context.applicationId, values);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Scorecard atualizado' : 'Scorecard registrado');
      onOpenChange(false);
      form.reset(defaultsFor(null));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar scorecard' : 'Preencher scorecard'}</SheetTitle>
          {context && (
            <SheetDescription className="text-xs space-y-0.5 pt-1">
              <span className="block font-medium text-foreground">{context.candidateName}</span>
              {context.candidateEmail && (
                <span className="block text-muted-foreground">{context.candidateEmail}</span>
              )}
              <span className="flex items-center gap-2 pt-1">
                <span className="text-muted-foreground">{context.jobTitle}</span>
                <Badge variant="outline" className="text-[9px]">{context.stageName}</Badge>
              </span>
            </SheetDescription>
          )}
        </SheetHeader>
        <SheetBody>
          <Form {...form}>
            <form id="scorecard-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <section className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ratings (1–5)
              </p>
              <div className="grid grid-cols-1 gap-3">
                {DIMENSIONS.map((d) => (
                  <FormField key={d} control={form.control} name={d} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{SCORECARD_DIMENSION_LABELS[d]}</FormLabel>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const selected = field.value === n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => field.onChange(n)}
                              className={cn(
                                'h-8 w-8 rounded-md border text-sm font-medium transition-colors',
                                selected
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'bg-card text-muted-foreground hover:border-primary/50',
                              )}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </div>
            </section>

            <FormField control={form.control} name="salary_expectation" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Pretensão salarial (opcional)</FormLabel>
                <div className="flex gap-2">
                  {SALARY_EXPECTATIONS.map((s) => {
                    const selected = field.value === s;
                    return (
                      <Button
                        key={s}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => field.onChange(selected ? null : s)}
                      >
                        {SALARY_EXPECTATION_LABELS[s]}
                      </Button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="comment" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Comentário (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Contexto que não cabe nos ratings…"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="recommendation" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Recomendação *</FormLabel>
                <div className="flex gap-2">
                  {FEEDBACK_RECOMMENDATIONS.map((r) => (
                    <Button
                      key={r}
                      type="button"
                      variant={field.value === r ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => field.onChange(r)}
                    >
                      {FEEDBACK_RECOMMENDATION_LABELS[r]}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            </form>
          </Form>
        </SheetBody>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="scorecard-form" disabled={loading}>
            {loading ? 'Salvando…' : isEdit ? 'Salvar' : 'Registrar scorecard'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
