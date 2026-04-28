import { ArrowRight, Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { featureBullets, flowSteps, footerColumns, painPoints, pricingFeatures } from './content';
import { FaqAccordion } from './components/FaqAccordion';
import { LandingHeader } from './components/LandingHeader';
import { LeadForm } from './components/LeadForm';
import { FeedbackMockup, HeroProductMockup, PdiMockup, ReviewMockup } from './components/ProductMockups';

const sectionClass = 'mx-auto max-w-[1200px] px-6 py-24 md:px-12 lg:py-[120px]';
const eyebrowClass = 'text-xs font-semibold uppercase tracking-[0.22em] text-primary';
const bodyClass = 'text-base leading-8 text-slate-600 sm:text-lg';
const serifH1 = 'font-serif-landing text-[48px] font-medium leading-[1.1] tracking-[-0.02em] text-slate-950';
const serifH2 = 'font-serif-landing text-[32px] font-medium leading-tight text-slate-950 sm:leading-[1.2]';

function CtaLink({
  href = '#demo',
  variant = 'dark',
  showArrow = false,
  children,
}: {
  href?: string;
  variant?: 'dark' | 'outline' | 'light';
  showArrow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded px-7 text-sm font-semibold transition active:scale-[0.99]',
        variant === 'dark' && 'bg-[#0a0a0a] text-white hover:bg-neutral-800',
        variant === 'outline' && 'border border-slate-300 bg-transparent text-slate-950 hover:bg-slate-100',
        variant === 'light' && 'bg-white text-slate-950 hover:bg-slate-100',
      )}
    >
      {children}
      {showArrow ? <ArrowRight className="size-4" /> : null}
    </a>
  );
}

