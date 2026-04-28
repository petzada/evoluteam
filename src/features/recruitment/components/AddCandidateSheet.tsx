'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CandidateInputSchema, type CandidateInput,
  CANDIDATE_SOURCES, CANDIDATE_SOURCE_LABELS,
} from '../schema';
import {
  createAndLinkCandidate,
  linkCandidateToJob,
} from '../actions/applications';
import type { CandidateRow } from '../queries/candidates';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobOpeningId: string;
  searchCandidatesAction: (query: string) => Promise<CandidateRow[]>;
}

const EMPTY_DEFAULTS: CandidateInput = {
  name: '',
  email: '',
  phone: '',
  linkedinUrl: '',
  resumeUrl: '',
  source: 'manual',
  sourceOther: '',
  notes: '',
};

export function AddCandidateSheet({ open, onOpenChange, jobOpeningId, searchCandidatesAction }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'novo' | 'existente'>('novo');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CandidateRow[]>([]);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const form = useForm<CandidateInput>({
    resolver: zodResolver(CandidateInputSchema),
    defaultValues: EMPTY_DEFAULTS,
  });
  const source = useWatch({ control: form.control, name: 'source' });

  async function onSubmitNew(values: CandidateInput) {
    setLoading(true);
    try {
      const result = await createAndLinkCandidate(values, jobOpeningId);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Candidato cadastrado e vinculado');
      onOpenChange(false);
      form.reset(EMPTY_DEFAULTS);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onSearchChange(q: string) {
    setSearch(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const found = await searchCandidatesAction(q);
      setResults(found);
    });
  }

  async function onLinkExisting(id: string) {
    setLinkingId(id);
    try {
      const result = await linkCandidateToJob(id, jobOpeningId);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Candidato vinculado à vaga');
      onOpenChange(false);
      setSearch('');
      setResults([]);
      router.refresh();
    } finally {
      setLinkingId(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[460px] sm:max-w-[460px]">
        <SheetHeader>
          <SheetTitle>Adicionar candidato à vaga</SheetTitle>
          <SheetDescription>
            Cadastre um novo candidato ou vincule um do banco global.
          </SheetDescription>
        </SheetHeader>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'novo' | 'existente')}
          className="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="novo">Cadastrar novo</TabsTrigger>
              <TabsTrigger value="existente">Vincular existente</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="novo" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
            <Form {...form}>
              <form id="add-candidate-form" onSubmit={form.handleSubmit(onSubmitNew)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl><Input {...field} placeholder="Nome completo" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail *</FormLabel>
                    <FormControl><Input type="email" {...field} placeholder="email@exemplo.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl><Input value={field.value ?? ''} onChange={field.onChange} placeholder="(11) 91234-5678" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl><Input value={field.value ?? ''} onChange={field.onChange} placeholder="https://linkedin.com/in/…" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="source" render={({ field }) => {
                  const items = CANDIDATE_SOURCES.map((s) => ({ value: s, label: CANDIDATE_SOURCE_LABELS[s] }));
                  return (
                    <FormItem>
                      <FormLabel>Origem *</FormLabel>
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
                }} />
                {source === 'outro' && (
                  <FormField control={form.control} name="sourceOther" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descreva a origem *</FormLabel>
                      <FormControl><Input value={field.value ?? ''} onChange={field.onChange} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações internas</FormLabel>
                    <FormControl><Textarea rows={3} value={field.value ?? ''} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="existente" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por nome ou e-mail…"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              {search.trim().length < 2 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Digite ao menos 2 caracteres para buscar candidatos.
                </p>
              )}
              {search.trim().length >= 2 && results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum candidato encontrado ou todos já estão nesta vaga.
                </p>
              )}
              {results.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-3 border rounded-md">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.active_applications_count} vaga(s) ativa(s)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onLinkExisting(c.id)}
                    disabled={linkingId === c.id}
                  >
                    {linkingId === c.id ? 'Vinculando…' : 'Vincular'}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {tab === 'novo' && (
            <Button type="submit" form="add-candidate-form" disabled={loading}>
              {loading ? 'Salvando…' : 'Cadastrar e vincular'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
