'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { onInvalidToast } from '@/lib/form';
import { EmployeeSchema, type EmployeeInput } from '../schema';
import { createEmployee, updateEmployee } from '../actions';
import { createTaxonomy } from '@/features/taxonomies/actions';
import {
  EMPTY_SCREEN_PERMISSIONS,
  type ScreenPermissions,
} from '@/features/permissions/types';
import { getDisabledGrantPermissionKeys } from '@/features/permissions/permissions';
import { ScreenPermissionsToggles } from '@/features/permissions/components/ScreenPermissionsToggles';

interface Position { id: string; name: string }
interface Department { id: string; name: string }
interface Unit { id: string; name: string; is_archived: boolean }
interface ManagerOption { id: string; full_name: string }

export interface ExistingEmployee {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  positionId: string | null;
  departmentId: string | null;
  unitId: string | null;
  managerId: string | null;
  role: 'admin_rh' | 'director' | 'user';
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
  // FT-10: lista de unidades para o select. Em modo edit, deve incluir tambem
  // a unidade arquivada vinculada ao colaborador (para preservar visibilidade).
  units?: Unit[];
  managers: ManagerOption[];
  employee?: ExistingEmployee | null;
  canManageEmployees: boolean;
  actorIsAdmin: boolean;
  actorScreenPermissions?: ScreenPermissions | null;
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
  unitId: null,
  managerId: null,
  hireDate: new Date().toISOString().split('T')[0],
  phone: '',
  sendInvite: true,
  internalNotes: '',
  screenPermissions: null,
};

export function EmployeeSheet({
  open,
  onOpenChange,
  positions,
  departments,
  units = [],
  managers,
  employee,
  canManageEmployees,
  actorIsAdmin,
  actorScreenPermissions,
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
  const [createdLocallyUnits, setCreatedLocallyUnits] = useState<Unit[]>([]);
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [creatingUnit, setCreatingUnit] = useState(false);
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

  const localUnits = useMemo(() => {
    const existing = new Set(units.map((u) => u.id));
    const fresh = createdLocallyUnits.filter((c) => !existing.has(c.id));
    return [...units, ...fresh].sort((a, b) => a.name.localeCompare(b.name));
  }, [units, createdLocallyUnits]);

  const canCreatePositions = actorIsAdmin || actorScreenPermissions?.['cargos.edit'] === true;
  const canCreateDepartments = actorIsAdmin || actorScreenPermissions?.['departamentos.edit'] === true;
  const canCreateUnits = actorIsAdmin || actorScreenPermissions?.['unidades.edit'] === true;
  const disabledPermissionKeys = actorIsAdmin
    ? []
    : getDisabledGrantPermissionKeys(actorScreenPermissions);

  const positionItems = [
    ...localPositions.map((p) => ({ value: p.id, label: p.name })),
    ...(canCreatePositions ? [{ value: '__create_position__', label: '+ Criar cargo novo' }] : []),
  ];
  const departmentItems = [
    { value: '__none__', label: 'Nenhum' },
    ...localDepartments.map((d) => ({ value: d.id, label: d.name })),
    ...(canCreateDepartments ? [{ value: '__create__', label: '+ Criar novo departamento' }] : []),
  ];
  // FT-10: items do select de Unidade. Em edit, unidade arquivada vinculada
  // ao colaborador permanece visivel (preserva historico).
  const unitItems = [
    { value: '__none__', label: 'Sem unidade' },
    ...localUnits.map((u) => ({
      value: u.id,
      label: u.is_archived ? `${u.name} (arquivada)` : u.name,
    })),
    ...(canCreateUnits ? [{ value: '__create_unit__', label: '+ Nova unidade' }] : []),
  ];
  // FT-9: actor nao-admin so concede Colaborador; Admin/Diretor viram
  // opcoes desabilitadas com tooltip. Admin_rh nunca aparece como opcao
  // de convite (so o dono do SaaS cria Admin via painel Supabase).
  const roleItems = (Object.entries(ROLE_LABELS) as [EmployeeInput['role'], string][])
    .filter(([value]) => value !== 'admin_rh' || isEdit) // admin_rh so em edit (pra mostrar)
    .map(([value, label]) => ({
      value,
      label,
      disabled: !actorIsAdmin && value !== 'user',
    }));

  const form = useForm<EmployeeInput>({
    resolver: zodResolver(EmployeeSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
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
      // FT-10: ressincronizar unitId via reset evita o useState(initialProp)
      // trap (FT-7); a prop muda apos router.refresh() e precisa ser recolhida.
      form.reset({
        fullName: employee.full_name,
        email: employee.email,
        positionId: employee.positionId ?? '',
        role: employee.role,
        departmentId: employee.departmentId,
        unitId: employee.unitId ?? null,
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
      <SheetContent className="w-[440px] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">
            {isEdit ? 'Editar colaborador' : 'Novo colaborador'}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {isEdit
              ? 'Atualize os dados do colaborador. Mudanças entram em vigor imediatamente.'
              : 'Cadastre o colaborador e envie o convite por e-mail.'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <Form {...form}>
            <form id="employee-form" onSubmit={form.handleSubmit(onSubmit, onInvalidToast(undefined, () => form.getValues()))} className="space-y-5">
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
                    {!actorIsAdmin && !roleDisabled && (
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
                      disabledKeys={disabledPermissionKeys}
                      disabledReason="Voce nao tem este acesso para conceder."
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Aplicadas automaticamente quando o convite for aceito.
                    </p>
                  </FormItem>
                )} />
              )}

              {isEdit && employee!.role === 'user' && (
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

              {/* FT-10: Unidade + Gestor direto na mesma row 2-cols (par "onde fica · a quem reporta"). */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="unitId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        if (v === '__create_unit__') {
                          setNewUnitName('');
                          setCreateUnitOpen(true);
                          return;
                        }
                        field.onChange(v === '__none__' ? null : v);
                      }}
                      value={field.value ?? '__none__'}
                      items={unitItems}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Sem unidade" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unitItems.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
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
              </div>

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

              {actorIsAdmin && (
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
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="employee-form" disabled={loading || !canManageEmployees}>
            {loading ? 'Salvando…' : ctaLabel}
          </Button>
        </SheetFooter>
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
            <Button type="button" onClick={() => void createDept()} disabled={creatingDept}>
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
            <Button type="button" onClick={() => void createPosition()} disabled={creatingPosition}>
              {creatingPosition ? 'Criando…' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createUnitOpen} onOpenChange={setCreateUnitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova unidade</DialogTitle>
            <DialogDescription>Fica disponível imediatamente para seleção.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-unit-name">Nome *</label>
            <Input
              id="new-unit-name"
              autoFocus
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder="Ex: Hugs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); void createUnitInline(); }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCreateUnitOpen(false)} disabled={creatingUnit}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void createUnitInline()} disabled={creatingUnit}>
              {creatingUnit ? 'Criando…' : 'Criar'}
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

  async function createUnitInline() {
    const name = newUnitName.trim();
    if (name.length < 2) { toast.error('Nome muito curto.'); return; }
    setCreatingUnit(true);
    // FT-10: createTaxonomy('unit', ...) delega para createUnit em features/units/actions.
    const result = await createTaxonomy('unit', { name });
    setCreatingUnit(false);
    if (result.error || !result.id) { toast.error(result.error ?? 'Erro ao criar.'); return; }
    const next: Unit = { id: result.id, name, is_archived: false };
    setCreatedLocallyUnits((prev) => [...prev, next]);
    form.setValue('unitId', result.id, { shouldDirty: true });
    setCreateUnitOpen(false);
    toast.success('Unidade criada e selecionada.');
  }
}
