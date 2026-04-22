import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadActorRhPermissions } from '@/features/permissions/queries';
import { getCandidateById } from '@/features/recruitment/queries/candidates';
import { canManageCandidates } from '@/features/recruitment/permissions';
import { EditarCandidatoClient } from './EditarCandidatoClient';

type Params = Promise<{ id: string }>;

export default async function EditarCandidatoPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const { data: employeeRow } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  const actorRhPermissions = await loadActorRhPermissions(user.id, profile.role);
  const actor = {
    role: profile.role,
    employeeId: employeeRow?.id ?? null,
    rhPermissions: actorRhPermissions,
  };
  if (!canManageCandidates(actor)) redirect(`/recrutamento/candidatos/${id}`);

  const candidate = await getCandidateById(id);
  if (!candidate) notFound();

  return (
    <EditarCandidatoClient
      initial={{
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        linkedinUrl: candidate.linkedin_url,
        resumeUrl: candidate.resume_url,
        source: candidate.source,
        sourceOther: candidate.source_other,
        notes: candidate.notes,
      }}
    />
  );
}