function SectionIntro({
  eyebrow,
  title,
  italic,
  body,
  align = 'left',
  light = false,
  asH1 = false,
}: {
  eyebrow?: string;
  title: string;
  italic?: string;
  body?: string;
  align?: 'left' | 'center';
  light?: boolean;
  asH1?: boolean;
}) {
  const TitleTag = asH1 ? 'h1' : 'h2';
  return (
    <div className={cn(align === 'center' && 'mx-auto max-w-3xl text-center')}>
      {eyebrow ? (
        <p className={cn(eyebrowClass, light && 'text-[#F09469]')}>{eyebrow}</p>
      ) : null}
      <TitleTag
        className={cn(serifH2, eyebrow && 'mt-4', light && 'text-white', asH1 && 'text-[48px] font-medium leading-[1.1] tracking-[-0.02em]')}
      >
        {title}
        {italic ? (
          <>
            {' '}
            <span className={cn('italic text-slate-500', light && 'text-[#FCC9B0]')}>{italic}</span>
          </>
        ) : null}
      </TitleTag>
      {body ? (
        <p
          className={cn(
            bodyClass,
            'mt-5',
            align === 'center' && 'mx-auto max-w-2xl',
            light && 'text-slate-300',
          )}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}

function BulletList({ items, light = false }: { items: string[]; light?: boolean }) {
  return (
    <ul className="mt-8 grid gap-3">
      {items.map((item) => (
        <li key={item} className={cn('flex gap-3 text-sm leading-7 text-slate-600', light && 'text-slate-300')}>
          <Minus className={cn('mt-3 size-3 shrink-0 text-primary', light && 'text-[#F09469]')} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fcf8f8] text-slate-950">
      <LandingHeader />

      <main>
        <section className="border-b border-slate-200 bg-[#fcf8f8]">
          <div className="mx-auto max-w-[1200px] px-6 py-16 text-center md:px-12 lg:px-12 lg:py-[120px]">
            <h1 className={cn(serifH1, 'mx-auto max-w-4xl text-balance')}>
              Avaliar é fácil. <span className="italic text-slate-500">Desenvolver</span> é difícil.
            </h1>
            <p className="font-serif-landing mx-auto mt-6 max-w-2xl text-balance text-2xl font-normal leading-[1.4] text-slate-600">
              O Evoluteam reúne feedback contínuo, ciclo de avaliação e plano de ação em um único fluxo, para que cada nota vire um próximo passo claro.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <CtaLink showArrow>Agendar demonstração</CtaLink>
              <CtaLink showArrow href="#produto" variant="outline">
                Explorar produto
              </CtaLink>
            </div>

            <div className="mt-10">
              <HeroProductMockup />
            </div>
          </div>
        </section>

        <section id="produto" className="border-t border-outline-variant border-b border-slate-200 bg-white">
          <div className={cn(sectionClass, 'grid gap-16 md:grid-cols-2 md:items-center')}>
            <div className="space-y-10">
              <div>
                <h2 className={cn(serifH2, 'text-slate-950')}>
                  A planilha é só o sintoma. <span className="italic text-slate-500">O problema é outro.</span>
                </h2>
                <p className={cn(bodyClass, 'mt-5 max-w-2xl')}>
                  Empresas em crescimento já tentaram formulários, documentos soltos e ferramentas grandes demais. No fim do ciclo, as mesmas
                  tensões voltam.
                </p>
              </div>
              <div className="grid gap-8">
                {painPoints.map((point) => (
                  <article key={point.number} className="flex gap-6 border-t border-slate-200 pt-7">
                    <span className="font-serif-landing text-[32px] font-medium text-[#c4c7c8]">{point.number}</span>
                    <div>
                      <h3 className="font-serif-landing text-[32px] font-medium leading-tight text-slate-950">{point.title}</h3>
                      <p className="mt-2 text-lg leading-[1.6] text-on-surface-variant">{point.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="border-l border-outline-variant py-8 pl-8 md:pl-16">
              <blockquote className="font-serif-landing max-w-md text-2xl font-normal italic leading-[1.4] text-slate-800">
                “A maior parte das avaliações termina em uma planilha arquivada. O Evoluteam existe pra mudar essa última parte.”
              </blockquote>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-t border-outline-variant border-b border-slate-200 bg-white">
          <div className={sectionClass}>
            <SectionIntro
              title="Feedback, ciclo e PDI"
              italic="no mesmo fluxo."
              body="Cada peça alimenta a próxima. Nada se perde entre ferramentas, nada vira memória, nada fica sem próximo passo."
              align="center"
            />
            <div className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
              {flowSteps.map((step) => (
                <article
                  key={step.title}
                  className={cn(
                    'relative overflow-hidden rounded-lg border p-8',
                    step.featured
                      ? 'border-[#333] bg-[#0a0a0a] text-white'
                      : 'border-outline-variant bg-white text-slate-950',
                  )}
                >
                  {step.featured ? (
                    <div className="absolute right-0 top-0 h-32 w-32 -translate-y-16 translate-x-16 rounded-bl-full bg-primary opacity-10" />
                  ) : null}
                  <p
                    className={cn(
                      'text-xs font-semibold uppercase tracking-widest',
                      step.featured ? 'text-[#F09469]' : 'text-slate-500',
                    )}
                  >
                    {step.eyebrow}
                  </p>
                  <h3 className="mt-5 font-serif-landing text-[32px] font-medium leading-tight">{step.title}</h3>
                  <p className={cn('mt-4 text-base leading-[1.5]', step.featured ? 'text-neutral-400' : 'text-slate-600')}>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <FeatureSection
          eyebrow="CONTÍNUO"
          title="O contexto do ano,"
          italic="registrado."
          body="Qualquer pessoa registra um feedback em segundos: elogio, ponto de melhoria ou contexto. No ciclo seguinte, tudo aparece ao lado do formulário de avaliação."
          bullets={featureBullets.feedback}
          mockup={<FeedbackMockup />}
          muted
        />

        <FeatureSection
          eyebrow="FORMAL"
          title="Avaliação com"
          italic="histórico do lado."
          body="Quando o gestor abre o formulário, tudo que foi registrado no ano aparece na lateral. Autoavaliação e avaliação do gestor seguem no mesmo fluxo, com contexto."
          bullets={featureBullets.reviews}
          mockup={<ReviewMockup />}
          reversed
          muted
        />

        <FeatureSection
          eyebrow="AÇÃO"
          title="Toda avaliação termina"
          italic="em uma decisão."
          body="A partir do resultado, o gestor cria um PDI com ações concretas, prazos e acompanhamento. A nota vira plano; o ciclo fecha com uma próxima ação."
          bullets={featureBullets.pdi}
          mockup={<PdiMockup eyebrow="pdi/id" />}
          dark
        />

        <section id="fundador" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-6 py-24 md:px-12 lg:py-[120px]">
            <p className={eyebrowClass}>Carta do fundador</p>
            <h2 className={cn(serifH2, 'mt-4')}>Por que construímos assim.</h2>
            <div className="mt-8 space-y-6 font-serif-landing text-lg leading-[1.7] text-slate-700">
              <p>
                <span className="italic text-slate-800">
                  Quase toda empresa que já rodou um ciclo vive o mesmo fim:
                </span>{' '}
                a pasta com os resultados entra no drive, o time volta ao trabalho, e na avaliação seguinte ninguém se lembra do que foi
                combinado.
              </p>
              <p>O problema nunca foi a nota. Foi o que vem depois dela.</p>
              <p>
                O Evoluteam começou como uma decisão simples: nenhuma avaliação deveria terminar sem um plano. Nenhum plano deveria existir
                sem o histórico que o originou.
              </p>
              <p>Você pode continuar usando planilha. Ela só não vai te ajudar na parte que importa.</p>
            </div>
            <div className="mt-9">
              <p className="font-serif-landing text-2xl font-normal italic text-slate-950">Marcio Petigrosso</p>
              <p className="mt-1 text-sm text-slate-500">Fundador · Evoluteam</p>
            </div>
          </div>
        </section>

        <section id="faq" className="border-b border-slate-200 bg-white">
          <div className={cn(sectionClass, 'grid gap-14 lg:grid-cols-[320px_1fr]')}>
            <SectionIntro
              eyebrow="Dúvidas comuns"
              title="Perguntas que escutamos muito"
              body="Caso ainda fique alguma dúvida, entre em contato com nosso suporte."
            />
            <FaqAccordion />
          </div>
        </section>

        <section id="planos" className="border-b border-slate-200 bg-white">
          <div className={cn(sectionClass, 'grid gap-16 md:grid-cols-2 md:items-start')}>
            <div>
              <h1 className={serifH1}>
                Um plano. <span className="italic text-slate-500">Todas as funcionalidades.</span>
              </h1>
              <p className={cn(bodyClass, 'mt-5 max-w-md')}>
                Todo cliente acessa a plataforma inteira: ciclo, feedback, PDI e dashboard. A cobrança acompanha o tamanho da empresa, só
                isso.
              </p>
              <div className="mt-8">
                <CtaLink href="#demo" showArrow={false}>
                  Solicitar proposta
                </CtaLink>
              </div>
            </div>
            <div className="rounded-lg border border-outline-variant bg-white p-8 md:p-12">
              <div className="border-b border-outline-variant pb-8">
                <h3 className="font-serif-landing text-2xl font-medium text-slate-950 sm:text-3xl">Plano Enterprise</h3>
                <p className="mt-2 text-base leading-7 text-slate-600">Preço sob consulta, ajustado à dimensão da sua operação.</p>
              </div>
              <ul className="mt-8 space-y-4">
                {pricingFeatures.map((feature) => (
                  <li key={feature.title} className="flex gap-3 text-base text-slate-950">
                    <Check className="mt-0.5 size-5 shrink-0 text-slate-900" />
                    <span>{feature.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="demo" className="bg-slate-950">
          <div className={cn(sectionClass, 'grid gap-14 lg:grid-cols-[0.85fr_1fr] lg:items-center')}>
            <div>
              <SectionIntro
                light
                title="O próximo ciclo pode terminar diferente."
                body="Uma conversa objetiva: mostramos o produto rodando, entendemos o ciclo atual e alinhamos a proposta. Nenhum compromisso."
              />
              <ul className="mt-9 grid gap-4">
                {[
                  'Demo ao vivo com RH e gestor da sua empresa',
                  'Proposta personalizada depois da conversa',
                  'Plano de implantação para o primeiro ciclo',
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-7 text-slate-300">
                    <Check className="mt-1 size-5 shrink-0 text-[#F09469]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <LeadForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-16 md:grid-cols-4 md:px-12">
          <div className="md:col-span-2">
            <p className="font-serif-landing text-2xl font-bold tracking-tighter text-slate-950">evoluteam</p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-slate-950">{column.title}</h3>
              <ul className="mt-3 grid gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-slate-500 transition hover:text-slate-950">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 border-t border-slate-200 px-6 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-12">
          <p>© 2026 Evoluteam · Todos os direitos reservados</p>
          <a href="mailto:marcio@marct.co" className="hover:text-slate-950">
            marcio@marct.co
          </a>
        </div>
      </footer>
    </div>
  );
}

function FeatureSection({
  eyebrow,
  title,
  italic,
  body,
  bullets,
  mockup,
  reversed = false,
  muted = false,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  italic: string;
  body: string;
  bullets: string[];
  mockup: React.ReactNode;
  reversed?: boolean;
  muted?: boolean;
  dark?: boolean;
}) {
  const bgClass = dark ? 'bg-[#0a0a0a]' : muted ? 'bg-[#fafafa]' : 'bg-white';

  return (
    <section className={cn('border-b border-slate-200', bgClass)}>
      <div
        className={cn(
          sectionClass,
          'grid gap-14 lg:grid-cols-2 lg:items-center',
          reversed && 'lg:[&>*:first-child]:order-2',
        )}
      >
        <div>
          <SectionIntro eyebrow={eyebrow} title={title} italic={italic} body={body} light={dark} />
          <BulletList items={bullets} light={dark} />
        </div>
        {dark ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">{mockup}</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-outline-variant bg-white p-2 shadow-sm">{mockup}</div>
        )}
      </div>
    </section>
  );
}
