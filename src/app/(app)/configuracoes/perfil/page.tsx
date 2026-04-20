import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile, getCurrentUserEmployee } from '@/features/profile/queries';
import { ProfileForm } from '@/features/profile/components/ProfileForm';

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const employee = profile.company_id
    ? await getCurrentUserEmployee(profile.company_id, user.id)
    : null;

  const employeeWithEmail = employee
    ? { ...employee, email: user.email ?? '' }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">Edite suas informações pessoais.</p>
      </div>
      <ProfileForm
        defaultValues={{ fullName: profile.full_name, phone: profile.phone ?? '' }}
        employeeData={employeeWithEmail}
      />
    </div>
  );
}
