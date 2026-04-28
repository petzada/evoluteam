'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { onInvalidToast } from '@/lib/form';
import {
  JobOpeningInputSchema, type JobOpeningInput,
  JOB_OPENING_EMPLOYMENT_TYPES, JOB_OPENING_WORKPLACE_TYPES,
  JOB_OPENING_EMPLOYMENT_TYPE_LABELS, JOB_OPENING_WORKPLACE_TYPE_LABELS,
} from '../schema';
import { createJobOpening, updateJobOpening } from '../actions/jobOpenings';
import { createTaxonomy } from '@/features/taxonomies/actions';

interface TaxonomyItem { id: string; name: string }
interface ManagerItem { id: string; full_name: string }

export interface JobOpeningInitial {
  id: string;
  title: string;
  description: string | null;
  departmentId: string | null;
  positionId: string | null;
  hiringManagerId: string | null;
  employmentType: JobOpeningInput['employmentType'];
  workplaceType: JobOpeningInput['workplaceType'];
  location: string | null;
  openPositions: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: TaxonomyItem[];
  positions: TaxonomyItem[];
  managers: ManagerItem[];
  initial?: JobOpeningInitial | null;
  canCreateDepartments?: boolean;
  canCreatePositions?: boolean;
}

const NONE = '__none__';
const CREATE_DEPARTMENT = '__create_department__';
const CREATE_POSITION = '__create_position__';

function defaultsFor(initial: JobOpeningInitial | null | undefined): JobOpeningInput {
  return {
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    departmentId: initial?.departmentId ?? null,
    positionId: initial?.positionId ?? null,
    hiringManagerId: initial?.hiringManagerId ?? null,
    employmentType: initial?.employmentType ?? 'clt',
    workplaceType: initial?.workplaceType ?? 'presencial',
    location: initial?.location ?? '',
    openPositions: initial?.openPositions ?? 1,
  };
}

