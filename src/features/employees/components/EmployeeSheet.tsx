'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeSchema, type EmployeeInput } from '../schema';
import { createEmployee, updateEmployee } from '../actions';

interface Position { id: string; name: string }
interface Department { id: string; name: string }
interface ManagerOption { id: string; full_name: string }

export interface ExistingEmployee {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  positionId: string | null;
  departmentId: string | null;
  managerId: string | null;
  role: 'admin_rh' | 'director' | 'user';
  hireDate: string;
  isSelf: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positions: Position[];
  departments: Department[];
  managers: ManagerOption[];
  employee?: ExistingEmployee | null;
}

const ROLE_LABELS = { admin_rh: 'Administrador RH', director: 'Diretor', user: 'Colaborador' };

const EMPTY_DEFAULTS: EmployeeInput = {
  fullName: '',
  email: '',
  positionId: '',
  role: 'user',
  departmentId: null,
  managerId: null,
  hireDate: new Date().toISOString().split('T')[0],
  phone: '',
  sendInvite: true,
};

export function EmployeeSheet({ open, onOpenChange, positions, departments, managers, employee }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!employee;

  // Maps id/enum → label para que <SelectValue> mostre o nome legível em vez do UUID
  const positionItems = positions.map((p) => ({ value: p.id, label: p.name }));
  const departmentItems = [
    { value: '__none__', label: 'Nenhum' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];
  const roleItems = (Object.entries(ROLE_LABELS) as [EmployeeInput['role'], string][])
    .map(([value, label]) => ({ value, label }));

  const form = useForm<EmployeeInput>({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const sendInvite = form.watch('sendInvite');

  useEffect(() => {
    if (!open) return;
    if (employee) {
      form.reset({
        fullName: employee.full_name,
        email: employee.email,
        positionId: employee.positionId ?? '',
        role: employee.role,
        departmentId: employee.departmentId,
        managerId: employee.managerId,
        hireDate: employee.hireDate,
        phone: employee.phone ?? '',
        sendInvite: false,
      });
    } else {
      form.reset(EMPTY_DEFAULTS);
    }
  }, [open, employee, form]);

  async function onSubmit(values: EmployeeInput) {
    setLoading(true);
    const result = isEdit
      ? await updateEmployee(employee!.id, values)
      : await createEmployee(values);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(
      isEdit
        ? 'Colaborador atualizado!'
        : values.sendInvite
          ? 'Colaborador cadastrado e convite enviado!'
          : 'Colaborador cadastrado sem convite.',
    );
    onOpenChange(false);
    setLoading(false);
  }

  const ctaLabel = isEdit
    ? 'Salvar'
    : sendInvite
      ? 'Cadastrar e enviar convite'
      : 'Cadastrar sem enviar';

  // Disponibiliza apenas managers que não são o próprio employee em modo edit
  const managerOptions = isEdit
    ? managers.filter((m) => m.id !== employee!.id)
    : managers;

  // Em modo edit do próprio admin, bloqueia mudança de papel
  const roleDisabled = isEdit && employee!.isSelf;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px] p-0 gap-0 flex flex-col">
        <div className="px-6 py-5 border-b">
          <SheetTitle className="text-base font-semibold">
            {isEdit ? 'Editar colaborador' : 'Novo colaborador'}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground mt-1">
            {isEdit
              ? 'Atualize os dados do colaborador. Mudanças entram em vigor imediatamente.'
              : 'Cadastre o colaborador e envie o convite por e-mail.'}
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Form {...form}>
            <form id="employee-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  <FormControl>
                    <Input type="email" placeholder="ana@empresa.com" {...field} disabled={isEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="positionId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} items={positionItems}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecione…" /></SelectTrigger>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={roleDisabled} items={roleItems}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleItems.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {roleDisabled && (
                      <p className="text-[11px] text-muted-foreground">Você não pode alterar seu próprio papel.</p>
                    )}
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
                    items={departmentItems}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departmentItems.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="managerId" render={({ field }) => {
                const managerItems = [
                  { value: '__none__', label: 'Nenhum' },
                  ...managerOptions.map((m) => ({ value: m.id, label: m.full_name })),
                ];
                return (
                  <FormItem>
                    <FormLabel>Gestor direto</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                      value={field.value ?? '__none__'}
                      items={managerItems}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managerItems.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }} />

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

              {!isEdit && (
                <FormField control={form.control} name="sendInvite" render={({ field }) => (
                  <FormItem className="flex items-start gap-3 rounded-lg border p-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? true}
                        onChange={field.onChange}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="cursor-pointer">Enviar convite por e-mail agora</FormLabel>
                      <p className="text-xs text-muted-foreground">Link expira em 7 dias.</p>
                    </div>
                  </FormItem>
                )} />
              )}
            </form>
          </Form>
        </div>

        <div className="px-6 py-4 border-t bg-muted/30 flex gap-2 justify-end">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="employee-form" disabled={loading}>
            {loading ? 'Salvando…' : ctaLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
