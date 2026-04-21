'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskInputSchema, type TaskInput } from '../schema';
import { createTask, updateTask } from '../actions/tasks';

interface EmployeeOption { id: string; full_name: string }

export interface TaskContext {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
}

export interface TaskEditInitial {
  id: string;
  title: string;
  due_date: string | null;
  responsible_id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: TaskContext | null;
  initial?: TaskEditInitial | null;
  defaultResponsibleId: string | null;
  responsibleOptions: EmployeeOption[];
}

function defaultsFor(
  initial: TaskEditInitial | null | undefined,
  fallbackResponsibleId: string | null,
): TaskInput {
  return {
    title: initial?.title ?? '',
    due_date: initial?.due_date ?? '',
    responsible_id: initial?.responsible_id ?? fallbackResponsibleId ?? '',
  };
}

export function TaskDialog({
  open, onOpenChange, context, initial, defaultResponsibleId, responsibleOptions,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial;

  const form = useForm<TaskInput>({
    resolver: zodResolver(TaskInputSchema),
    defaultValues: defaultsFor(initial, defaultResponsibleId),
  });

  async function onSubmit(values: TaskInput) {
    if (!context) return;
    setLoading(true);
    try {
      const result = isEdit && initial
        ? await updateTask(initial.id, values)
        : await createTask(context.applicationId, values);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Tarefa atualizada' : 'Tarefa criada');
      onOpenChange(false);
      form.reset(defaultsFor(null, defaultResponsibleId));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
          {context && (
            <DialogDescription className="text-xs">
              {context.candidateName} · {context.jobTitle}
            </DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-2">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">O que precisa ser feito? *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Agendar entrevista com gestor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="due_date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Prazo (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="responsible_id" render={({ field }) => {
                const items = responsibleOptions.map((o) => ({ value: o.id, label: o.full_name }));
                return (
                  <FormItem>
                    <FormLabel className="text-xs">Responsável *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} items={items}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar tarefa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
