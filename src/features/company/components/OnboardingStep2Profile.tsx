'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { onInvalidToast } from '@/lib/form';
import { OnboardingStep2Schema, type OnboardingStep2Input } from '../schema';

interface Props {
  defaultValues?: Partial<OnboardingStep2Input>;
  onNext: (data: OnboardingStep2Input) => void;
  onBack: () => void;
}

export function OnboardingStep2Profile({ defaultValues, onNext, onBack }: Props) {
  const form = useForm<OnboardingStep2Input>({
    resolver: zodResolver(OnboardingStep2Schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: '',
      positionName: '',
      departmentName: '',
      hireDate: new Date().toISOString().split('T')[0],
      phone: '',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext, onInvalidToast(undefined, () => form.getValues()))} className="space-y-4">
        <FormField control={form.control} name="fullName" render={({ field }) => (
          <FormItem>
            <FormLabel>Seu nome completo *</FormLabel>
            <FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="positionName" render={({ field }) => (
          <FormItem>
            <FormLabel>Seu cargo *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Diretor de TI, Gerente de RH, CEO…" {...field} />
            </FormControl>
            <FormDescription>
              Você pode criar outros cargos depois em Configurações.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="departmentName" render={({ field }) => (
          <FormItem>
            <FormLabel>Departamento <span className="text-muted-foreground">(opcional)</span></FormLabel>
            <FormControl><Input placeholder="Ex: Recursos Humanos" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="hireDate" render={({ field }) => (
          <FormItem>
            <FormLabel>Data de admissão *</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone <span className="text-muted-foreground">(opcional)</span></FormLabel>
            <FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Voltar</Button>
          <Button type="submit" className="flex-1">Próximo</Button>
        </div>
      </form>
    </Form>
  );
}
