'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Algo deu errado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Não conseguimos carregar esta página. Tente novamente ou volte para o login.
      </p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground">Código: {error.digest}</p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Tentar novamente
        </button>
        <a
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Ir para o login
        </a>
      </div>
    </div>
  );
}
