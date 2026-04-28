import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

// Proxy enxuto: faz APENAS auth.getUser() e roteamento publico/privado.
// Os guards mais ricos (sem empresa, empresa suspensa, conta desligada)
// vivem em src/features/auth/context.ts -> getActorContext(), executado
// uma unica vez por request via React.cache no layout (app).
//
// Por que NAO mexe em Server Actions:
// Quando o cliente chama uma Server Action (POST com header `next-action`),
// o proxy nao deve interceptar para fazer redirect. Caso a sessao expire
// no meio do fluxo, o redirect aqui retorna HTML/307 onde o cliente espera
// payload RSC e quebra com "An unexpected response was received from the
// server" (ver Next.js discussion #87651).
//
// Por que NAO redireciona em prefetch RSC:
// O <Link> do Next dispara prefetch GET com header `RSC: 1` ou
// `Next-Router-Prefetch: 1`. Se o proxy responde com 307 redirect,
// o cliente cancela o prefetch e ao clicar no link estoura
// "TypeError: Failed to fetch" no fetchServerResponse (ver Next.js
// issue #60549). Em vez disso, em prefetch sem sessao retornamos
// 200 vazio — a navegacao real (sem header RSC) cuida do redirect.
//
// Por que so 1 chamada Supabase por request:
// Ate 24/04 o proxy fazia 3 queries Supabase em TODA request
// (auth.getUser + profiles + employees). Isso somava ~500ms de
// latencia no caminho critico, redundante com o que o layout ja refaz.
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPublicReset = pathname.startsWith('/reset-password');
  const isPublicInvite = pathname.startsWith('/convite');
  const isPublicCallback = pathname.startsWith('/auth/callback');
  const isPublicAuth = pathname === '/login' || pathname === '/forgot-password';
  const isPublicSuspended = pathname === '/conta-suspensa';
  const isPublicMarketing = pathname === '/' || pathname === '/privacidade' || pathname === '/termos';

  // Server Action: nao mexer. Layout/handler ja fazem o gate.
  // Heuristica oficial do Next: POST + header `next-action`.
  const isServerAction = request.method === 'POST' && request.headers.has('next-action');

  // RSC prefetch: <Link> faz fetch silencioso pra preparar a navegacao.
  // Sinalizado por header `RSC: 1` ou `Next-Router-Prefetch: 1` (ou
  // `_rsc=` na querystring em algumas variacoes). NUNCA redirecionar
  // aqui — o cliente nao sabe seguir e estoura "Failed to fetch".
  const isRscPrefetch =
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') === '1' ||
    request.nextUrl.searchParams.has('_rsc');

  // Resposta unica que carregamos pra frente; cookies do Supabase
  // sao copiados para ela no callback setAll (padrao recomendado para
  // Next 15/16 + @supabase/ssr).
  const supabaseResponse = NextResponse.next({ request });

  if (isServerAction) return supabaseResponse;
  if (isPublicReset || isPublicInvite || isPublicCallback) return supabaseResponse;
  if (isPublicMarketing) return supabaseResponse;

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Try/catch silencia "Invalid Refresh Token: Refresh Token Not Found"
  // quando o cliente envia cookies antigos sem refresh valido. Tratamos
  // como "sem sessao" — o cleanup dos cookies vem na proxima resposta.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (isPublicAuth) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url));
    return supabaseResponse;
  }

  if (isPublicSuspended) return supabaseResponse;

  if (!user) {
    // Prefetch RSC: nao redirecionar — retornar 200 vazio. A navegacao
    // real (que vem depois sem header RSC) faz o redirect normal.
    if (isRscPrefetch) {
      return new NextResponse(null, { status: 200 });
    }
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('continue', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|icon|apple-icon|opengraph-image|twitter-image|manifest|robots\\.txt|sitemap\\.xml|.*\\..*).*)',
  ],
};
