import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { getCurrentCompany } from '@/features/company/queries';
import { CompanyEditForm } from '@/features/company/components/CompanyEditForm';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { canDo } from '@/features/permissions/permissions';

export default async function EmpresaPage() {
  const ctx = await getActorContext();
  const actorForGate = { role: ctx.profile.role, ...ctx.gate };
  const canEditCompany = canDo(actorForGate, 'empresa', 'edit');
  const canReadCompany = canDo(actorForGate, 'empresa', 'view');
  if (!canReadCompany) {
    redirect('/dashboard');
  }

  const company = await getCurrentCompany();
  if (!company) redirect('/onboarding/criar-empresa');

  return (
    <div>
      <PageHeader
        title="Empresa"
        description={
          canEditCompany
            ? 'Edite os dados da sua empresa.'
            : 'Visualização somente leitura dos dados da empresa.'
        }
      />
      <Card>
        <CardContent>
          <CompanyEditForm
            defaultValues={{
              name: company.name,
              cnpj: company.cnpj ?? '',
              segment: company.segment as Parameters<typeof CompanyEditForm>[0]['defaultValues']['segment'],
              teamSize: company.team_size as Parameters<typeof CompanyEditForm>[0]['defaultValues']['teamSize'],
            }}
            readOnly={!canEditCompany}
          />
        </CardContent>
      </Card>
    </div>
  );
}
