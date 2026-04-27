import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { AcceptInviteForm } from '@/features/employees/components/AcceptInviteForm';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ConvitePage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminSupabaseClient();

  const { data: invite } = await admin
    .from('invites')
    .select('id, email, role, expires_at, accepted_at, revoked_at, company:companies(name), employee:employees(full_name)')
    .eq('token', token)
    .single();

  if (!invite) {
    return (
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-card text-center space-y-3">
        <h2 className="text-lg font-semibold">Convite inválido</h2>
        <p className="text-sm text-muted-foreground">Este link não é válido. Peça um novo convite ao seu RH.</p>
      </div>
    );
  }

  if (invite.revoked_at) {
    return (
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-card text-center space-y-3">
        <h2 className="text-lg font-semibold">Convite inválido</h2>
        <p className="text-sm text-muted-foreground">Este convite foi revogado. Peça um novo ao seu RH.</p>
      </div>
    );
  }

  if (invite.accepted_at) {
    return (
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-card text-center space-y-3">
        <h2 className="text-lg font-semibold">Convite já utilizado</h2>
        <p className="text-sm text-muted-foreground">Este convite já foi aceito. Entre com seu e-mail e senha.</p>
        <a href="/login" className="text-sm text-primary hover:underline">Ir para o login</a>
      </div>
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-card text-center space-y-3">
        <h2 className="text-lg font-semibold">Convite expirado</h2>
        <p className="text-sm text-muted-foreground">Este convite expirou. Peça ao administrador para reenviar.</p>
      </div>
    );
  }

  const company = invite.company as { name: string } | null;
  const employee = invite.employee as { full_name: string } | null;

  return (
    <AcceptInviteForm
      token={token}
      companyName={company?.name ?? ''}
      prefillName={employee?.full_name ?? ''}
      prefillEmail={invite.email}
    />
  );
}
