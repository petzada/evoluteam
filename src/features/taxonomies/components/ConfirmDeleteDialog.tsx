'use client';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Kind = 'department' | 'position';

interface Props {
  open: boolean;
  kind: Kind;
  target: { name: string } | null;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({ open, kind, target, onOpenChange, onConfirm }: Props) {
  const singular = kind === 'department' ? 'departamento' : 'cargo';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar {target?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é permanente — o {singular} será removido para sempre. Não há colaboradores vinculados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>Deletar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
