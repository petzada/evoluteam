// Loader unificado do contexto do actor para Server Components (layouts e pages).
//
// Otimizacoes aplicadas:
// 1. React.cache: deduplica chamadas dentro da mesma request (shell+pages).
// 2. Promise.all(profile, employee): antes eram sequenciais (cascata de 2 RTTs).
// 3. memoize(gate, 30s): screenPermissions mudam raramente.
// 4. memoize(isHiringManager, 60s): assignment muda em atualizacoes de vaga.
//
// Redirects acontecem AQUI. Quem chama nao precisa repetir guards.
// So use em rotas autenticadas (layouts/pages dentro de (app)).

import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadActorGate } from '@/features/permissions/queries';
import { hasOpenJobAsHiringManager } from '@/features/recruitment/queries/jobOpenings';
import { memoize } from '@/lib/cache/memory';
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
  // Opt-in: setar DEBUG_ACTOR=1 no .env.local para ver as marcas de tempo.
  // Antes era ligado por padrao em dev, polui logs de QA/staging no Railway.
  const DEBUG = process.env.DEBUG_ACTOR === '1';
  const t0 = Date.now();
  const mark = (label: string) => {
    if (DEBUG) console.log(`[actor] ${label}: ${Date.now() - t0}ms`);
  };

  const supabase = await createServerSupabaseClient();
  mark('client');
  const { data: { user } } = await supabase.auth.getUser();
  mark('getUser');
  if (!user) redirect('/login');

  // Paraleliza: profile e employee sao independentes. Antes eram sequenciais.
  // employee e filtrado por user_id (unique) — company_id e revalidado depois.
  const [profileRes, employeeRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, role, company_id, full_name, avatar_url, company:companies(name, status)')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('employees')
      .select('id, status, manager_id, company_id')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);
  mark('profile+employee');

  const profileRow = profileRes.data;
  // Usuario autenticado mas sem profile: primeiro acesso (ex: criado no painel
  // do Supabase). Cai no wizard de empresa, que faz upsert em profiles no fim.
  if (!profileRow) redirect('/onboarding/criar-empresa');
  if (!profileRow.company_id) redirect('/onboarding/criar-empresa');
  const companyId = profileRow.company_id;

  const company = (profileRow.company ?? null) as { name: string; status: string } | null;
  if (company?.status === 'suspended') redirect('/conta-suspensa');

  // Valida que o employee pertence a mesma company. Se user trocou de empresa
  // (improvavel), ignora o employee velho.
  const rawEmployee = employeeRes.data;
  const employee = rawEmployee && rawEmployee.company_id === companyId
    ? {
        id: rawEmployee.id,
        status: rawEmployee.status as 'active' | 'inactive' | 'terminated',
        manager_id: rawEmployee.manager_id,
      }
    : null;

  if (employee?.status === 'terminated') {
    await supabase.auth.signOut();
    redirect('/login?error=conta_desligada');
  }

  const role = profileRow.role as Role;

  // Promise.all das 3 queries restantes, agora com cache em memoria em 2
  // delas (gate e isHiringManager). directReports count fica sem cache
  // porque muda com adicao/remocao de colaboradores e tem que ser preciso
  // para decidir a visibilidade do dashboard.
  const [directReportsRes, isHiringManager, gate] = await Promise.all([
    employee?.id
      ? supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('manager_id', employee.id)
      : Promise.resolve({ count: 0 as number | null }),
    employee?.id
      ? memoize(
          `hiringmgr:${companyId}:${employee.id}`,
          60_000,
          () => hasOpenJobAsHiringManager(companyId, employee.id),
        )
      : Promise.resolve(false),
    memoize(
      `gate:${user.id}:${role}`,
      30_000,
      () => loadActorGate(user.id, role),
    ),
  ]);
  mark('parallel(directReports+hiringManager+gate)');
  mark('TOTAL');

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: {
      id: profileRow.id,
      role,
      company_id: companyId,
      full_name: profileRow.full_name,
      avatar_url: profileRow.avatar_url,
      company,
    },
    employee,
    isManager: (directReportsRes.count ?? 0) > 0,
    isHiringManager,
    gate,
  };
});

// Adapter para callsites que precisam do Actor (canDo, hasAdminPower, etc).
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
