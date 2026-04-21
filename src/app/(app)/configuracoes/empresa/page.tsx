import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentCompany } from '@/features/company/queries';
import { CompanyEditForm } from '@/features/company/components/CompanyEditForm';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { hasAdminPower } from '@/features/permissions/permissions';
import { loadActorRhPermissions } from '@/features/permissions/queries';

export default async function EmpresaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');
  const actorRhPermissions = await loadActorRhPermissions(user.id, profile.role);
  if (!hasAdminPower({ role: profile.role, rhPermissions: actorRhPermissions }, 'can_employees')) {
    redirect('/dashboard');
  }

  const company = await getCurrentCompany();
  if (!company) redirect('/onboarding/criar-empresa');

  return (
    <div>
      <PageHeader title="Empresa" description="Edite os dados da sua empresa." />
      <Card>
        <CardContent>
          <CompanyEditForm
            defaultValues={{
              name: company.name,
              cnpj: company.cnpj ?? '',
              segment: company.segment as Parameters<typeof CompanyEditForm>[0]['defaultValues']['segment'],
              teamSize: company.team_size as Parameters<typeof CompanyEditForm>[0]['defaultValues']['teamSize'],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
