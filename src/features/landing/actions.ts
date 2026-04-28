'use server';

import { renderLeadNotification } from '@/emails/lead-notification';
import { sendEmail } from '@/lib/email';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { TablesInsert } from '@/lib/supabase/types';
import { leadSchema, type LeadInput } from './schema';

export type SubmitLeadResult =
  | { ok: true; message: string; warning?: string }
  | { ok: false; message: string; fieldErrors?: Partial<Record<keyof LeadInput, string>> };

function normalizeErrors(error: ReturnType<typeof leadSchema.safeParse>['error']) {
  if (!error) return undefined;
  const fieldErrors: Partial<Record<keyof LeadInput, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof LeadInput | undefined;
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

export async function submitLead(input: LeadInput): Promise<SubmitLeadResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Revise os campos destacados.',
      fieldErrors: normalizeErrors(parsed.error),
    };
  }

  const lead = parsed.data;
  const source = 'landing';
  const admin = createAdminSupabaseClient();

  const payload: TablesInsert<'leads'> = {
    full_name: lead.fullName,
    email: lead.email.toLowerCase(),
    company: lead.company,
    role: lead.role,
    team_size: lead.teamSize,
    source,
  };

  const { error } = await admin.from('leads').insert(payload);
  if (error) {
    return {
      ok: false,
      message: 'Não foi possível enviar agora. Tente novamente em alguns minutos.',
    };
  }

  const recipient = process.env.SALES_LEAD_RECIPIENT_EMAIL || 'marcio@marct.co';
  const email = await sendEmail({
    to: recipient,
    ...(await renderLeadNotification({ ...lead, source })),
  });

  if (!email.ok) {
    return {
      ok: true,
      message: 'Recebemos seus dados. Vamos entrar em contato em breve.',
      warning: 'O aviso interno por email não foi confirmado, mas o lead foi salvo.',
    };
  }

  return {
    ok: true,
    message: 'Recebemos seus dados. Vamos entrar em contato em breve.',
  };
}
