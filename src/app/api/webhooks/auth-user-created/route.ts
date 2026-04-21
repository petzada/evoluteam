import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { sendEmail } from '@/lib/email';
import { adminWelcomeEmail } from '@/lib/emails/admin-welcome';

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
  const recoveryUrl = `${origin}/forgot-password`;

  await sendEmail({
    to: record.email,
    ...adminWelcomeEmail({ recoveryUrl }),
  });

  return NextResponse.json({ ok: true, reason: 'welcomed' }, { status: 200 });
}
