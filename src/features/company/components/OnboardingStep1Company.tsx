'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnboardingStep1Schema, type OnboardingStep1Input, SEGMENTS, TEAM_SIZES } from '../schema';

interface Props {
  defaultValues?: Partial<OnboardingStep1Input>;
  onNext: (data: OnboardingStep1Input) => void;
}

export function OnboardingStep1Company({ defaultValues, onNext }: Props) {
  const form = useForm<OnboardingStep1Input>({
    resolver: zodResolver(OnboardingStep1Schema),
    defaultValues: { name: '', cnpj: '', segment: undefined, teamSize: undefined, ...defaultValues },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da empresa *</FormLabel>
            <FormControl><Input placeholder="Ex: Acme Ltda" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="cnpj" render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ</FormLabel>
            <FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="segment" render={({ field }) => (
          <FormItem>
            <FormLabel>Segmento *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {SEGMENTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="teamSize" render={({ field }) => (
          <FormItem>
            <FormLabel>Tamanho do time *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {TEAM_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>{s} pessoas</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full">Próximo</Button>
      </form>
    </Form>
  );
}
