import type { FieldErrors, FieldValues } from 'react-hook-form';
import { toast } from 'sonner';

function findFirstError(errors: FieldErrors): { path: string; message: string } | null {
  const visit = (node: unknown, prefix: string): { path: string; message: string } | null => {
    if (!node || typeof node !== 'object') return null;
    const obj = node as Record<string, unknown> & { message?: unknown; type?: unknown };
    if (typeof obj.message === 'string' && obj.message.length > 0) {
      return { path: prefix, message: obj.message };
    }
    for (const key of Object.keys(obj)) {
      if (key === 'message' || key === 'type' || key === 'ref') continue;
      const child = obj[key];
      const next = visit(child, prefix ? `${prefix}.${key}` : key);
      if (next) return next;
    }
    return null;
  };
  return visit(errors, '');
}

function getValueAtPath(values: unknown, path: string): unknown {
  if (!values || !path) return undefined;
  return path
    .split('.')
    .reduce<unknown>((acc, key) => {
      if (acc === null || typeof acc !== 'object') return undefined;
      return (acc as Record<string, unknown>)[key];
    }, values);
}

function extractMinChars(message: string): number | null {
  const normalized = message.toLocaleLowerCase('pt-BR');
  const hasMinHint = normalized.includes('mínimo')
    || normalized.includes('minimo')
    || normalized.includes('at least');
  if (!hasMinHint) return null;
  const match = normalized.match(/(\d+)/);
  if (!match) return null;
  const min = Number(match[1]);
  return Number.isFinite(min) ? min : null;
}

function withRemainingCharsHint(message: string, fieldValue: unknown): string {
  const minChars = extractMinChars(message);
  if (minChars === null) return message;
  if (typeof fieldValue !== 'string') return message;
  const remaining = minChars - fieldValue.trim().length;
  if (remaining <= 0) return message;
  return `${message} (faltam ${remaining} caractere${remaining === 1 ? '' : 's'}).`;
}

/**
 * Handler para `form.handleSubmit(onValid, onInvalidToast(...))`.
 * Mostra um toast com a primeira mensagem de erro do form, para casos
 * em que o usuário clica em submit e a validação falha silenciosamente.
 *
 * Passe `labels` para traduzir nomes de campo no toast — ex.: `{ name: 'Nome' }`.
 * Passe `getValues` para enriquecer mensagens de mínimo com "faltam N caracteres".
 */
export function onInvalidToast<TValues extends FieldValues>(
  labels?: Partial<Record<keyof TValues & string, string>>,
  getValues?: () => Partial<TValues>,
) {
  return (errors: FieldErrors<TValues>) => {
    const first = findFirstError(errors as FieldErrors);
    if (!first) {
      toast.error('Verifique os campos do formulário.');
      return;
    }

    const values = getValues?.();
    const currentValue = getValueAtPath(values, first.path);
    const decoratedMessage = withRemainingCharsHint(first.message, currentValue);

    const labelMap = labels as Record<string, string> | undefined;
    const label = labelMap?.[first.path];
    toast.error(label ? `${label}: ${decoratedMessage}` : decoratedMessage);
  };
}
