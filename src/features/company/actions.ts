'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';
import { getActor } from '@/features/permissions/actor';
import { canDo } from '@/features/permissions/permissions';
import { SEED_COMPETENCIES } from './schema';

interface CreateCompanyInput {
  company: { name: string; cnpj?: string; segment: string; teamSize: string; logoUrl?: string };
  profile: { fullName: string; positionName: string; departmentName?: string; hireDate: string; phone?: string };
}

export async function createCompany(input: CreateCompanyInput) {
  const serverClient = await createServerSupabaseClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return { error: 'Nao autenticado.' };

  const admin = createAdminSupabaseClient();

  // 1. INSERT company
  const { data: company, error: companyErr } = await admin
    .from('companies')
    .insert({
      name: input.company.name,
      cnpj: input.company.cnpj ?? null,
      segment: input.company.segment,
      team_size: input.company.teamSize,
      logo_url: input.company.logoUrl ?? null,
    })
    .select('id')
    .single();
  if (companyErr || !company) return { error: 'Erro ao criar empresa.' };

  const companyId = company.id;

  // 2. Department (opcional)
  let departmentId: string | null = null;
  if (input.profile.departmentName?.trim()) {
    const { data: dept } = await admin
      .from('departments')
      .insert({ company_id: companyId, name: input.profile.departmentName.trim() })
      .select('id')
      .single();
    departmentId = dept?.id ?? null;
  }

  // 3. Position do admin — unico cargo inicial. Demais cargos ficam a cargo
  // do admin criar em /configuracoes/cargos ou inline no sheet de colaborador.
  const { data: adminPosition } = await admin
    .from('positions')
    .insert({ company_id: companyId, name: input.profile.positionName.trim() })
    .select('id')
    .single();

  // 4. Seed competencies (7)
  await admin
    .from('competencies')
    .insert(SEED_COMPETENCIES.map((name) => ({ company_id: companyId, name })));

  // 5. Employee do admin
  const positionId = adminPosition?.id ?? null;

  const { data: employee, error: empErr } = await admin
    .from('employees')
    .insert({
      company_id: companyId,
      user_id: user.id,
      full_name: input.profile.fullName,
      email: user.email!,
      phone: input.profile.phone ?? null,
      position_id: positionId,
      department_id: departmentId,
      hire_date: input.profile.hireDate,
      status: 'active',
    })
    .select('id')
    .single();
  if (empErr || !employee) return { error: 'Erro ao criar perfil de colaborador.' };

  // 6. Profile (upsert — pode ja existir da criacao no Supabase)
  await admin.from('profiles').upsert({
    id: user.id,
    company_id: companyId,
    role: 'admin_rh',
    full_name: input.profile.fullName,
    phone: input.profile.phone ?? null,
  });

  // 7. Activity log
  await logActivity({
    companyId,
    actorUserId: user.id,
    action: 'company.created',
    entityType: 'company',
    entityId: companyId,
  });

  redirect('/dashboard');
}

export async function updateCompany(data: {
  name: string;
  cnpj?: string;
  segment: string;
  teamSize: string;
}) {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };
  if (!canDo(actor, 'empresa', 'edit')) return { error: 'Sem permissao.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('companies')
    .update({
      name: data.name,
      cnpj: data.cnpj ?? null,
      segment: data.segment,
      team_size: data.teamSize,
      updated_at: new Date().toISOString(),
    })
    .eq('id', actor.companyId);

  if (error) return { error: 'Erro ao salvar.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'company.updated',
    entityType: 'company',
    entityId: actor.companyId,
  });

  revalidatePath('/configuracoes/empresa');
  return { ok: true };
}
