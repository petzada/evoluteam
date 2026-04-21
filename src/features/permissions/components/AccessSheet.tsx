'use client';

import {
  Sheet, SheetContent, SheetTitle, SheetDescription, SheetHeader,
} from '@/components/ui/sheet';
import { AccessForm } from './AccessForm';
import type { RhPermissions, Role } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  fullName: string;
  email: string;
  initialRole: Role;
  initialPermissions: RhPermissions;
  currentActorRole: Role;
  currentActorCanInvites: boolean;
}

export function AccessSheet({
  open, onOpenChange, profileId, fullName, email,
  initialRole, initialPermissions,
  currentActorRole, currentActorCanInvites,
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
          initialPermissions={initialPermissions}
          currentActorRole={currentActorRole}
          currentActorCanInvites={currentActorCanInvites}
          onSuccess={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
