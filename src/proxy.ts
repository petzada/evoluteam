import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

// Proxy enxuto: faz APENAS auth.getUser() e roteamento publico/privado.
// Os guards mais ricos (sem empresa, empresa suspensa, conta desligada)
// vivem em src/features/auth/context.ts -> getActorContext(), executado
// uma unica vez por request via React.cache no layout (app).
//
// Por que: ate 24/04 o proxy fazia 3 queries Supabase em TODA request
// (auth.getUser + profiles + employees). Isso somava ~500ms de latencia
// no caminho critico, redundante com o que o layout ja refaz.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const isPublicReset = pathname.startsWith('/reset-password');
  const isPublicInvite = pathname.startsWith('/convite');
  const isPublicCallback = pathname.startsWith('/auth/callback');
  const isPublicAuth = pathname === '/login' || pathname === '/forgot-password';
  const isPublicSuspended = pathname === '/conta-suspensa';
  const isPublicMarketing = pathname === '/' || pathname === '/privacidade' || pathname === '/termos';

  if (isPublicReset || isPublicInvite || isPublicCallback) return response;
  if (isPublicMarketing) return response;

  if (isPublicAuth) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url));
    return response;
  }

  if (isPublicSuspended) return response;

  if (!user) {
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('continue', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|icon|apple-icon|opengraph-image|twitter-image|manifest|robots\\.txt|sitemap\\.xml|.*\\..*).*)',
  ],
};
