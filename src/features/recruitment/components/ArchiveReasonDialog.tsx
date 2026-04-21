'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  WITHDRAWAL_REASONS, REJECTION_REASONS,
  WITHDRAWAL_REASON_LABELS, REJECTION_REASON_LABELS,
  type WithdrawalReason, type RejectionReason,
} from '../schema';
import {
  markApplicationWithdrawn,
  markApplicationRejected,
  markApplicationFrozen,
} from '../actions/applications';

export type ArchiveAction = 'withdrawn' | 'rejected' | 'frozen';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ArchiveAction | null;
  applicationId: string | null;
  candidateName: string;
}

const TITLES: Record<ArchiveAction, string> = {
  withdrawn: 'Marcar como desistente',
  rejected: 'Marcar como reprovado',
  frozen: 'Congelar candidatura',
};

export function ArchiveReasonDialog({ open, onOpenChange, action, applicationId, candidateName }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [reasonOther, setReasonOther] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setReason('');
    setReasonOther('');
    setNotes('');
  }

  async function onSubmit() {
    if (!applicationId || !action) return;
    setLoading(true);
    try {
      let result;
      if (action === 'withdrawn') {
        if (!reason) { toast.error('Selecione um motivo.'); return; }
        result = await markApplicationWithdrawn(applicationId, reason as WithdrawalReason, reasonOther || null);
      } else if (action === 'rejected') {
        if (!reason) { toast.error('Selecione um motivo.'); return; }
        result = await markApplicationRejected(applicationId, reason as RejectionReason, reasonOther || null);
      } else {
        if (!notes.trim()) { toast.error('Informe o motivo do congelamento.'); return; }
        result = await markApplicationFrozen(applicationId, notes);
      }
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Candidato atualizado');
      reset();
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!action) return null;

  const isOther = reason === 'outro';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{TITLES[action]}</DialogTitle>
          <DialogDescription>
            Candidato: <b>{candidateName}</b>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {action === 'frozen' ? (
            <div className="space-y-1.5">
              <Label>Motivo (obrigatório)</Label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: indisponível até maio…"
              />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Motivo *</Label>
                {(() => {
                  const items = action === 'withdrawn'
                    ? WITHDRAWAL_REASONS.map((r) => ({ value: r, label: WITHDRAWAL_REASON_LABELS[r] }))
                    : REJECTION_REASONS.map((r) => ({ value: r, label: REJECTION_REASON_LABELS[r] }));
                  return (
                    <Select value={reason} onValueChange={(v) => setReason(v ?? '')} items={items}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {items.map((it) => (
                          <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
              {isOther && (
                <div className="space-y-1.5">
                  <Label>Descreva o motivo *</Label>
                  <Input
                    value={reasonOther}
                    onChange={(e) => setReasonOther(e.target.value)}
                    placeholder="Detalhe o motivo…"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Notas adicionais</Label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? 'Salvando…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
