import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCandidateById } from '@/features/recruitment/queries/candidates';
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
  if (profile.role !== 'admin_rh') redirect(`/recrutamento/candidatos/${id}`);

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
