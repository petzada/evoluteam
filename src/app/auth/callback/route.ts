import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const VALID_TYPES: ReadonlySet<EmailOtpType> = new Set([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

export async function GET(request: NextRequest) {
  // Usa SITE_URL como origin canonico: request.url em route handler pode retornar
  // o host interno do proxy reverso (ex: localhost no Railway).
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const rawType = searchParams.get('type');
  const rawNext = searchParams.get('next') ?? '/dashboard';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  if (!tokenHash || !rawType || !VALID_TYPES.has(rawType as EmailOtpType)) {
    return NextResponse.redirect(`${origin}/login?error=link_invalido`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: rawType as EmailOtpType,
  });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=link_expirado`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
