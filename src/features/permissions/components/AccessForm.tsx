'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { updateUserAccess } from '../actions';
import { EMPTY_RH_PERMISSIONS, type RhPermissions, type Role } from '../types';
import { RoleCards } from './RoleCards';
import { PermissionsToggles } from './PermissionsToggles';

interface Props {
  profileId: string;
  initialRole: Role;
  initialPermissions: RhPermissions;
  currentActorRole: Role;
  currentActorCanInvites: boolean;
  onSuccess?: () => void;
}

export function AccessForm({
  profileId, initialRole, initialPermissions, currentActorRole, currentActorCanInvites, onSuccess,
}: Props) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const [permissions, setPermissions] = useState<RhPermissions>(initialPermissions);
  const [confirmAdmin, setConfirmAdmin] = useState(false);
  const [pending, startTransition] = useTransition();

  // RH com can_invites so pode manipular roles='user'. Outros roles
  // aparecem desabilitados com tooltip.
  const isRestrictedRh = currentActorRole === 'rh' && currentActorCanInvites;
  const disabledRoles: Role[] = isRestrictedRh ? ['rh', 'admin_rh', 'director'] : [];

  const dirty =
    role !== initialRole
    || (role === 'rh' && (
      (Object.keys(permissions) as (keyof RhPermissions)[]).some(
        (k) => permissions[k] !== initialPermissions[k],
      )
    ));

  async function submit() {
    startTransition(async () => {
      const r = await updateUserAccess({
        profileId,
        newRole: role,
        newPermissions: role === 'rh' ? permissions : undefined,
      });
      if ('error' in r) {
        toast.error(r.error);
        return;
      }
      toast.success('Acesso atualizado.');
      onSuccess?.();
      router.refresh();
    });
  }

  function handleSubmit() {
    // Confirmacao extra se for escalada a admin_rh.
    if (role === 'admin_rh' && initialRole !== 'admin_rh') {
      setConfirmAdmin(true);
      return;
    }
    // Aviso leve se RH ficar sem nenhum toggle.
    if (role === 'rh' && !Object.values(permissions).some(Boolean)) {
      const ok = window.confirm(
        'Este RH nao tera nenhuma permissao alem das de Colaborador. Continuar?',
      );
      if (!ok) return;
    }
    submit();
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Tipo de acesso
        </div>
        <RoleCards
          value={role}
          onChange={setRole}
          disabledRoles={disabledRoles}
          disabledReason="Apenas Administrador pode conceder este acesso."
        />
      </div>

      {role === 'rh' && (
        <div>
          <PermissionsToggles
            value={permissions}
            onChange={setPermissions}
            title="Permissoes deste RH"
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!dirty || pending}
        >
          {pending ? 'Salvando…' : 'Salvar acesso'}
        </Button>
      </div>

      <AlertDialog open={confirmAdmin} onOpenChange={setConfirmAdmin}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promover a Administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta pessoa passara a ter acesso total ao sistema, incluindo convites,
              auditoria e configuracoes da empresa. Tem certeza?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmAdmin(false); submit(); }}>
              Sim, promover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper pra consumidores que preferem nao montar EMPTY_RH_PERMISSIONS.
export { EMPTY_RH_PERMISSIONS };
