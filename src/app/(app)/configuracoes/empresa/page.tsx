import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentCompany } from '@/features/company/queries';
import { CompanyEditForm } from '@/features/company/components/CompanyEditForm';

export default async function EmpresaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const company = await getCurrentCompany();
  if (!company) redirect('/onboarding/criar-empresa');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Empresa</h1>
        <p className="text-sm text-muted-foreground">Edite os dados da sua empresa.</p>
      </div>
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
