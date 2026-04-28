import Image from 'next/image';

const HERO_WIDTH = 1295;
const HERO_HEIGHT = 804;
const FEATURE_WIDTH = 1297;
const FEATURE_HEIGHT = 807;

export function HeroProductMockup() {
  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-lg border border-outline-variant bg-white p-2 shadow-sm">
      <Image
        src="/landing/mockups/HeroProductMockup.webp"
        alt="Painel do Evoluteam mostrando arquitetura de desenvolvimento com ciclo atual e cards de Feedback, Ciclo e PDI"
        width={HERO_WIDTH}
        height={HERO_HEIGHT}
        priority
        sizes="(min-width: 1024px) 1024px, 100vw"
        className="h-auto w-full rounded"
      />
    </div>
  );
}

export function FeedbackMockup() {
  return (
    <Image
      src="/landing/mockups/FeedbackMockup.webp"
      alt="Tela de novo feedback do Evoluteam com seleção de tipo, mensagem e vínculo de competência"
      width={FEATURE_WIDTH}
      height={FEATURE_HEIGHT}
      sizes="(min-width: 1024px) 600px, 100vw"
      className="h-auto w-full rounded"
    />
  );
}

export function ReviewMockup() {
  return (
    <Image
      src="/landing/mockups/ReviewMockup.webp"
      alt="Tela de avaliação do Evoluteam mostrando perguntas e contexto histórico do colaborador na lateral"
      width={FEATURE_WIDTH}
      height={FEATURE_HEIGHT}
      sizes="(min-width: 1024px) 600px, 100vw"
      className="h-auto w-full rounded"
    />
  );
}

export function PdiMockup({ eyebrow }: { eyebrow?: string }) {
  void eyebrow;
  return (
    <Image
      src="/landing/mockups/PdiMockup.webp"
      alt="Plano de desenvolvimento individual no Evoluteam com ações, responsáveis, prazos e status"
      width={FEATURE_WIDTH}
      height={FEATURE_HEIGHT}
      sizes="(min-width: 1024px) 600px, 100vw"
      className="h-auto w-full rounded"
    />
  );
}
