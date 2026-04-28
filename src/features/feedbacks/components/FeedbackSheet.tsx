'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  FeedbackInputSchema,
  FEEDBACK_TYPES, FEEDBACK_VISIBILITIES,
  FEEDBACK_TYPE_LABELS, FEEDBACK_TYPE_DESCRIPTIONS,
  FEEDBACK_VISIBILITY_LABELS, FEEDBACK_VISIBILITY_DESCRIPTIONS,
  type FeedbackInput, type FeedbackType,
} from '../schema';
import { sendFeedback } from '../actions';

interface EmployeeOption {
  id: string;
  full_name: string;
  email: string;
  status: string;
  position: { id: string; name: string } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeOption[];
  competencies: { id: string; name: string }[];
  currentEmployeeId: string | null;
  presetRecipientId?: string | null;
}

const EMPTY_DEFAULTS: FeedbackInput = {
  recipientId: '' as unknown as string,
  type: 'elogio',
  competencyId: null,
  message: '',
  visibility: 'privado',
};

export function FeedbackSheet({
  open, onOpenChange, employees, competencies, currentEmployeeId, presetRecipientId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');

  const form = useForm<FeedbackInput>({
    resolver: zodResolver(FeedbackInputSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const type = useWatch({ control: form.control, name: 'type' });
  const visibility = useWatch({ control: form.control, name: 'visibility' });
  const recipientId = useWatch({ control: form.control, name: 'recipientId' });
  const message = useWatch({ control: form.control, name: 'message' });

  useEffect(() => {
    if (!open) return;
    form.reset({
      ...EMPTY_DEFAULTS,
      recipientId: (presetRecipientId ?? '') as FeedbackInput['recipientId'],
    });
    // Reset do estado auxiliar de busca ao abrir o sheet — intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecipientSearch('');
  }, [open, presetRecipientId, form]);

  useEffect(() => {
    if (type === 'observacao_privada' && visibility !== 'privado') {
      form.setValue('visibility', 'privado');
    }
  }, [type, visibility, form]);

  const availableEmployees = useMemo(
    () => employees.filter((e) => e.id !== currentEmployeeId && e.status !== 'terminated'),
    [employees, currentEmployeeId],
  );

  const filteredRecipients = useMemo(() => {
    const lower = recipientSearch.trim().toLowerCase();
    if (!lower) return availableEmployees.slice(0, 20);
    return availableEmployees.filter((e) =>
      e.full_name.toLowerCase().includes(lower) || e.email.toLowerCase().includes(lower),
    ).slice(0, 20);
  }, [availableEmployees, recipientSearch]);

  async function onSubmit(values: FeedbackInput) {
    setLoading(true);
    const result = await sendFeedback(values);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Feedback enviado.');
    onOpenChange(false);
  }

  const selectedRecipient = availableEmployees.find((e) => e.id === recipientId);
  const isObservacao = type === 'observacao_privada';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">Novo feedback</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Feedback é imutável após envio. Não é possível editar ou deletar depois.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <Form {...form}>
            <form id="feedback-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="recipientId" render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Para quem *</FormLabel>
                  {selectedRecipient ? (
                    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{selectedRecipient.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedRecipient.position?.name ?? selectedRecipient.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => field.onChange('')}
                        className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                      >
                        Trocar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 min-w-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar colaborador…"
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {filteredRecipients.length > 0 && (
                        <ul className="max-h-48 overflow-y-auto rounded-md border">
                          {filteredRecipients.map((e) => (
                            <li key={e.id}>
                              <button
                                type="button"
                                onClick={() => field.onChange(e.id)}
                                className="w-full min-w-0 flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{e.full_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {e.position?.name ? `${e.position.name} · ` : ''}{e.email}
                                  </p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {filteredRecipients.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">Nenhum colaborador encontrado.</p>
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {(FEEDBACK_TYPES.filter((t) => t !== 'observacao_privada') as FeedbackType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(t)}
                        className={cn(
                          'text-left rounded-md border p-3 text-sm transition-colors',
                          field.value === t ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
                        )}
                      >
                        <p className="font-medium">{FEEDBACK_TYPE_LABELS[t]}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{FEEDBACK_TYPE_DESCRIPTIONS[t]}</p>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => field.onChange('observacao_privada')}
                      className={cn(
                        'col-span-2 text-left rounded-md border p-3 text-sm transition-colors',
                        field.value === 'observacao_privada'
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/40',
                      )}
                    >
                      <p className="font-medium">{FEEDBACK_TYPE_LABELS.observacao_privada}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {FEEDBACK_TYPE_DESCRIPTIONS.observacao_privada}
                      </p>
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="competencyId" render={({ field }) => {
                const items = [
                  { value: '__none__', label: 'Nenhuma' },
                  ...competencies.map((c) => ({ value: c.id, label: c.name })),
                ];
                return (
                  <FormItem>
                    <FormLabel>Competência</FormLabel>
                    <Select
                      value={field.value ?? '__none__'}
                      onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                      items={items}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((it) => (
                          <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }} />

              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Descreva o feedback. Seja específico sobre o comportamento ou resultado observado."
                      {...field}
                    />
                  </FormControl>
                  <p className="mt-1 text-xs text-muted-foreground text-right">
                    {message.length}/2000 <span className="text-muted-foreground/50">(limite 10.000)</span>
                  </p>
                  <FormMessage />
                </FormItem>
              )} />

              {!isObservacao && (
                <FormField control={form.control} name="visibility" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibilidade *</FormLabel>
                    <div className="space-y-2">
                      {FEEDBACK_VISIBILITIES.map((v) => (
                        <label
                          key={v}
                          className={cn(
                            'flex items-start gap-3 rounded-md border p-3 text-sm cursor-pointer transition-colors',
                            field.value === v ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
                          )}
                        >
                          <input
                            type="radio"
                            className="mt-0.5"
                            checked={field.value === v}
                            onChange={() => field.onChange(v)}
                          />
                          <div>
                            <p className="font-medium">{FEEDBACK_VISIBILITY_LABELS[v]}</p>
                            <p className="text-xs text-muted-foreground">
                              {FEEDBACK_VISIBILITY_DESCRIPTIONS[v]}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {isObservacao && (
                <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Observação privada: visível apenas para você. Útil para anotar observações pessoais.
                </div>
              )}
            </form>
          </Form>
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="feedback-form"
            disabled={loading || !recipientId || message.trim().length < 20}
          >
            {loading ? 'Enviando…' : 'Enviar feedback'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
