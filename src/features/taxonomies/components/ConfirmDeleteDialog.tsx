'use client';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Kind = 'department' | 'position' | 'competency';

interface Props {
  open: boolean;
  kind: Kind;
  target: { name: string } | null;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}

const SINGULAR: Record<Kind, string> = {
  department: 'departamento',
  position: 'cargo',
  competency: 'competência',
};

const ARTICLE: Record<Kind, string> = {
  department: 'o',
  position: 'o',
  competency: 'a',
};

export function ConfirmDeleteDialog({ open, kind, target, onOpenChange, onConfirm }: Props) {
  const singular = SINGULAR[kind];
  const art = ARTICLE[kind];
  const refNote = kind === 'competency'
    ? 'Não há referências em avaliações, feedbacks ou PDIs.'
    : 'Não há colaboradores vinculados.';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar {target?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é permanente — {art} {singular} será removid{art} para sempre. {refNote}
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
