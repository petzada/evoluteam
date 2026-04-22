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
import { getDisabledGrantPermissionKeys } from '../permissions';
import {
  EMPTY_SCREEN_PERMISSIONS,
  type Role,
  type ScreenPermissions,
  type ScreenPermissionKey,
} from '../types';
import { RoleCards } from './RoleCards';
import { ScreenPermissionsToggles } from './ScreenPermissionsToggles';

interface Props {
  profileId: string;
  initialRole: Role;
  initialScreenPermissions: ScreenPermissions;
  currentActorRole: Role;
  /**
   * Quando true, o actor e Administrador (role='admin_rh') — concede qualquer
   * role. Quando false, o actor e Colaborador com colaboradores.edit — so
   * pode mexer em outros Colaboradores, sem escalar.
   */
  actorIsAdmin: boolean;
  /**
   * Se actorIsAdmin=false, passar os proprios toggles para limitar a escalacao
   * (o actor so concede subset dos proprios).
   */
  actorScreenPermissions?: ScreenPermissions;
  onSuccess?: () => void;
}

export function AccessForm({
  profileId, initialRole, initialScreenPermissions,
  currentActorRole: _currentActorRole, actorIsAdmin, actorScreenPermissions,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const [permissions, setPermissions] = useState<ScreenPermissions>(initialScreenPermissions);
  const [confirmAdmin, setConfirmAdmin] = useState(false);
  const [pending, startTransition] = useTransition();

  // Se actor nao e Admin, so pode conceder 'user'. Os outros roles ficam
  // desabilitados com tooltip.
  const disabledRoles: Role[] = actorIsAdmin ? [] : ['admin_rh', 'director'];

  // Escalacao restrita: actor nao-admin so concede permissoes que ele proprio
  // tem marcadas. Toggles nao possuidos aparecem desabilitados.
  const disabledPermissionKeys: ScreenPermissionKey[] = (() => {
    if (actorIsAdmin) return [];
    return getDisabledGrantPermissionKeys(actorScreenPermissions);
  })();

  const dirty =
    role !== initialRole
    || (role === 'user' && (
      permissionsDiffer(permissions, initialScreenPermissions)
    ));

  async function submit() {
    startTransition(async () => {
      const r = await updateUserAccess({
        profileId,
        newRole: role,
        newScreenPermissions: role === 'user' ? permissions : undefined,
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

      {role === 'user' && (
        <ScreenPermissionsToggles
          value={permissions}
          onChange={setPermissions}
          disabledKeys={disabledPermissionKeys}
          disabledReason="Voce nao tem este acesso para conceder."
          title="Permissoes deste colaborador"
        />
      )}

      {role === 'director' && (
        <RoleDescriptor
          title="Diretor"
          description="Ve tudo em leitura. Comenta em feedbacks, PDIs e resultados de ciclo. Nao edita dados nem configura a empresa."
        />
      )}

      {role === 'admin_rh' && (
        <RoleDescriptor
          title="Administrador"
          description="Acesso total ao sistema, inclusive configuracoes da empresa, gerenciamento de acesso dos demais e auditoria."
        />
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

function RoleDescriptor({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-xs">
      <div className="font-semibold text-sm mb-1">{title}</div>
      <p className="text-muted-foreground leading-snug">{description}</p>
    </div>
  );
}

function permissionsDiffer(a: ScreenPermissions, b: ScreenPermissions): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const ak = k as ScreenPermissionKey;
    if ((a[ak] ?? false) !== (b[ak] ?? false)) return true;
  }
  return false;
}

export { EMPTY_SCREEN_PERMISSIONS };
