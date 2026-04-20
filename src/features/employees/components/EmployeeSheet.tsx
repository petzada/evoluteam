'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeSchema, type EmployeeInput } from '../schema';
import { createEmployee } from '../actions';

interface Position { id: string; name: string }
interface Department { id: string; name: string }
interface ManagerOption { id: string; full_name: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positions: Position[];
  departments: Department[];
  managers: ManagerOption[];
  mode?: 'create';
}

const ROLE_LABELS = { admin_rh: 'Administrador RH', director: 'Diretor', user: 'Colaborador' };

export function EmployeeSheet({ open, onOpenChange, positions, departments, managers, mode = 'create' }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<EmployeeInput>({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: {
      fullName: '',
      email: '',
      positionId: '',
      role: 'user',
      departmentId: null,
      managerId: null,
      hireDate: new Date().toISOString().split('T')[0],
      phone: '',
      sendInvite: true,
    },
  });

  const sendInvite = form.watch('sendInvite');

  useEffect(() => {
    if (open) form.reset({
      fullName: '', email: '', positionId: '', role: 'user',
      departmentId: null, managerId: null,
      hireDate: new Date().toISOString().split('T')[0],
      phone: '', sendInvite: true,
    });
  }, [open, form]);

  async function onSubmit(values: EmployeeInput) {
    setLoading(true);
    const result = await createEmployee(values);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(
      values.sendInvite
        ? 'Colaborador cadastrado e convite enviado!'
        : 'Colaborador cadastrado sem convite.',
    );
    onOpenChange(false);
    setLoading(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo colaborador</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo *</FormLabel>
                <FormControl><Input placeholder="Ana Souza" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail *</FormLabel>
                <FormControl><Input type="email" placeholder="ana@empresa.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="positionId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.entries(ROLE_LABELS) as [EmployeeInput['role'], string][]).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="departmentId" render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                  value={field.value ?? '__none__'}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="managerId" render={({ field }) => (
              <FormItem>
                <FormLabel>Gestor direto</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                  value={field.value ?? '__none__'}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="hireDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de admissão *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input placeholder="(11) 99999-9999" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="sendInvite" render={({ field }) => (
              <FormItem className="flex items-center gap-3 rounded-lg border p-3">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value ?? true}
                    onChange={field.onChange}
                    className="h-4 w-4 accent-primary"
                  />
                </FormControl>
                <div>
                  <FormLabel className="cursor-pointer">Enviar convite por e-mail agora</FormLabel>
                  <p className="text-xs text-muted-foreground">Link expira em 7 dias</p>
                </div>
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando…' : sendInvite ? 'Cadastrar e enviar convite' : 'Cadastrar sem enviar'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
