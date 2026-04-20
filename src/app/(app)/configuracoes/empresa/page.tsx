import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentCompany } from '@/features/company/queries';
import { CompanyEditForm } from '@/features/company/components/CompanyEditForm';
import { PageHeader } from '@/components/PageHeader';

export default async function EmpresaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const company = await getCurrentCompany();
  if (!company) redirect('/onboarding/criar-empresa');

  return (
    <div>
      <PageHeader title="Empresa" description="Edite os dados da sua empresa." />
      <CompanyEditForm
        defaultValues={{
          name: company.name,
          cnpj: company.cnpj ?? '',
          segment: company.segment as Parameters<typeof CompanyEditForm>[0]['defaultValues']['segment'],
          teamSize: company.team_size as Parameters<typeof CompanyEditForm>[0]['defaultValues']['teamSize'],
        }}
      />
    </div>
  );
}
