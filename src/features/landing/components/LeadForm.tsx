'use client';

import { useMemo, useState, useTransition } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitLead, type SubmitLeadResult } from '../actions';
import {
  isPersonalEmail,
  leadRoles,
  leadSchema,
  teamSizeLabels,
  teamSizes,
  type LeadInput,
} from '../schema';

const initialValues: LeadInput = {
  fullName: '',
  email: '',
  company: '',
  role: 'RH',
  teamSize: '21-50',
  reason: '',
};

export function LeadForm() {
  const [values, setValues] = useState<LeadInput>(initialValues);
  const [result, setResult] = useState<SubmitLeadResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LeadInput, string>>>({});
  const [pending, startTransition] = useTransition();

  const personalEmailWarning = useMemo(
    () => (values.email && isPersonalEmail(values.email) ? 'Você pode enviar assim mesmo, mas um e-mail corporativo ajuda a qualificar a conversa.' : ''),
    [values.email],
  );

  function update<K extends keyof LeadInput>(field: K, value: LeadInput[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setResult(null);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof LeadInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof LeadInput | undefined;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setFieldErrors(nextErrors);
      setResult({ ok: false, message: 'Revise os campos destacados.', fieldErrors: nextErrors });
      return;
    }

    startTransition(async () => {
      const response = await submitLead(parsed.data);
      setResult(response);
      if (!response.ok) {
        setFieldErrors(response.fieldErrors ?? {});
        return;
      }
      setValues(initialValues);
      setFieldErrors({});
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded border border-slate-200 bg-white p-6 text-slate-950 shadow-sm sm:p-8">
      <div className="mb-6 border-b border-slate-200 pb-6">
        <h3 className="font-serif-landing text-3xl font-medium">Agendar demonstração</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Conte o básico e retornamos com os próximos horários disponíveis.
        </p>
      </div>

      <div className="grid gap-5">
        <Field label="Nome completo" htmlFor="lead-full-name" error={fieldErrors.fullName}>
          <Input
            id="lead-full-name"
            value={values.fullName}
            onChange={(event) => update('fullName', event.target.value)}
            aria-invalid={Boolean(fieldErrors.fullName)}
            autoComplete="name"
          />
        </Field>

        <Field label="E-mail corporativo" htmlFor="lead-email" error={fieldErrors.email} hint={personalEmailWarning}>
          <Input
            id="lead-email"
            type="email"
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="email"
          />
        </Field>

        <Field label="Empresa" htmlFor="lead-company" error={fieldErrors.company}>
          <Input
            id="lead-company"
            value={values.company}
            onChange={(event) => update('company', event.target.value)}
            aria-invalid={Boolean(fieldErrors.company)}
            autoComplete="organization"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Seu papel" htmlFor="lead-role" error={fieldErrors.role}>
            <select
              id="lead-role"
              value={values.role}
              onChange={(event) => update('role', event.target.value as LeadInput['role'])}
              aria-invalid={Boolean(fieldErrors.role)}
              className="h-10 w-full rounded border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {leadRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tamanho do time" htmlFor="lead-team-size" error={fieldErrors.teamSize}>
            <select
              id="lead-team-size"
              value={values.teamSize}
              onChange={(event) => update('teamSize', event.target.value as LeadInput['teamSize'])}
              aria-invalid={Boolean(fieldErrors.teamSize)}
              className="h-10 w-full rounded border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {teamSizes.map((size) => (
                <option key={size} value={size}>
                  {teamSizeLabels[size]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="O que te trouxe ao Evoluteam?" htmlFor="lead-reason" error={fieldErrors.reason}>
          <Textarea
            id="lead-reason"
            value={values.reason ?? ''}
            onChange={(event) => update('reason', event.target.value)}
            aria-invalid={Boolean(fieldErrors.reason)}
            placeholder="Conte em 1-2 frases a principal dor que você quer resolver."
            className="min-h-24 rounded"
          />
        </Field>
      </div>

      {result ? (
        <p className={result.ok ? 'mt-4 text-sm text-emerald-700' : 'mt-4 text-sm text-red-600'}>
          {result.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-6 h-11 w-full rounded-xl bg-[#181d26] text-white hover:bg-slate-800">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Agendar demonstração
        {!pending ? <ArrowRight className="size-4" /> : null}
      </Button>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Ao enviar, você concorda com a política de privacidade. Retorno em até 24h com horários disponíveis.
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="text-slate-800">{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-primary">{hint}</p> : null}
    </div>
  );
}
