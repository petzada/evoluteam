'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { deactivateEmployee, reactivateEmployee, terminateEmployee } from '../actions';
import type { TransferOption } from '../schema';

export type StatusAction = 'deactivate' | 'terminate' | 'reactivate';

interface ManagerCandidate { id: string; full_name: string }

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  action: StatusAction;
  target: { id: string; full_name: string; subordinatesCount: number } | null;
  managerCandidates: ManagerCandidate[];
  onSuccess?: () => void;
}

const COPY: Record<StatusAction, {
  title: (name: string) => string;
  description: string[];
  confirmLabel: string;
  destructive: boolean;
}> = {
  deactivate: {
    title: (n) => `Desativar ${n}?`,
    description: [
      'Não aparecerá em novos ciclos de avaliação.',
      'Pode ser reativado a qualquer momento.',
      'Continua com acesso ao sistema.',
    ],
    confirmLabel: 'Desativar',
    destructive: false,
  },
  terminate: {
    title: (n) => `Desligar ${n}?`,
    description: [
      'Esta ação é permanente.',
      'Perderá acesso imediato (força logout).',
      'Dados históricos são preservados.',
    ],
    confirmLabel: 'Desligar',
    destructive: true,
  },
  reactivate: {
    title: (n) => `Reativar ${n}?`,
    description: [
      'Voltará a aparecer em novos ciclos.',
    ],
    confirmLabel: 'Reativar',
    destructive: false,
  },
};

export function ConfirmStatusDialog({
  open, onOpenChange, action, target, managerCandidates, onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'transfer' | 'null'>('null');
  const [newManagerId, setNewManagerId] = useState<string>('');

  const hasSubordinates = (target?.subordinatesCount ?? 0) > 0;
  const needsTransferChoice = hasSubordinates && (action === 'deactivate' || action === 'terminate');
  const copy = COPY[action];

  function handleOpenChange(next: boolean) {
    if (!next) {
      setMode('null');
      setNewManagerId('');
    }
    onOpenChange(next);
  }

  async function handleConfirm() {
    if (!target) return;
    let transferOption: TransferOption | undefined;
    if (needsTransferChoice) {
      if (mode === 'transfer') {
        if (!newManagerId) {
          toast.error('Escolha um novo gestor ou a opção "sem gestor".');
          return;
        }
        transferOption = { mode: 'transfer', newManagerId };
      } else {
        transferOption = { mode: 'null' };
      }
    }

    setLoading(true);
    const result = action === 'deactivate'
      ? await deactivateEmployee(target.id, transferOption)
      : action === 'terminate'
        ? await terminateEmployee(target.id, transferOption)
        : await reactivateEmployee(target.id);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      action === 'deactivate' ? 'Colaborador desativado.'
        : action === 'terminate' ? 'Colaborador desligado.'
          : 'Colaborador reativado.',
    );
    handleOpenChange(false);
    onSuccess?.();
  }

  const managerItems = [
    { value: '__none__', label: 'Sem gestor (deixar como NULL)' },
    ...managerCandidates
      .filter((m) => m.id !== target?.id)
      .map((m) => ({ value: m.id, label: m.full_name })),
  ];

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{target ? copy.title(target.full_name) : ''}</AlertDialogTitle>
          <AlertDialogDescription>
            {copy.description.join(' ')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {needsTransferChoice && target && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="text-foreground font-medium mb-2">
              {target.full_name} é gestor de {target.subordinatesCount} {target.subordinatesCount === 1 ? 'pessoa' : 'pessoas'}.
            </p>
            <div className="flex flex-col gap-2 mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={mode === 'transfer'}
                  onChange={() => setMode('transfer')}
                  className="h-3.5 w-3.5"
                />
                Transferir para outro gestor
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={mode === 'null'}
                  onChange={() => setMode('null')}
                  className="h-3.5 w-3.5"
                />
                Deixar sem gestor
              </label>
            </div>
            {mode === 'transfer' && (
              <Select
                value={newManagerId || '__none__'}
                onValueChange={(v) => setNewManagerId(v && v !== '__none__' ? v : '')}
                items={managerItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o novo gestor" />
                </SelectTrigger>
                <SelectContent>
                  {managerItems
                    .filter((m) => m.value !== '__none__')
                    .map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant={copy.destructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processando…' : copy.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
