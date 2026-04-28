'use client';

import {
  Sheet, SheetContent, SheetBody, SheetHeader, SheetTitle, SheetDescription,
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
      <SheetContent side="right" className="w-[440px] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>Gerenciar acesso</SheetTitle>
          <SheetDescription className="text-xs">
            {fullName} · <span className="text-muted-foreground">{email}</span>
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <AccessForm
            profileId={profileId}
            initialRole={initialRole}
            initialScreenPermissions={initialScreenPermissions}
            currentActorRole={currentActorRole}
            actorIsAdmin={actorIsAdmin}
            actorScreenPermissions={actorScreenPermissions}
            onSuccess={() => onOpenChange(false)}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
