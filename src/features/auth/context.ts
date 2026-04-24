// Loader unificado do contexto do actor para Server Components (layouts e pages).
//
// Por que existe: antes deste arquivo, cada layout e cada page faziam por
// conta propria auth.getUser() + select em profiles + select em employees +
// loadActorGate. Em uma navegacao tipica isso roda 2-3 vezes (proxy, layout,
// page) e bloqueia o TTFB em ~10 queries sequenciais. Agora todos chamam
// getActorContext() — cacheado por request via React.cache — e os dados sao
// resolvidos uma unica vez.
//
// Importante: redirects sao feitos AQUI dentro. Quem chama nao precisa
// repetir os guards (sem usuario -> /login, sem empresa -> onboarding,
// suspensa -> /conta-suspensa, terminated -> signOut + login). Por isso este
// loader so pode ser usado em rotas autenticadas.

import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadActorGate } from '@/features/permissions/queries';
import { hasOpenJobAsHiringManager } from '@/features/recruitment/queries/jobOpenings';
import type { Actor, Role, ScreenPermissions } from '@/features/permissions/types';

export type ActorContext = {
  user: { id: string; email: string | null };
  profile: {
    id: string;
    role: Role;
    company_id: string;
    full_name: string;
    avatar_url: string | null;
    company: { name: string; status: string } | null;
  };
  employee: {
    id: string;
    status: 'active' | 'inactive' | 'terminated';
    manager_id: string | null;
  } | null;
  isManager: boolean;
  isHiringManager: boolean;
  gate: { screenPermissions: ScreenPermissions | null };
};

export const getActorContext = cache(async (): Promise<ActorContext> => {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id, role, company_id, full_name, avatar_url, company:companies(name, status)')
    .eq('id', user.id)
    .single();

  if (!profileRow) redirect('/login');
  if (!profileRow.company_id) redirect('/onboarding/criar-empresa');

  const company = (profileRow.company ?? null) as { name: string; status: string } | null;
  if (company?.status === 'suspended') redirect('/conta-suspensa');

  const { data: employee } = await supabase
    .from('employees')
    .select('id, status, manager_id')
    .eq('user_id', user.id)
    .eq('company_id', profileRow.company_id)
    .maybeSingle();

  if (employee?.status === 'terminated') {
    await supabase.auth.signOut();
    redirect('/login?error=conta_desligada');
  }

  const role = profileRow.role as Role;

  const [directReportsRes, isHiringManager, gate] = await Promise.all([
    employee?.id
      ? supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('manager_id', employee.id)
      : Promise.resolve({ count: 0 as number | null }),
    employee?.id
      ? hasOpenJobAsHiringManager(profileRow.company_id, employee.id)
      : Promise.resolve(false),
    loadActorGate(user.id, role),
  ]);

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: {
      id: profileRow.id,
      role,
      company_id: profileRow.company_id,
      full_name: profileRow.full_name,
      avatar_url: profileRow.avatar_url,
      company,
    },
    employee: employee as ActorContext['employee'],
    isManager: (directReportsRes.count ?? 0) > 0,
    isHiringManager,
    gate,
  };
});

// Adapter para callsites que precisam do Actor (canDo, hasAdminPower, etc).
// O screenPermissions vem de loadActorGate (admin/director recebem null).
export function actorFromContext(ctx: ActorContext): Actor {
  return {
    userId: ctx.user.id,
    companyId: ctx.profile.company_id,
    role: ctx.profile.role,
    employeeId: ctx.employee?.id ?? null,
    employeeStatus: ctx.employee?.status ?? null,
    screenPermissions: ctx.gate.screenPermissions,
  };
}
