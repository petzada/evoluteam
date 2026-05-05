import { redirect } from 'next/navigation';
import { getCurrentCompany } from '@/features/company/queries';
import { CompanyEditForm } from '@/features/company/components/CompanyEditForm';
import { SetAppTopBar } from '@/features/shell/AppTopBarContext';
import { Card, CardContent } from '@/components/ui/card';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function EmpresaPage() {
  const { profile, gate } = await getActorContext();
  const actorForGate = { role: profile.role, ...gate };
  const canEditCompany = canDo(actorForGate, 'empresa', 'edit');
  const canReadCompany = canDo(actorForGate, 'empresa', 'view');
  if (!canReadCompany) {
    redirect('/dashboard');
  }

  const company = await getCurrentCompany();
  if (!company) redirect('/onboarding/criar-empresa');

  return (
    <div>
      <SetAppTopBar title="Empresa" />
      {!canEditCompany && (
        <p className="mb-4 text-sm text-muted-foreground">
          Visualização somente leitura dos dados da empresa.
        </p>
      )}
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
