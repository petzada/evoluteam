import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

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

  // 1) Rotas estritamente públicas
  const isPublicReset = pathname.startsWith('/reset-password');
  const isPublicInvite = pathname.startsWith('/convite');
  const isPublicAuth = pathname === '/login' || pathname === '/forgot-password';
  const isPublicSuspended = pathname === '/conta-suspensa';

  if (isPublicReset || isPublicInvite) return response;

  if (isPublicAuth) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url));
    return response;
  }

  if (isPublicSuspended) return response;

  // 2) Rotas autenticadas: precisa session
  if (!user) {
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('continue', pathname);
    return NextResponse.redirect(url);
  }

  // 3) Lookup de perfil (company, role, status do employee)
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, company:companies(status)')
    .eq('id', user.id)
    .single();

  const { data: employee } = profile?.company_id
    ? await supabase
        .from('employees')
        .select('status')
        .eq('user_id', user.id)
        .eq('company_id', profile.company_id)
        .maybeSingle()
    : { data: null };

  // 4) Conta desligada → força logout
  if (employee?.status === 'terminated') {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=conta_desligada', request.url));
  }

  // 5) Empresa suspensa
  const company = profile?.company as { status: string } | null;
  if (company?.status === 'suspended') {
    return NextResponse.redirect(new URL('/conta-suspensa', request.url));
  }

  // 6) Sem empresa: só pode ir para onboarding
  const hasCompany = !!profile?.company_id;
  if (!hasCompany) {
    if (pathname === '/onboarding/criar-empresa') return response;
    return NextResponse.redirect(new URL('/onboarding/criar-empresa', request.url));
  }

  // 7) Com empresa tentando acessar onboarding
  if (pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 8) Proteção de role em /configuracoes (exceto /perfil)
  if (pathname.startsWith('/configuracoes') && pathname !== '/configuracoes/perfil') {
    if (profile?.role !== 'admin_rh') {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // 9) /dashboard: colaborador comum sem liderados vai para seu perfil
  if (pathname === '/dashboard' && profile?.role !== 'admin_rh' && profile?.role !== 'director') {
    const { data: actorEmp } = profile?.company_id
      ? await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .eq('company_id', profile.company_id)
          .maybeSingle()
      : { data: null };
    if (actorEmp?.id) {
      const { count: subs } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', actorEmp.id);
      if (!subs) {
        return NextResponse.redirect(new URL(`/colaboradores/${actorEmp.id}`, request.url));
      }
    } else {
      return NextResponse.redirect(new URL('/colaboradores', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
