'use client';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Kind = 'department' | 'position' | 'competency';

interface Props {
  open: boolean;
  kind: Kind;
  target: { name: string; usageCount: number } | null;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}

const SINGULAR: Record<Kind, string> = {
  department: 'departamento',
  position: 'cargo',
  competency: 'competência',
};

function describeUsage(kind: Kind, count: number): string {
  if (kind === 'competency') {
    if (count === 0) {
      return 'Esta competência não aparecerá em novas seleções. Pode ser desarquivada a qualquer momento.';
    }
    return `${count} ${count === 1 ? 'referência existente' : 'referências existentes'} em ciclos, feedbacks ou PDIs permanecerão, mas a competência não aparecerá em novas seleções.`;
  }
  const singular = SINGULAR[kind];
  if (count === 0) {
    return `Este ${singular} não aparecerá em novos cadastros. Pode ser desarquivado a qualquer momento.`;
  }
  return `${count} ${count === 1 ? 'colaborador está' : 'colaboradores estão'} vinculado${count === 1 ? '' : 's'} a este ${singular}. ${count === 1 ? 'Ele continuará' : 'Eles continuarão'} vinculado${count === 1 ? '' : 's'}, mas o ${singular} não aparecerá em novos cadastros.`;
}

export function ConfirmArchiveDialog({ open, kind, target, onOpenChange, onConfirm }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar {target?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {describeUsage(kind, target?.usageCount ?? 0)}
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