export function JobOpeningSheet({
  open,
  onOpenChange,
  departments,
  positions,
  managers,
  initial,
  canCreateDepartments = false,
  canCreatePositions = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdDepartments, setCreatedDepartments] = useState<TaxonomyItem[]>([]);
  const [createdPositions, setCreatedPositions] = useState<TaxonomyItem[]>([]);
  const [createDepartmentOpen, setCreateDepartmentOpen] = useState(false);
  const [createPositionOpen, setCreatePositionOpen] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newPositionName, setNewPositionName] = useState('');
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [creatingPosition, setCreatingPosition] = useState(false);
  const isEdit = !!initial;

  const localDepartments = useMemo(() => {
    const existing = new Set(departments.map((item) => item.id));
    const fresh = createdDepartments.filter((item) => !existing.has(item.id));
    return [...departments, ...fresh].sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, createdDepartments]);

  const localPositions = useMemo(() => {
    const existing = new Set(positions.map((item) => item.id));
    const fresh = createdPositions.filter((item) => !existing.has(item.id));
    return [...positions, ...fresh].sort((a, b) => a.name.localeCompare(b.name));
  }, [positions, createdPositions]);

  const form = useForm<JobOpeningInput>({
    resolver: zodResolver(JobOpeningInputSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: defaultsFor(initial),
  });

  async function onSubmit(values: JobOpeningInput) {
    setLoading(true);
    try {
      const result = isEdit && initial
        ? await updateJobOpening(initial.id, values)
        : await createJobOpening(values);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Vaga atualizada' : 'Vaga criada');
      onOpenChange(false);
      if (!isEdit && 'id' in result && result.id) {
        router.push(`/recrutamento/vagas/${result.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar vaga' : 'Nova vaga'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os detalhes da vaga.' : 'Cadastre uma nova vaga aberta.'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Form {...form}>
            <form id="job-opening-form" onSubmit={form.handleSubmit(onSubmit, onInvalidToast(undefined, () => form.getValues()))} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Analista de Suporte Jr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Responsabilidades, requisitos, benefícios…"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => {
                const items = [
                  { value: NONE, label: 'Nenhum' },
                  ...localDepartments.map((d) => ({ value: d.id, label: d.name })),
                  ...(canCreateDepartments
                    ? [{ value: CREATE_DEPARTMENT, label: '+ Criar novo departamento' }]
                    : []),
                ];
                return (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => {
                        if (v === CREATE_DEPARTMENT) {
                          setNewDepartmentName('');
                          setCreateDepartmentOpen(true);
                          return;
                        }
                        field.onChange(v === NONE ? null : v);
                      }}
                      items={items}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="positionId"
              render={({ field }) => {
                const items = [
                  { value: NONE, label: 'Nenhum' },
                  ...localPositions.map((p) => ({ value: p.id, label: p.name })),
                  ...(canCreatePositions
                    ? [{ value: CREATE_POSITION, label: '+ Criar novo cargo' }]
                    : []),
                ];
                return (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => {
                        if (v === CREATE_POSITION) {
                          setNewPositionName('');
                          setCreatePositionOpen(true);
                          return;
                        }
                        field.onChange(v === NONE ? null : v);
                      }}
                      items={items}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="hiringManagerId"
              render={({ field }) => {
                const items = [
                  { value: NONE, label: 'Sem gestor' },
                  ...managers.map((m) => ({ value: m.id, label: m.full_name })),
                ];
                return (
                  <FormItem>
                    <FormLabel>Gestor responsável</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                      items={items}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Sem gestor atribuído" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => {
                const items = JOB_OPENING_EMPLOYMENT_TYPES.map((t) => ({
                  value: t, label: JOB_OPENING_EMPLOYMENT_TYPE_LABELS[t],
                }));
                return (
                  <FormItem>
                    <FormLabel>Tipo de contrato *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} items={items}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {items.map((it) => (
                          <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="workplaceType"
              render={({ field }) => {
                const items = JOB_OPENING_WORKPLACE_TYPES.map((t) => ({
                  value: t, label: JOB_OPENING_WORKPLACE_TYPE_LABELS[t],
                }));
                return (
                  <FormItem>
                    <FormLabel>Modalidade *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} items={items}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {items.map((it) => (
                          <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localidade</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: São Paulo — SP"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openPositions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posições abertas *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </form>
          </Form>
        </SheetBody>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="job-opening-form" disabled={loading}>
            {loading ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar vaga'}
          </Button>
        </SheetFooter>
      </SheetContent>

      <Dialog open={createDepartmentOpen} onOpenChange={setCreateDepartmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo departamento</DialogTitle>
            <DialogDescription>Fica disponível imediatamente para seleção.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="job-opening-new-department">Nome *</label>
            <Input
              id="job-opening-new-department"
              autoFocus
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="Ex: Operações"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void createDepartment();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setCreateDepartmentOpen(false)}
              disabled={creatingDepartment}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void createDepartment()}
              disabled={creatingDepartment}
            >
              {creatingDepartment ? 'Criando…' : 'Criar'}
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
            <label className="text-sm font-medium" htmlFor="job-opening-new-position">Nome *</label>
            <Input
              id="job-opening-new-position"
              autoFocus
              value={newPositionName}
              onChange={(e) => setNewPositionName(e.target.value)}
              placeholder="Ex: Analista de Operações"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void createPosition();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setCreatePositionOpen(false)}
              disabled={creatingPosition}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void createPosition()}
              disabled={creatingPosition}
            >
              {creatingPosition ? 'Criando…' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );

  async function createDepartment() {
    const name = newDepartmentName.trim();
    if (name.length < 2) {
      toast.error('Nome muito curto.');
      return;
    }
    setCreatingDepartment(true);
    const result = await createTaxonomy('department', { name });
    setCreatingDepartment(false);
    if (result.error || !result.id) {
      toast.error(result.error ?? 'Erro ao criar departamento.');
      return;
    }

    const item = { id: result.id, name };
    setCreatedDepartments((prev) => [...prev, item]);
    form.setValue('departmentId', result.id, { shouldDirty: true });
    setCreateDepartmentOpen(false);
    toast.success('Departamento criado e selecionado.');
  }

  async function createPosition() {
    const name = newPositionName.trim();
    if (name.length < 2) {
      toast.error('Nome muito curto.');
      return;
    }
    setCreatingPosition(true);
    const result = await createTaxonomy('position', { name });
    setCreatingPosition(false);
    if (result.error || !result.id) {
      toast.error(result.error ?? 'Erro ao criar cargo.');
      return;
    }

    const item = { id: result.id, name };
    setCreatedPositions((prev) => [...prev, item]);
    form.setValue('positionId', result.id, { shouldDirty: true });
    setCreatePositionOpen(false);
    toast.success('Cargo criado e selecionado.');
  }
}
