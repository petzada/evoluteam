'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { HireCandidateInputSchema, type HireCandidateInput } from '../schema';
import { hireCandidate, type HireEligibility } from '../actions/hire';

interface TaxonomyItem { id: string; name: string }
interface ManagerItem { id: string; full_name: string }

export interface HireContext {
  applicationId: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  job: {
    id: string;
    title: string;
    departmentId: string | null;
    positionId: string | null;
    hiringManagerId: string | null;
  };
  otherActiveApplications: { id: string; jobTitle: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligibility: HireEligibility | null;
  context: HireContext | null;
  positions: TaxonomyItem[];
  departments: TaxonomyItem[];
  managers: ManagerItem[];
}

const NONE = '__none__';

export function HireCandidateDialog(props: Props) {
  // key-remount por applicationId garante reset de form+state quando context muda
  const key = props.context?.applicationId ?? 'empty';
  return <HireCandidateDialogInner key={key} {...props} />;
}

function HireCandidateDialogInner({
  open, onOpenChange, eligibility, context, positions, departments, managers,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [conflictEmployee, setConflictEmployee] = useState<{
    id: string; name: string; department: string | null;
  } | null>(null);

  const form = useForm<HireCandidateInput>({
    resolver: zodResolver(HireCandidateInputSchema),
    defaultValues: defaultsFor(context, null),
  });

  async function onSubmit(values: HireCandidateInput) {
    if (!context) return;
    setLoading(true);
    try {
      const result = await hireCandidate(context.applicationId, values);
      if (result.ok) {
        toast.success('Candidato contratado e colaborador criado');
        onOpenChange(false);
        router.refresh();
        return;
      }
      if (result.reason === 'EMAIL_ALREADY_EXISTS') {
        setConflictEmployee(result.existingEmployee);
        toast.error('E-mail já em uso. Use um e-mail alternativo.');
        return;
      }
      if (result.reason === 'CANDIDATE_ALREADY_HIRED') {
        toast.error('Este candidato já foi contratado anteriormente.');
        return;
      }
      toast.error(result.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {eligibility && !eligibility.ok && eligibility.reason === 'CANDIDATE_ALREADY_HIRED' ? (
          <BlockedAlreadyHired hiredEmployeeId={eligibility.hiredEmployeeId} hiredEmployeeName={eligibility.hiredEmployeeName} onClose={() => onOpenChange(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="truncate">Contratar {context?.candidate.name}</span>
                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 shrink-0">
                  Vira colaborador(a)
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Vamos criar o cadastro de colaborador com base nos dados do processo seletivo.
                O histórico do candidato fica preservado.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <section className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Dados pessoais
                  </p>
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail *</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl><Input value={field.value ?? ''} onChange={field.onChange} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </section>

                <section className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Dados do colaborador
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="positionId" render={({ field }) => {
                      const items = positions.map((p) => ({ value: p.id, label: p.name }));
                      return (
                        <FormItem>
                          <FormLabel>Cargo *</FormLabel>
                          <Select value={field.value ?? ''} onValueChange={field.onChange} items={items}>
                            <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
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
                    <FormField control={form.control} name="departmentId" render={({ field }) => {
                      const items = [
                        { value: NONE, label: 'Nenhum' },
                        ...departments.map((d) => ({ value: d.id, label: d.name })),
                      ];
                      return (
                        <FormItem>
                          <FormLabel>Departamento</FormLabel>
                          <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)} items={items}>
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
                    }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="managerId" render={({ field }) => {
                      const items = [
                        { value: NONE, label: 'Sem gestor' },
                        ...managers.map((m) => ({ value: m.id, label: m.full_name })),
                      ];
                      return (
                        <FormItem>
                          <FormLabel>Gestor direto</FormLabel>
                          <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)} items={items}>
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
                    }} />
                    <FormField control={form.control} name="hiredAt" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de admissão *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="level" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível (opcional)</FormLabel>
                      <FormControl>
                        <Input value={field.value ?? ''} onChange={field.onChange} placeholder="Ex: Jr, Pleno, Sr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </section>

                {context && context.otherActiveApplications.length > 0 && (
                  <FormField control={form.control} name="archiveOtherApplications" render={({ field }) => (
                    <FormItem>
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-amber-400 accent-amber-600"
                          />
                          <div className="flex-1 text-amber-900">
                            <p className="font-semibold">Arquivar outras aplicações ativas</p>
                            <p className="mt-0.5">
                              {context.candidate.name} também está ativo(a) em:
                            </p>
                            <ul className="mt-1 list-disc list-inside">
                              {context.otherActiveApplications.map((o) => (
                                <li key={o.id}>{o.jobTitle}</li>
                              ))}
                            </ul>
                            <p className="mt-1 text-amber-800">
                              Se marcado, essas aplicações serão fechadas com motivo <i>aceitou outra proposta</i>.
                            </p>
                          </div>
                        </label>
                      </div>
                    </FormItem>
                  )} />
                )}

                {conflictEmployee && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-destructive">E-mail já em uso</p>
                        <p className="text-muted-foreground">
                          Já existe um colaborador com este e-mail: <b>{conflictEmployee.name}</b>
                          {conflictEmployee.department ? ` (${conflictEmployee.department})` : ''}.
                        </p>
                      </div>
                    </div>
                    <FormField control={form.control} name="alternativeEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">E-mail alternativo</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Digite um e-mail diferente"
                            value={field.value ?? ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Link
                      href={`/colaboradores/${conflictEmployee.id}`}
                      target="_blank"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Ver colaborador existente <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                <DialogFooter className="pt-4 border-t -mx-6 px-6 pb-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Contratando…' : 'Contratar e criar colaborador'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function defaultsFor(ctx: HireContext | null, emailOverride: string | null): HireCandidateInput {
  return {
    name: ctx?.candidate.name ?? '',
    email: emailOverride ?? ctx?.candidate.email ?? '',
    phone: ctx?.candidate.phone ?? null,
    positionId: ctx?.job.positionId ?? '',
    departmentId: ctx?.job.departmentId ?? null,
    managerId: ctx?.job.hiringManagerId ?? null,
    hiredAt: new Date().toISOString().slice(0, 10),
    level: null,
    archiveOtherApplications: (ctx?.otherActiveApplications.length ?? 0) > 0,
    alternativeEmail: null,
  };
}

function BlockedAlreadyHired({
  hiredEmployeeId, hiredEmployeeName, onClose,
}: { hiredEmployeeId: string; hiredEmployeeName: string | null; onClose: () => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Candidato já foi contratado anteriormente</DialogTitle>
      </DialogHeader>
      <div className="text-sm space-y-3 py-2">
        <p>
          Este candidato já possui cadastro de colaborador
          {hiredEmployeeName ? <> <b>{hiredEmployeeName}</b></> : ''}.
        </p>
        <p className="text-muted-foreground">
          Para recontratar, crie um novo cadastro de candidato (com um e-mail distinto)
          ou reative o colaborador existente em Colaboradores.
        </p>
        <div className="flex gap-2 pt-2">
          <Link href={`/colaboradores/${hiredEmployeeId}`} target="_blank">
            <Button variant="outline">
              Ver colaborador <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </>
  );
}
