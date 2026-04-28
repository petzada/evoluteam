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
import {
  CandidateFeedbackInputSchema, type CandidateFeedbackInput,
  FEEDBACK_RECOMMENDATIONS, FEEDBACK_RECOMMENDATION_LABELS,
  type FeedbackRecommendation,
} from '../schema';
import { createFeedback, updateFeedback } from '../actions/feedbacks';

export interface FeedbackContext {
  applicationId: string;
  candidateName: string;
  candidateEmail?: string | null;
  jobTitle: string;
  stageName: string;
}

export interface FeedbackEditInitial {
  id: string;
  content: string;
  recommendation: FeedbackRecommendation | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: FeedbackContext | null;
  initial?: FeedbackEditInitial | null;
}

export function FeedbackSheet({ open, onOpenChange, context, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial;

  const form = useForm<CandidateFeedbackInput>({
    resolver: zodResolver(CandidateFeedbackInputSchema),
    defaultValues: {
      content: initial?.content ?? '',
      recommendation: initial?.recommendation ?? null,
    },
  });

  async function onSubmit(values: CandidateFeedbackInput) {
    if (!context) return;
    setLoading(true);
    try {
      const result = isEdit && initial
        ? await updateFeedback(initial.id, values)
        : await createFeedback(context.applicationId, values);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Feedback atualizado' : 'Feedback registrado');
      onOpenChange(false);
      form.reset({ content: '', recommendation: null });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar feedback' : 'Dar feedback sobre candidato'}</SheetTitle>
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
            <form id="recruitment-feedback-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Conteúdo *</FormLabel>
                <FormControl>
                  <Textarea
                    rows={8}
                    placeholder="Suas impressões sobre o candidato, pontos fortes, preocupações…"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">10–3.000 caracteres. Texto plano; quebras de linha são preservadas.</p>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="recommendation" render={({ field }) => (
              <FormItem>
                <FormLabel>Recomendação (opcional)</FormLabel>
                <div className="flex gap-2">
                  {FEEDBACK_RECOMMENDATIONS.map((r) => {
                    const selected = field.value === r;
                    return (
                      <Button
                        key={r}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => field.onChange(selected ? null : r)}
                      >
                        {FEEDBACK_RECOMMENDATION_LABELS[r]}
                      </Button>
                    );
                  })}
                </div>
                {field.value && (
                  <p className="text-xs text-muted-foreground">
                    Clique novamente para remover.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )} />
            </form>
          </Form>
        </SheetBody>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="recruitment-feedback-form" disabled={loading}>
            {loading ? 'Salvando…' : isEdit ? 'Salvar' : 'Registrar feedback'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
