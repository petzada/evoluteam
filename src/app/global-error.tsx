'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Error boundary do root: captura erros fora do grupo (app)/.
// Necessario porque error.tsx so cobre o segmento onde vive — sem
// global-error.tsx, falhas em (auth)/, (onboarding)/, /, /privacidade,
// /termos caem no fallback minimo do Next sem nossa identidade visual.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            Algo deu errado
          </h1>
          <p style={{ maxWidth: '28rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Não conseguimos carregar a aplicação. Tente novamente ou volte para o início.
          </p>
          {error.digest ? (
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Código: {error.digest}
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                borderRadius: '0.375rem',
                border: '1px solid #e5e7eb',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Tentar novamente
            </button>
            <Link
              href="/"
              style={{
                borderRadius: '0.375rem',
                background: '#0a0a0a',
                color: '#fafafa',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Ir para o início
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
