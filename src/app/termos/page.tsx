import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'Termos de uso do Evoluteam.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-5 py-12 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-blue-600">
          evoluteam
        </Link>
        <h1 className="mt-10 font-[Georgia,serif] text-4xl">Termos de uso</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-600">
          <p>
            Esta página é um stub público dos termos de uso do Evoluteam. A versão jurídica completa deve detalhar contratação, responsabilidades, disponibilidade, suporte, propriedade intelectual e condições de encerramento.
          </p>
          <p>
            Para dúvidas comerciais ou contratuais, fale com a gente em{' '}
            <a href="mailto:contato@evoluteam.com" className="font-medium text-blue-600">
              contato@evoluteam.com
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
