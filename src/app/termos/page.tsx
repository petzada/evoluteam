import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandWordmark } from '@/components/brand/BrandWordmark';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description:
    'Termos de uso do Evoluteam para clientes B2B, usuários autorizados, gestão de pessoas, avaliações, feedbacks, PDI e recrutamento.',
};

const lastUpdated = '28 de abril de 2026';
const contactEmail = 'marcio@marct.co';

type Section = {
  id: string;
  title: string;
  lead?: string;
  body?: ReactNode;
};

const customerDuties = [
  'informar colaboradores, candidatos e usuários sobre o uso da plataforma e sobre o tratamento de dados pessoais;',
  'definir bases legais, finalidades, prazos de retenção e regras internas para dados inseridos na plataforma;',
  'configurar papéis, permissões e convites de forma compatível com a necessidade de acesso de cada pessoa;',
  'garantir que avaliações, feedbacks, comentários, scorecards e decisões sejam conduzidos de forma lícita, ética, proporcional e não discriminatória;',
  'evitar inserir dados sensíveis, dados excessivos ou informações desnecessárias para a finalidade contratada;',
  'validar relatórios, indicadores e informações exibidas pela plataforma antes de usá-los em decisões de RH ou recrutamento.',
];

const prohibitedUses = [
  'usar o Evoluteam para finalidade ilícita, discriminatória, abusiva, ofensiva ou incompatível com leis trabalhistas e de proteção de dados;',
  'tentar acessar dados de outra empresa, contornar permissões, explorar vulnerabilidades ou prejudicar a disponibilidade do serviço;',
  'inserir malware, automações abusivas, conteúdo ilegal ou material que viole direitos de terceiros;',
  'usar resultados, relatórios ou analytics como única base para decisões relevantes sobre colaboradores ou candidatos;',
  'compartilhar credenciais, permitir acessos não autorizados ou manter contas de pessoas que não deveriam mais acessar a organização.',
];

const evoluteamDuties = [
  'disponibilizar a plataforma conforme o plano contratado e as condições comerciais aplicáveis;',
  'tratar dados de colaboradores e candidatos conforme instruções do cliente controlador e contratos aplicáveis;',
  'adotar medidas razoáveis de segurança, controle de acesso e monitoramento operacional;',
  'prestar suporte pelos canais definidos comercialmente;',
  'comunicar mudanças relevantes no serviço ou em condições que afetem o uso contratado, quando aplicável.',
];

