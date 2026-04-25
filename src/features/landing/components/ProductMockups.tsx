import { CheckCircle2, Clock3, MessageSquareText, Send, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function Shell({
  title,
  eyebrow,
  children,
  dark = false,
  className,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-lg border shadow-sm',
        dark ? 'border-white/10 bg-white text-slate-950' : 'border-slate-200 bg-white text-slate-950',
        className,
      )}
    >
      <div className="flex h-10 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-slate-300" />
          <span className="size-2 rounded-full bg-slate-300" />
          <span className="size-2 rounded-full bg-slate-300" />
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
          {eyebrow}
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Evoluteam</p>
            <h3 className="mt-1 font-[Georgia,serif] text-xl text-slate-950">{title}</h3>
          </div>
          <div className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            ativo
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function HeroProductMockup() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <Shell title="Arquitetura do desenvolvimento" eyebrow="produto" className="shadow-none">
        <div className="grid gap-4 lg:grid-cols-[0.68fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:min-h-72">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Ciclo atual
            </p>
            <h4 className="mt-3 font-[Georgia,serif] text-2xl leading-tight">
              Avaliação Q2
            </h4>
            <div className="mt-4 grid gap-2">
              {[
                ['Feedbacks registrados', '18'],
                ['Respostas concluídas', '82%'],
                ['Planos em andamento', '7'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="font-[Georgia,serif] text-xl text-slate-950">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {[
              {
                label: 'CONTÍNUO',
                title: 'Contexto registrado',
                body: 'Feedbacks sobre comunicação, colaboração e entregas aparecem no ciclo.',
              },
              {
                label: 'FORMAL',
                title: 'Síntese com histórico',
                body: 'Gestor responde com dados do período, não só com memória recente.',
              },
              {
                label: 'AÇÃO',
                title: 'Plano acompanhado',
                body: 'A avaliação termina com responsáveis, prazos e próximos passos.',
                active: true,
              },
            ].map((item) => (
              <div
                key={item.title}
                className={cn(
                  'rounded-md border p-3.5',
                  item.active
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-950',
                )}
              >
                <p className={cn('text-[11px] font-semibold tracking-[0.16em]', item.active ? 'text-blue-100' : 'text-blue-600')}>
                  {item.label}
                </p>
                <h5 className="mt-1.5 font-[Georgia,serif] text-xl">{item.title}</h5>
                <p className={cn('mt-1 text-sm leading-6', item.active ? 'text-blue-50' : 'text-slate-600')}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Shell>
    </div>
  );
}

export function FeedbackMockup() {
  return (
    <Shell title="Novo feedback" eyebrow="feedbacks/novo">
      <div className="grid gap-3">
        <div className="grid grid-cols-3 gap-2">
          {['Elogio', 'Melhoria', 'Contexto'].map((item, index) => (
            <div
              key={item}
              className={cn(
                'rounded-md border px-3 py-2 text-center text-xs font-medium',
                index === 1
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600',
              )}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-medium text-slate-500">Mensagem</p>
          <div className="h-20 rounded-md bg-white p-3 text-sm leading-6 text-slate-600">
            Ana conduziu a conversa com clareza e trouxe o time para a decisão.
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
            Competência: Comunicação
          </div>
          <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white">
            <Send className="size-4" />
            Enviar
          </button>
        </div>
      </div>
    </Shell>
  );
}

export function ReviewMockup() {
  return (
    <Shell title="Avaliação com contexto" eyebrow="avaliacoes/responder">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 rounded-full bg-blue-600" />
          </div>
          <p className="mb-2 text-xs font-medium text-slate-500">Pergunta 4 de 8</p>
          <h4 className="font-[Georgia,serif] text-xl leading-tight text-slate-950">
            Como você avalia a clareza de comunicação neste ciclo?
          </h4>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <div
                key={score}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-md border text-sm font-semibold',
                  score === 4
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-500',
                )}
              >
                {score}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
            <MessageSquareText className="size-4 text-blue-600" />
            Contexto do ano
          </div>
          {[
            'Liderou alinhamento entre produto e vendas.',
            'Recebeu melhoria sobre síntese em reuniões.',
            'Documentou decisões críticas do ciclo.',
          ].map((item) => (
            <div key={item} className="mb-2 rounded-md bg-white p-2 text-xs leading-5 text-slate-600">
              {item}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function PdiMockup({ eyebrow = 'plano/id' }: { eyebrow?: string }) {
  return (
    <Shell title="Plano de desenvolvimento" eyebrow={eyebrow} dark>
      <div className="grid gap-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Ana Souza</p>
              <h4 className="mt-1 font-[Georgia,serif] text-xl">Comunicação executiva</h4>
            </div>
            <div className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              em progresso
            </div>
          </div>
        </div>
        {[
          {
            icon: CheckCircle2,
            title: 'Apresentar retrospectiva mensal',
            meta: 'Concluída',
            color: 'text-emerald-600',
          },
          {
            icon: TrendingUp,
            title: 'Praticar síntese em reuniões de liderança',
            meta: '70%',
            color: 'text-blue-600',
          },
          {
            icon: Clock3,
            title: 'Revisar plano com gestor',
            meta: 'próximo mês',
            color: 'text-slate-500',
          },
        ].map((action) => (
          <div
            key={action.title}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-slate-200 bg-white p-3"
          >
            <action.icon className={cn('size-5', action.color)} />
            <span className="text-sm font-medium text-slate-700">{action.title}</span>
            <span className={cn('text-xs font-semibold', action.color)}>{action.meta}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}
