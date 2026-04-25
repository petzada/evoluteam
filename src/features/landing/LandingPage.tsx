import { ArrowRight, Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  featureBullets,
  flowSteps,
  footerColumns,
  painPoints,
  pricingFeatures,
  trustItems,
} from './content';
import { FaqAccordion } from './components/FaqAccordion';
import { LandingHeader } from './components/LandingHeader';
import { LeadForm } from './components/LeadForm';
import {
  FeedbackMockup,
  HeroProductMockup,
  PdiMockup,
  ReviewMockup,
} from './components/ProductMockups';

const sectionClass = 'mx-auto max-w-[1200px] px-6 py-24 md:px-12 lg:py-[120px]';
const eyebrowClass = 'text-xs font-semibold uppercase tracking-[0.22em] text-blue-600';
const h1Class = 'font-[Georgia,serif] text-5xl font-medium leading-[1.05] tracking-normal text-slate-950 sm:text-6xl lg:text-[76px]';
const h2Class = 'font-[Georgia,serif] text-4xl font-medium leading-[1.12] tracking-normal text-slate-950 sm:text-5xl';
const bodyClass = 'text-base leading-8 text-slate-600 sm:text-lg';

function CtaLink({
  href = '#demo',
  variant = 'dark',
  children,
}: {
  href?: string;
  variant?: 'dark' | 'outline' | 'light';
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded px-7 text-sm font-semibold transition active:scale-[0.99]',
        variant === 'dark' && 'bg-slate-950 text-white hover:bg-slate-800',
        variant === 'outline' && 'border border-slate-300 bg-transparent text-slate-950 hover:bg-slate-100',
        variant === 'light' && 'bg-white text-slate-950 hover:bg-slate-100',
      )}
    >
      {children}
      <ArrowRight className="size-4" />
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
}: {
  eyebrow?: string;
  title: string;
  italic?: string;
  body?: string;
  align?: 'left' | 'center';
  light?: boolean;
}) {
  return (
    <div className={cn(align === 'center' && 'mx-auto max-w-3xl text-center')}>
      {eyebrow ? (
        <p className={cn(eyebrowClass, light && 'text-blue-300')}>{eyebrow}</p>
      ) : null}
      <h2 className={cn(h2Class, eyebrow && 'mt-4', light && 'text-white')}>
        {title}
        {italic ? (
          <>
            {' '}
            <span className={cn('italic text-slate-500', light && 'text-blue-200')}>{italic}</span>
          </>
        ) : null}
      </h2>
      {body ? (
        <p className={cn(bodyClass, 'mt-5', align === 'center' && 'mx-auto max-w-2xl', light && 'text-slate-300')}>
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
          <Minus className={cn('mt-3 size-3 shrink-0 text-blue-600', light && 'text-blue-300')} />
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
          <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-16 text-center md:px-12 lg:pb-20 lg:pt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2">
              <span className="size-2 rounded-full bg-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                Performance · Feedback · Desenvolvimento
              </span>
            </div>

            <h1 className={cn(h1Class, 'mx-auto mt-7 max-w-4xl text-balance')}>
              Avaliar é fácil. <span className="italic text-slate-500">Desenvolver</span> é difícil.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-xl leading-9 text-slate-600">
              O Evoluteam reúne feedback contínuo, ciclo de avaliação e plano de ação em um único fluxo, para que cada nota vire um próximo passo claro.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <CtaLink>Agendar demonstração</CtaLink>
              <CtaLink href="#produto" variant="outline">
                Explorar produto
              </CtaLink>
            </div>

            <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <item.icon className="size-4 text-blue-600" />
                  {item.label}
                </div>
              ))}
            </div>

            <div className="mt-10">
              <HeroProductMockup />
            </div>
          </div>
        </section>

        <section id="produto" className="border-b border-slate-200 bg-white">
          <div className={cn(sectionClass, 'grid gap-16 md:grid-cols-[1fr_0.78fr] md:items-center')}>
            <div className="space-y-10">
              <div>
                <p className={eyebrowClass}>O problema</p>
                <h2 className={cn(h2Class, 'mt-4')}>
                  A planilha é só o sintoma. <span className="italic text-slate-500">O problema é outro.</span>
                </h2>
                <p className={cn(bodyClass, 'mt-5 max-w-2xl')}>
                  Empresas em crescimento já tentaram formulários, documentos soltos e ferramentas grandes demais. No fim do ciclo, as mesmas tensões voltam.
                </p>
              </div>
              <div className="grid gap-8">
                {painPoints.map((point) => (
                  <article key={point.number} className="flex gap-6 border-t border-slate-200 pt-7">
                    <span className="font-[Georgia,serif] text-3xl text-slate-300">{point.number}</span>
                    <div>
                      <h3 className="font-[Georgia,serif] text-2xl leading-tight text-slate-950">
                        {point.title}
                      </h3>
                      <p className="mt-2 text-base leading-7 text-slate-600">{point.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="border-l border-slate-200 py-8 pl-8 md:pl-14">
              <blockquote className="max-w-md font-[Georgia,serif] text-3xl italic leading-[1.35] text-slate-800">
                “A maior parte das avaliações termina em uma planilha arquivada. O Evoluteam existe pra mudar essa última parte.”
              </blockquote>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-b border-slate-200 bg-[#fafafa]">
          <div className={sectionClass}>
            <SectionIntro
              eyebrow="A solução"
              title="Feedback, ciclo e PDI"
              italic="no mesmo fluxo."
              body="Cada peça alimenta a próxima. Nada se perde entre ferramentas, nada vira memória, nada fica sem próximo passo."
              align="center"
            />
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {flowSteps.map((step) => (
                <article
                  key={step.title}
                  className={cn(
                    'relative overflow-hidden rounded border p-8',
                    step.featured
                      ? 'border-slate-900 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-950',
                  )}
                >
                  {step.featured ? (
                    <div className="absolute right-0 top-0 h-28 w-28 -translate-y-14 translate-x-14 rounded-bl-full bg-blue-600/20" />
                  ) : null}
                  <p className={cn('text-xs font-semibold uppercase tracking-[0.22em]', step.featured ? 'text-blue-300' : 'text-slate-500')}>
                    {step.eyebrow}
                  </p>
                  <h3 className="mt-5 font-[Georgia,serif] text-3xl">{step.title}</h3>
                  <p className={cn('mt-4 text-sm leading-7', step.featured ? 'text-slate-300' : 'text-slate-600')}>
                    {step.body}
                  </p>
                </article>
              ))}
            </div>
            <p className="mx-auto mt-12 max-w-2xl text-center font-[Georgia,serif] text-xl italic leading-8 text-slate-500">
              Toda avaliação termina em uma decisão. Nenhuma termina em uma planilha.
            </p>
          </div>
        </section>

        <FeatureSection
          eyebrow="CONTÍNUO"
          title="O contexto do ano,"
          italic="registrado."
          body="Qualquer pessoa registra um feedback em segundos: elogio, ponto de melhoria ou contexto. No ciclo seguinte, tudo aparece ao lado do formulário de avaliação."
          bullets={featureBullets.feedback}
          mockup={<FeedbackMockup />}
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
            <h2 className={cn(h2Class, 'mt-4')}>Por que construímos assim.</h2>
            <div className="mt-8 space-y-6 font-[Georgia,serif] text-xl leading-9 text-slate-700">
              <p>Quase toda empresa que já rodou um ciclo vive o mesmo fim: a pasta com os resultados entra no drive, o time volta ao trabalho, e na avaliação seguinte ninguém se lembra do que foi combinado.</p>
              <p>O problema nunca foi a nota. Foi o que vem depois dela.</p>
              <p>O Evoluteam começou como uma decisão simples: nenhuma avaliação deveria terminar sem um plano. Nenhum plano deveria existir sem o histórico que o originou.</p>
              <p>Você pode continuar usando planilha. Ela só não vai te ajudar na parte que importa.</p>
            </div>
            <div className="mt-9 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                MP
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">Marcio Petigrosso</p>
                <p className="text-sm text-slate-500">Fundador · Evoluteam</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="border-b border-slate-200 bg-[#fafafa]">
          <div className={cn(sectionClass, 'grid gap-14 lg:grid-cols-[320px_1fr]')}>
            <SectionIntro
              eyebrow="Dúvidas comuns"
              title="Perguntas que"
              italic="escutamos muito."
              body="Se a sua pergunta não está aqui, a demo é o melhor lugar pra resposta."
            />
            <FaqAccordion />
          </div>
        </section>

        <section id="planos" className="border-b border-slate-200 bg-white">
          <div className={cn(sectionClass, 'grid gap-16 md:grid-cols-[0.75fr_1fr] md:items-start')}>
            <div className="md:sticky md:top-24">
              <SectionIntro
                eyebrow="Planos"
                title="Um plano."
                italic="Todas as funcionalidades."
                body="Todo cliente acessa a plataforma inteira: ciclo, feedback, PDI e dashboard. A cobrança acompanha o tamanho da empresa, só isso."
              />
              <p className="mt-5 max-w-md text-base leading-8 text-slate-600">
                Conta um pouco sobre a sua operação e a proposta vai para o seu e-mail com o escopo correto.
              </p>
              <div className="mt-8">
                <CtaLink>Solicitar proposta</CtaLink>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-500">
                Mensal ou anual · Nota fiscal emitida · Sem cobrança de implantação
              </p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-8 md:p-10">
              <div className="border-b border-slate-200 pb-8">
                <h3 className="font-[Georgia,serif] text-3xl">Evoluteam</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  A plataforma completa, liberada desde o primeiro dia. Proposta sob consulta, ajustada à dimensão da sua operação.
                </p>
              </div>
              <div className="mt-8 grid gap-5">
                {pricingFeatures.map((feature) => (
                  <article key={feature.title} className="grid gap-3 border-b border-slate-200 pb-5 last:border-0 last:pb-0 sm:grid-cols-[1fr_auto]">
                    <div className="flex gap-3">
                      <feature.icon className={cn('mt-1 size-5 shrink-0 text-blue-600', feature.featured && 'text-slate-950')} />
                      <div>
                        <h4 className="font-[Georgia,serif] text-xl text-slate-950">{feature.title}</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{feature.body}</p>
                      </div>
                    </div>
                    <span className={cn('h-fit rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700', feature.featured && 'border-slate-950 bg-slate-950 text-white')}>
                      {feature.tag}
                    </span>
                  </article>
                ))}
              </div>
              <p className="mt-8 border-t border-slate-200 pt-6 text-sm leading-7 text-slate-600">
                Também incluído: papéis com permissões nativas, isolamento de dados por empresa e log de auditoria.
              </p>
            </div>
          </div>
        </section>

        <section id="demo" className="bg-slate-950">
          <div className={cn(sectionClass, 'grid gap-14 lg:grid-cols-[0.85fr_1fr] lg:items-center')}>
            <div>
              <SectionIntro
                eyebrow="Agendar demonstração"
                title="O próximo ciclo"
                italic="pode terminar diferente."
                body="Uma conversa objetiva: mostramos o produto rodando, entendemos o ciclo atual e alinhamos a proposta. Nenhum compromisso."
                light
              />
              <ul className="mt-9 grid gap-4">
                {[
                  'Demo ao vivo com RH e gestor da sua empresa',
                  'Proposta personalizada depois da conversa',
                  'Plano de implantação para o primeiro ciclo',
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-7 text-slate-300">
                    <Check className="mt-1 size-5 shrink-0 text-blue-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <LeadForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-16 md:grid-cols-4 md:px-12">
          <div className="md:col-span-2">
            <p className="font-[Georgia,serif] text-2xl font-semibold tracking-tight text-slate-950">evoluteam</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              Avaliação de desempenho, feedback contínuo e PDI no mesmo fluxo.
            </p>
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
          <a href="mailto:contato@evoluteam.com" className="hover:text-slate-950">
            contato@evoluteam.com
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
  return (
    <section className={cn('border-b border-slate-200', dark ? 'bg-slate-950' : muted ? 'bg-[#fafafa]' : 'bg-white')}>
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
        <div className={cn(dark && 'rounded-lg border border-white/10 bg-white/5 p-2')}>
          {mockup}
        </div>
      </div>
    </section>
  );
}
