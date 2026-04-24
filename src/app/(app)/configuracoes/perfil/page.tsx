import { getCurrentProfile, getCurrentUserEmployee } from '@/features/profile/queries';
import { ProfileForm } from '@/features/profile/components/ProfileForm';
import { PageHeader } from '@/components/PageHeader';
import { getActorContext } from '@/features/auth/context';

export default async function PerfilPage() {
  const { user } = await getActorContext();
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const employee = profile.company_id
    ? await getCurrentUserEmployee(profile.company_id, user.id)
    : null;

  const employeeWithEmail = employee
    ? { ...employee, email: user.email ?? '' }
    : null;

  return (
    <div>
      <PageHeader title="Meu perfil" description="Edite suas informações pessoais." />
      <ProfileForm
        defaultValues={{ fullName: profile.full_name, phone: profile.phone ?? '' }}
        employeeData={employeeWithEmail}
      />
    </div>
  );
}
