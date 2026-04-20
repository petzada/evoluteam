'use client';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Kind = 'department' | 'position';

interface Props {
  open: boolean;
  kind: Kind;
  target: { name: string; employeeCount: number } | null;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmArchiveDialog({ open, kind, target, onOpenChange, onConfirm }: Props) {
  const singular = kind === 'department' ? 'departamento' : 'cargo';
  const n = target?.employeeCount ?? 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar {target?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {n > 0
              ? `${n} ${n === 1 ? 'colaborador está' : 'colaboradores estão'} vinculado${n === 1 ? '' : 's'} a este ${singular}. ${n === 1 ? 'Ele continuará' : 'Eles continuarão'} vinculado${n === 1 ? '' : 's'}, mas o ${singular} não aparecerá em novos cadastros.`
              : `Este ${singular} não aparecerá em novos cadastros. Pode ser desarquivado a qualquer momento.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Arquivar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