const sections: Section[] = [
  {
    id: 'aceite',
    title: '1. Aceitação e escopo',
    lead:
      'Estes Termos regulam o acesso e o uso do Evoluteam por empresas clientes e por usuários autorizados.',
    body: (
      <>
        <p>
          O Evoluteam é uma plataforma B2B para gestão de pessoas, avaliações de
          desempenho, feedbacks contínuos, planos de desenvolvimento, dashboards e
          processos de recrutamento. Ao contratar, acessar ou usar a plataforma, a
          empresa cliente e seus usuários concordam com estes Termos, com a Política
          de Privacidade e com as condições comerciais aplicáveis.
        </p>
        <p>
          Propostas comerciais, contratos, ordens de serviço, anexos de tratamento
          de dados ou instrumentos equivalentes prevalecem sobre estes Termos quando
          tratarem de forma específica do mesmo tema.
        </p>
      </>
    ),
  },
  {
    id: 'contas',
    title: '2. Contas, organizações e permissões',
    lead:
      'Cada cliente é responsável por administrar sua organização, seus usuários, seus convites e suas permissões internas.',
    body: (
      <p>
        Administradores do cliente podem cadastrar colaboradores, convidar usuários,
        definir papéis, liberar resultados, configurar ciclos, permissões e módulos.
        O cliente deve manter os dados corretos, remover acessos quando necessário e
        orientar seus usuários sobre confidencialidade das credenciais. Atos feitos
        por contas autorizadas poderão ser atribuídos à organização cliente.
      </p>
    ),
  },
  {
    id: 'uso-permitido',
    title: '3. Uso permitido e restrições',
    lead:
      'A plataforma deve ser usada apenas para finalidades legítimas de gestão de pessoas, desenvolvimento, performance e recrutamento.',
    body: (
      <>
        <p>É proibido:</p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {prohibitedUses.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'cliente',
    title: '4. Responsabilidades do cliente',
    lead:
      'O cliente é controlador dos dados de seus colaboradores e candidatos na maioria dos usos da plataforma.',
    body: (
      <>
        <p>Como controlador, o cliente deve:</p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {customerDuties.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'evoluteam',
    title: '5. Responsabilidades do Evoluteam',
    lead:
      'O Evoluteam atua principalmente como operador dos dados inseridos pelo cliente e como controlador de dados próprios de conta, comercial, suporte e segurança.',
    body: (
      <>
        <p>São responsabilidades do Evoluteam:</p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {evoluteamDuties.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'dados',
    title: '6. Dados, conteúdo e propriedade',
    lead:
      'Os dados, registros e conteúdos inseridos pelo cliente continuam pertencendo ao cliente ou aos respectivos titulares, conforme aplicável.',
    body: (
      <>
        <p>
          O cliente concede ao Evoluteam uma licença limitada para hospedar,
          armazenar, processar, transmitir, exibir e usar esses dados apenas na
          medida necessária para prestar o serviço, cumprir contratos, prestar
          suporte, manter segurança e melhorar a plataforma.
        </p>
        <p>
          O Evoluteam pode usar dados agregados, estatísticos ou anonimizados para
          métricas, melhoria do produto e entendimento de uso, desde que esses dados
          não identifiquem clientes, usuários, colaboradores, candidatos ou outros
          titulares.
        </p>
      </>
    ),
  },
  {
    id: 'relatorios',
    title: '7. Relatórios, dashboards e apoio à decisão',
    lead:
      'Relatórios, dashboards, médias, comparativos e scorecards são ferramentas de apoio à decisão.',
    body: (
      <p>
        O Evoluteam pode exibir indicadores, comparações, resultados de avaliações,
        feedbacks, PDIs, métricas de dashboard e informações de processos seletivos.
        Esses recursos dependem dos dados cadastrados pelo cliente e podem exigir
        interpretação humana. O cliente é responsável por validar os resultados e por
        conduzir decisões de desempenho, desenvolvimento, contratação, promoção,
        desligamento ou medidas disciplinares.
      </p>
    ),
  },
  {
    id: 'planos',
    title: '8. Planos, pagamento e suspensão',
    lead:
      'Planos, valores, cobrança, impostos, reajustes, suporte e limites de uso serão definidos na proposta comercial ou contrato aplicável.',
    body: (
      <p>
        O Evoluteam poderá suspender ou limitar o acesso em caso de inadimplência,
        uso indevido, risco de segurança, violação destes Termos ou exigência legal.
        Sempre que razoável, o cliente será comunicado antes de uma suspensão não
        emergencial.
      </p>
    ),
  },
  {
    id: 'propriedade-intelectual',
    title: '9. Propriedade intelectual',
    lead:
      'A plataforma, marca, layout, código, documentação, fluxos, componentes e materiais do Evoluteam são protegidos por direitos de propriedade intelectual.',
    body: (
      <p>
        Estes Termos não transferem ao cliente qualquer direito sobre o software ou
        materiais do Evoluteam, exceto o direito limitado de uso durante a vigência
        contratual. Sugestões, ideias ou feedbacks enviados sobre o produto poderão
        ser usados pelo Evoluteam para melhorar a plataforma, sem obrigação de
        remuneração.
      </p>
    ),
  },
  {
    id: 'confidencialidade',
    title: '10. Confidencialidade e subprocessadores',
    lead:
      'As partes devem proteger informações confidenciais recebidas em razão da contratação.',
    body: (
      <p>
        O Evoluteam poderá usar fornecedores e subprocessadores necessários à
        operação do serviço, como infraestrutura, autenticação, e-mail, suporte,
        monitoramento e segurança. Esses terceiros devem ser contratados com
        obrigações compatíveis com a natureza dos serviços prestados. A lista de
        subprocessadores deve ser mantida em anexo, contrato ou documento próprio.
      </p>
    ),
  },
  {
    id: 'disponibilidade',
    title: '11. Disponibilidade, suporte e alterações',
    lead:
      'Buscamos manter a plataforma disponível e evoluindo, mas o serviço pode passar por manutenções, atualizações e indisponibilidades pontuais.',
    body: (
      <p>
        O Evoluteam pode alterar funcionalidades, interfaces, módulos e regras de
        operação para corrigir falhas, melhorar o produto, aumentar segurança ou
        cumprir exigências legais. Mudanças que afetem materialmente o uso contratado
        serão comunicadas quando aplicável.
      </p>
    ),
  },
  {
    id: 'encerramento',
    title: '12. Encerramento, exportação e exclusão',
    lead:
      'Ao término da contratação, o acesso à plataforma poderá ser encerrado conforme contrato ou proposta comercial.',
    body: (
      <p>
        As regras de exportação, devolução, retenção, anonimização ou exclusão de
        dados do cliente devem seguir o contrato aplicável, a Política de Privacidade
        e a legislação. Após o encerramento, o Evoluteam poderá manter dados por
        prazo necessário para cumprir obrigações legais, auditoria, segurança,
        backups e exercício regular de direitos.
      </p>
    ),
  },
  {
    id: 'responsabilidade',
    title: '13. Limitações de responsabilidade',
    lead:
      'Na máxima extensão permitida pela legislação aplicável, o Evoluteam não será responsável por danos indiretos, lucros cessantes, perda de oportunidade ou decisões tomadas exclusivamente pelo cliente.',
    body: (
      <p>
        O cliente é responsável pela qualidade, legalidade e atualidade dos dados que
        insere, pelas configurações de acesso e pelas decisões de gestão tomadas com
        apoio da plataforma. Nenhuma limitação destes Termos exclui responsabilidade
        que não possa ser limitada por lei.
      </p>
    ),
  },
  {
    id: 'lei-foro',
    title: '14. Lei aplicável, foro e contato',
    lead:
      'Estes Termos são regidos pelas leis da República Federativa do Brasil.',
    body: (
      <>
        <p>
          O foro deverá ser definido em contrato. Como referência inicial, recomenda-se
          São Paulo/SP, salvo regra obrigatória diversa ou escolha específica das
          partes.
        </p>
        <p>
          Para dúvidas comerciais, contratuais ou sobre estes Termos, entre em
          contato pelo e-mail{' '}
          <a href={`mailto:${contactEmail}`} className="font-medium text-brand-coral-deep underline-offset-4 hover:underline">
            {contactEmail}
          </a>
          .
        </p>
      </>
    ),
  },
];

function SectionBlock({ section }: { section: Section }) {
  return (
    <section id={section.id} className="scroll-mt-24 border-t border-slate-200 pt-10">
      <h2 className="font-serif-landing text-2xl font-medium tracking-tight text-slate-950 md:text-3xl">
        {section.title}
      </h2>
      {section.lead ? (
        <p className="mt-3 text-base leading-8 text-slate-700">{section.lead}</p>
      ) : null}
      {section.body ? (
        <div className="mt-5 space-y-5 text-sm leading-7 text-slate-600">{section.body}</div>
      ) : null}
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-10 md:px-10 md:py-14 lg:flex-row lg:gap-14">
        <aside className="lg:sticky lg:top-8 lg:h-fit lg:w-72 lg:shrink-0">
          <Link href="/" className="inline-flex">
            <BrandWordmark size="sm" />
          </Link>
          <div className="mt-8 rounded border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-coral-deep">
              Termos públicos
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Última atualização: {lastUpdated}
            </p>
            <nav aria-label="Seções dos termos" className="mt-6">
              <ul className="space-y-2 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded px-2 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <article className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-5 py-8 shadow-sm md:px-10 md:py-12">
          <p className="text-sm font-medium text-brand-coral-deep">Evoluteam</p>
          <h1 className="mt-4 max-w-3xl font-serif-landing text-4xl font-medium tracking-tight text-slate-950 md:text-5xl">
            Termos de uso
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
            Documento de contratação e uso do Evoluteam por empresas,
            administradores, RH, gestores, colaboradores e demais usuários
            autorizados.
          </p>
          <div className="mt-8 rounded border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
            Estes Termos devem ser interpretados em conjunto com a proposta
            comercial, contrato, anexos aplicáveis e Política de Privacidade.
          </div>

          <div className="mt-12 space-y-12">
            {sections.map((section) => (
              <SectionBlock key={section.id} section={section} />
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
