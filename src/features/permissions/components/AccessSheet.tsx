'use client';

import {
  Sheet, SheetContent, SheetTitle, SheetDescription, SheetHeader,
} from '@/components/ui/sheet';
import { AccessForm } from './AccessForm';
import type { Role, ScreenPermissions } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  fullName: string;
  email: string;
  initialRole: Role;
  initialScreenPermissions: ScreenPermissions;
  currentActorRole: Role;
  actorIsAdmin: boolean;
  actorScreenPermissions?: ScreenPermissions;
}

export function AccessSheet({
  open, onOpenChange, profileId, fullName, email,
  initialRole, initialScreenPermissions,
  currentActorRole, actorIsAdmin, actorScreenPermissions,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md p-5 pt-6 overflow-y-auto">
        <SheetHeader className="mb-4 px-0">
          <SheetTitle>Gerenciar acesso</SheetTitle>
          <SheetDescription className="text-xs">
            {fullName} · <span className="text-muted-foreground">{email}</span>
          </SheetDescription>
        </SheetHeader>

        <AccessForm
          profileId={profileId}
          initialRole={initialRole}
          initialScreenPermissions={initialScreenPermissions}
          currentActorRole={currentActorRole}
          actorIsAdmin={actorIsAdmin}
          actorScreenPermissions={actorScreenPermissions}
          onSuccess={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
