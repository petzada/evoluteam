'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { EmployeeSchema, type EmployeeInput } from '../schema';
import { createEmployee, updateEmployee } from '../actions';
import { createTaxonomy } from '@/features/taxonomies/actions';
import { EMPTY_SCREEN_PERMISSIONS } from '@/features/permissions/types';
import { ScreenPermissionsToggles } from '@/features/permissions/components/ScreenPermissionsToggles';

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
  role: 'admin_rh' | 'director' | 'user' | 'rh';
  hireDate: string;
  isSelf: boolean;
  internalNotes?: string | null;
  descendantIds?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positions: Position[];
  departments: Department[];
  managers: ManagerOption[];
  employee?: ExistingEmployee | null;
  isAdmin: boolean;
}

// FT-9: role 'rh' removido. Roles concedidos via sheet: Colaborador + Diretor
// (para admin_rh); apenas Colaborador para actor nao-admin.
const ROLE_LABELS: Partial<Record<EmployeeInput['role'], string>> = {
  user: 'Colaborador',
  director: 'Diretor',
  admin_rh: 'Administrador',
};

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
  internalNotes: '',
  rhPermissions: null,
  screenPermissions: null,
};

export function EmployeeSheet({
  open, onOpenChange, positions, departments, managers, employee, isAdmin,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdLocally, setCreatedLocally] = useState<Department[]>([]);
  const [createDeptOpen, setCreateDeptOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);
  const [createdLocallyPositions, setCreatedLocallyPositions] = useState<Position[]>([]);
  const [createPositionOpen, setCreatePositionOpen] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const [creatingPosition, setCreatingPosition] = useState(false);
  const isEdit = !!employee;

  const localDepartments = useMemo(() => {
    const existing = new Set(departments.map((d) => d.id));
    const fresh = createdLocally.filter((c) => !existing.has(c.id));
    return [...departments, ...fresh].sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, createdLocally]);

  const localPositions = useMemo(() => {
    const existing = new Set(positions.map((p) => p.id));
    const fresh = createdLocallyPositions.filter((c) => !existing.has(c.id));
    return [...positions, ...fresh].sort((a, b) => a.name.localeCompare(b.name));
  }, [positions, createdLocallyPositions]);

  const positionItems = [
    ...localPositions.map((p) => ({ value: p.id, label: p.name })),
    ...(isAdmin ? [{ value: '__create_position__', label: '+ Criar cargo novo' }] : []),
  ];
  const departmentItems = [
    { value: '__none__', label: 'Nenhum' },
    ...localDepartments.map((d) => ({ value: d.id, label: d.name })),
    ...(isAdmin ? [{ value: '__create__', label: '+ Criar novo departamento' }] : []),
  ];
  // FT-9: actor nao-admin so concede Colaborador; Admin/Diretor viram
  // opcoes desabilitadas com tooltip. Admin_rh nunca aparece como opcao
  // de convite (so o dono do SaaS cria Admin via painel Supabase).
  const roleItems = (Object.entries(ROLE_LABELS) as [EmployeeInput['role'], string][])
    .filter(([value]) => value !== 'admin_rh' || isEdit) // admin_rh so em edit (pra mostrar)
    .map(([value, label]) => ({
      value,
      label,
      disabled: !isAdmin && value !== 'user',
    }));

  const form = useForm<EmployeeInput>({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const sendInvite = useWatch({ control: form.control, name: 'sendInvite' });
  const watchedRole = useWatch({ control: form.control, name: 'role' });
  // FT-9: toggles aparecem quando role=Colaborador em modo criar. Na edicao,
  // direcionamos pro drawer "Gerenciar acesso" (mais completo).
  const showScreenToggles = !isEdit && watchedRole === 'user';

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
        internalNotes: employee.internalNotes ?? '',
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
    router.refresh();
    onOpenChange(false);
    setLoading(false);
  }

  const ctaLabel = isEdit
    ? 'Salvar'
    : sendInvite
      ? 'Cadastrar e enviar convite'
      : 'Cadastrar sem enviar';

  const managerOptions = useMemo(() => {
    if (!isEdit) return managers;
    const blocked = new Set<string>([
      employee!.id,
      ...(employee!.descendantIds ?? []),
    ]);
    return managers.filter((m) => !blocked.has(m.id));
  }, [managers, employee, isEdit]);

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
                    <Select
                      onValueChange={(v) => {
                        if (v === '__create_position__') {
                          setNewPositionName('');
                          setCreatePositionOpen(true);
                          return;
                        }
                        field.onChange(v);
                      }}
                      value={field.value}
                      items={positionItems}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positionItems.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acesso *</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        if (v === 'user') {
                          if (!form.getValues('screenPermissions')) {
                            form.setValue('screenPermissions', { ...EMPTY_SCREEN_PERMISSIONS }, { shouldDirty: true });
                          }
                        } else {
                          form.setValue('screenPermissions', null, { shouldDirty: true });
                        }
                      }}
                      value={field.value}
                      disabled={roleDisabled}
                      items={roleItems}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleItems.map((r) => (
                          <SelectItem
                            key={r.value}
                            value={r.value}
                            disabled={r.disabled}
                            title={r.disabled ? 'Apenas Administrador pode conceder este acesso.' : undefined}
                          >
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {roleDisabled && (
                      <p className="text-[11px] text-muted-foreground">Você não pode alterar seu próprio papel.</p>
                    )}
                    {!isAdmin && !roleDisabled && (
                      <p className="text-[11px] text-muted-foreground">
                        Apenas Administrador pode conceder Diretor.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {showScreenToggles && (
                <FormField control={form.control} name="screenPermissions" render={({ field }) => (
                  <FormItem>
                    <ScreenPermissionsToggles
                      title="Permissões deste colaborador"
                      value={field.value ?? EMPTY_SCREEN_PERMISSIONS}
                      onChange={(next) => field.onChange(next)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Aplicadas automaticamente quando o convite for aceito.
                    </p>
                  </FormItem>
                )} />
              )}

              {isEdit && (employee!.role === 'user' || employee!.role === 'rh') && (
                <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Para alterar papel ou permissões deste colaborador, use <strong>Gerenciar acesso</strong> no perfil.
                </div>
              )}

              <FormField control={form.control} name="departmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      if (v === '__create__') {
                        setNewDeptName('');
                        setCreateDeptOpen(true);
                        return;
                      }
                      field.onChange(v === '__none__' ? null : v);
                    }}
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

              {isAdmin && (
                <FormField control={form.control} name="internalNotes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações internas</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Visível apenas para Admin RH."
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">Visível apenas para Admin RH.</p>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

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

      <Dialog open={createDeptOpen} onOpenChange={setCreateDeptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo departamento</DialogTitle>
            <DialogDescription>Fica disponível imediatamente para seleção.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-dept-name">Nome *</label>
            <Input
              id="new-dept-name"
              autoFocus
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="Ex: Engenharia"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); void createDept(); }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCreateDeptOpen(false)} disabled={creatingDept}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void createDept()} disabled={creatingDept || newDeptName.trim().length < 2}>
              {creatingDept ? 'Criando…' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createPositionOpen} onOpenChange={setCreatePositionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cargo</DialogTitle>
            <DialogDescription>Fica disponível imediatamente para seleção.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-position-name">Nome *</label>
            <Input
              id="new-position-name"
              autoFocus
              value={newPositionName}
              onChange={(e) => setNewPositionName(e.target.value)}
              placeholder="Ex: Gerente de Produto"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); void createPosition(); }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCreatePositionOpen(false)} disabled={creatingPosition}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void createPosition()} disabled={creatingPosition || newPositionName.trim().length < 2}>
              {creatingPosition ? 'Criando…' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );

  async function createDept() {
    const name = newDeptName.trim();
    if (name.length < 2) { toast.error('Nome muito curto.'); return; }
    setCreatingDept(true);
    const result = await createTaxonomy('department', { name });
    setCreatingDept(false);
    if (result.error || !result.id) { toast.error(result.error ?? 'Erro ao criar.'); return; }
    const next: Department = { id: result.id, name };
    setCreatedLocally((prev) => [...prev, next]);
    form.setValue('departmentId', result.id, { shouldDirty: true });
    setCreateDeptOpen(false);
    toast.success('Departamento criado e selecionado.');
  }

  async function createPosition() {
    const name = newPositionName.trim();
    if (name.length < 2) { toast.error('Nome muito curto.'); return; }
    setCreatingPosition(true);
    const result = await createTaxonomy('position', { name });
    setCreatingPosition(false);
    if (result.error || !result.id) { toast.error(result.error ?? 'Erro ao criar.'); return; }
    const next: Position = { id: result.id, name };
    setCreatedLocallyPositions((prev) => [...prev, next]);
    form.setValue('positionId', result.id, { shouldDirty: true });
    setCreatePositionOpen(false);
    toast.success('Cargo criado e selecionado.');
  }
}
