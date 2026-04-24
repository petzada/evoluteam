// Cache em memoria do processo. Valor: TTL curto (30-60s) para dedupear
// queries caras entre requisicoes do mesmo worker sem precisar de Redis.
//
// Quando usar:
// - Resultado muda raramente (permissoes, metadados de usuario).
// - Tolerancia a stale-read dentro do TTL (admin muda permissao, usuario
//   ve a nova depois de ate 30s).
// - Single instance ou multi-instance onde consistencia forte nao e critica.
//
// Quando NAO usar:
// - Dados que mudam a cada request (listas, contadores).
// - Consistencia critica (saldos, estoque).

import 'server-only';

type Entry<T> = { value: T; expiresAt: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, Entry<any>>();

export async function memoize<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const existing = store.get(key) as Entry<T> | undefined;
  if (existing && existing.expiresAt > now) return existing.value;
  const value = await fn();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

// Invalida todas as entradas cujo key comeca com prefix. Use em server
// actions que mutam estado (ex: updateUserAccess -> invalidate(`gate:${userId}`)).
export function invalidate(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

// Util para limpar o cache em testes.
export function clearMemoryCache(): void {
  store.clear();
}
