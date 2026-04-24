import { notFound, redirect } from 'next/navigation';
import { getCandidateById } from '@/features/recruitment/queries/candidates';
import { canManageCandidates } from '@/features/recruitment/permissions';
import { getActorContext } from '@/features/auth/context';
import { EditarCandidatoClient } from './EditarCandidatoClient';

type Params = Promise<{ id: string }>;

export default async function EditarCandidatoPage({ params }: { params: Params }) {
  const { id } = await params;
  const { profile, employee, gate } = await getActorContext();
  const actor = {
    role: profile.role,
    employeeId: employee?.id ?? null,
    ...gate,
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
