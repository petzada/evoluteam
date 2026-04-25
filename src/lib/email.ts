import { Resend } from 'resend';

const FROM = 'Evoluteam <marcio@marct.co>';
let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean }> {
  const client = getResend();
  if (!client) return { ok: false };

  try {
    await client.emails.send({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
