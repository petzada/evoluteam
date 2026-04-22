import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { sendEmail } from '@/lib/email';
import { renderAdminWelcome } from '@/emails/admin-welcome';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

type Payload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id?: string;
    email?: string;
    raw_app_meta_data?: { source?: string } | null;
    created_at?: string;
  };
};

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature');
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = JSON.parse(rawBody) as Payload;
  } catch {
    return NextResponse.json({ ok: true, reason: 'invalid_json' }, { status: 200 });
  }

  const record = payload.record;
  if (!record?.email || !record?.id) {
    return NextResponse.json({ ok: true, reason: 'missing_fields' }, { status: 200 });
  }

  const source = record.raw_app_meta_data?.source;
  if (source === 'invite') {
    return NextResponse.json({ ok: true, reason: 'invited' }, { status: 200 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  // Gera magic link de recovery: o user clica -> Supabase autentica via token
  // -> redireciona pra /reset-password com session ativa -> user so define senha.
  const admin = createAdminSupabaseClient();
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: record.email,
    options: { redirectTo: `${origin}/reset-password` },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json({ ok: true, reason: 'link_gen_failed' }, { status: 200 });
  }

  await sendEmail({
    to: record.email,
    ...(await renderAdminWelcome({ recoveryUrl: linkData.properties.action_link })),
  });

  return NextResponse.json({ ok: true, reason: 'welcomed' }, { status: 200 });
}
