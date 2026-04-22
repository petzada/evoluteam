import { getActorContext } from '@/features/auth/context';
import { getCurrentProfile, getCurrentUserEmployee } from '@/features/profile/queries';
import { ProfileForm } from '@/features/profile/components/ProfileForm';
import { PageHeader } from '@/components/PageHeader';

export default async function PerfilPage() {
  const ctx = await getActorContext();

  const profile = await getCurrentProfile();
  if (!profile) {
    // Should not happen — getActorContext would have redirected.
    return null;
  }

  const employee = profile.company_id
    ? await getCurrentUserEmployee(profile.company_id, ctx.user.id)
    : null;

  const employeeWithEmail = employee
    ? { ...employee, email: ctx.user.email ?? '' }
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
