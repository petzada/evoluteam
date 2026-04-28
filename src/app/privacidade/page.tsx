import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandWordmark } from '@/components/brand/BrandWordmark';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description:
    'Política de privacidade do Evoluteam para site, plataforma, colaboradores, candidatos e usuários de clientes B2B.',
};

const lastUpdated = '28 de abril de 2026';
const privacyEmail = 'marcio@marct.co';

type Section = {
  id: string;
  title: string;
  lead?: string;
  body?: ReactNode;
};

const dataCategories = [
  {
    title: 'Leads, site e contatos comerciais',
    body: 'nome, e-mail, telefone, empresa, cargo, mensagem enviada, origem do contato, preferências comerciais, registros de consentimento quando aplicável e informações coletadas por cookies ou tecnologias semelhantes.',
  },
  {
    title: 'Usuários da plataforma',
    body: 'nome, e-mail, telefone, empresa, perfil de acesso, permissões, convites, autenticação, registros de uso, notificações, ações administrativas e logs necessários para segurança e auditoria.',
  },
  {
    title: 'Colaboradores das empresas clientes',
    body: 'nome, e-mail, telefone, cargo, departamento, gestor, data de admissão, status, vínculo com a organização, observações internas e demais informações inseridas pelo cliente.',
  },
  {
    title: 'Performance, feedback e desenvolvimento',
    body: 'ciclos de avaliação, participantes, avaliadores, perguntas, respostas, notas, comentários, feedbacks, regras de visibilidade, resultados liberados, PDIs, ações, prazos, responsáveis e comentários de acompanhamento.',
  },
  {
    title: 'Recrutamento e seleção',
    body: 'dados de candidatos, currículo ou links profissionais, origem da candidatura, vagas, etapas, histórico do processo, feedbacks, scorecards, recomendações, tarefas e resultado de contratação.',
  },
  {
    title: 'Dados técnicos e de segurança',
    body: 'endereço IP, identificadores de dispositivo ou sessão, metadados, eventos de erro, logs de atividade e informações necessárias para prevenir fraude, abuso, acesso indevido ou indisponibilidade.',
  },
];

const legalBases = [
  'execução de contrato ou de procedimentos preliminares relacionados à contratação do Evoluteam;',
  'cumprimento de obrigação legal ou regulatória;',
  'exercício regular de direitos em processos administrativos, judiciais ou arbitrais;',
  'legítimo interesse, respeitados os direitos e liberdades fundamentais dos titulares;',
  'consentimento, quando exigido, especialmente para comunicações de marketing ou cookies não essenciais;',
  'bases legais definidas pelo cliente controlador para dados de colaboradores e candidatos inseridos na plataforma.',
];

const rights = [
  'confirmação da existência de tratamento;',
  'acesso aos dados pessoais;',
  'correção de dados incompletos, inexatos ou desatualizados;',
  'anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;',
  'portabilidade, quando aplicável e regulamentada;',
  'informação sobre compartilhamentos e sobre a possibilidade de não fornecer consentimento;',
  'revogação do consentimento e oposição ao tratamento, quando cabível;',
  'revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais, quando aplicável.',
];

const sections: Section[] = [
  {
    id: 'escopo',
    title: '1. Escopo desta política',
    lead:
      'Esta Política de Privacidade explica como o Evoluteam trata dados pessoais no site, em contatos comerciais e na plataforma B2B de gestão de pessoas.',
    body: (
      <>
        <p>
          A plataforma é usada por empresas clientes para administrar colaboradores,
          avaliações de desempenho, feedbacks contínuos, planos de desenvolvimento,
          dashboards de gestão e processos de recrutamento. Por isso, esta política
          cobre titulares como visitantes do site, leads comerciais, usuários
          administradores, RH, gestores, colaboradores e candidatos.
        </p>
        <p>
          Esta política deve ser lida junto com os Termos de Uso e, quando houver,
          com o contrato firmado entre o Evoluteam e a empresa cliente.
        </p>
      </>
    ),
  },
  {
    id: 'papeis',
    title: '2. Papéis na LGPD',
    lead:
      'Na maior parte do uso da plataforma pelos clientes, a empresa cliente é a controladora dos dados de colaboradores e candidatos.',
    body: (
      <>
        <p>
          A empresa cliente define quais dados serão inseridos, quem terá acesso,
          quais ciclos, avaliações, feedbacks, PDIs e processos seletivos serão
          conduzidos e por quais finalidades. Nesses casos, o Evoluteam atua
          principalmente como operador, tratando dados pessoais conforme as
          instruções documentadas do cliente e os contratos aplicáveis.
        </p>
        <p>
          O Evoluteam atua como controlador em relação aos dados que coleta e usa
          para suas próprias finalidades, como gestão do site, prospecção comercial,
          contratação, faturamento, segurança, suporte, melhoria do produto e
          relacionamento com clientes.
        </p>
      </>
    ),
  },
  {
    id: 'dados',
    title: '3. Dados pessoais que podemos tratar',
    lead:
      'Os dados tratados dependem do uso feito pelo cliente e das funcionalidades contratadas.',
    body: (
      <div className="grid gap-4">
        {dataCategories.map((item) => (
          <div key={item.title} className="border-l-2 border-brand-coral pl-4">
            <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-1 text-sm leading-7 text-slate-600">{item.body}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'finalidades',
    title: '4. Finalidades e bases legais',
    lead:
      'Tratamos dados pessoais para operar a plataforma, prestar suporte, manter a segurança, cumprir contratos e melhorar o serviço.',
    body: (
      <>
        <p>
          As finalidades podem incluir criação e administração de contas, controle
          de permissões, autenticação, convites, registro de colaboradores,
          configuração de ciclos de avaliação, coleta de respostas, organização de
          feedbacks, acompanhamento de PDIs, dashboards, recrutamento, comunicações
          operacionais, suporte, auditoria, prevenção de incidentes e gestão
          comercial.
        </p>
        <p>Conforme o caso, as bases legais podem incluir:</p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {legalBases.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '5. Cookies e tecnologias semelhantes',
    lead:
      'Podemos usar cookies necessários para funcionamento do site e, quando habilitado, cookies de medição, preferências ou marketing.',
    body: (
      <p>
        Cookies essenciais ajudam a manter sessões, segurança e preferências
        técnicas. Cookies não essenciais, quando usados, devem respeitar a LGPD e
        as orientações da ANPD, inclusive com transparência e gestão de consentimento
        quando necessário. A lista de ferramentas e categorias de cookies deve ser
        mantida atualizada em política ou banner próprio.
      </p>
    ),
  },
  {
    id: 'compartilhamento',
    title: '6. Compartilhamento de dados',
    lead:
      'Compartilhamos dados apenas quando necessário para prestar o serviço, cumprir obrigações ou proteger direitos.',
    body: (
      <>
        <p>
          Dados podem ser acessados por usuários autorizados do próprio cliente,
          conforme seus papéis e permissões. Também podemos contratar fornecedores
          de infraestrutura, hospedagem, autenticação, e-mail, suporte, analytics,
          monitoramento e segurança, sempre na medida necessária para operar o
          Evoluteam.
        </p>
        <p>
          Também poderemos compartilhar informações com autoridades públicas,
          reguladores, assessores jurídicos, auditores ou terceiros envolvidos em
          operações societárias, quando houver base legal, obrigação aplicável ou
          necessidade de proteger direitos.
        </p>
      </>
    ),
  },
  {
    id: 'transferencia',
    title: '7. Transferência internacional',
    lead:
      'Alguns provedores necessários à operação do Evoluteam podem estar localizados fora do Brasil ou tratar dados em outros países.',
    body: (
      <p>
        Quando houver transferência internacional de dados pessoais, o Evoluteam
        adotará mecanismos compatíveis com a LGPD e com a regulamentação da ANPD,
        como cláusulas contratuais, garantias adequadas, avaliação de fornecedores
        e outras medidas permitidas pela legislação aplicável.
      </p>
    ),
  },
  {
    id: 'retencao',
    title: '8. Retenção, exportação e descarte',
    lead:
      'Mantemos dados pessoais pelo tempo necessário para cumprir as finalidades desta política, contratos e obrigações legais.',
    body: (
      <>
        <p>
          Dados da plataforma podem ser mantidos durante a vigência do contrato com
          o cliente e por períodos adicionais necessários para auditoria, segurança,
          suporte, backups, exercício regular de direitos ou cumprimento de
          obrigações legais. Ao término do contrato, as regras de exportação,
          devolução, anonimização ou eliminação deverão seguir o contrato aplicável.
        </p>
        <p>
          Solicitações de exclusão feitas por colaboradores ou candidatos podem
          depender de validação com a empresa cliente, quando ela for a controladora
          dos dados.
        </p>
      </>
    ),
  },
  {
    id: 'seguranca',
    title: '9. Segurança da informação',
    lead:
      'Adotamos medidas técnicas e administrativas proporcionais para proteger dados pessoais contra acessos não autorizados e usos indevidos.',
    body: (
      <p>
        Entre as medidas esperadas estão separação lógica por empresa, controle de
        acesso por perfis e permissões, registros de atividade, autenticação,
        monitoramento operacional, restrição de acesso interno e processos de
        resposta a incidentes. Nenhum sistema é absolutamente imune a riscos, mas
        buscamos reduzir riscos de forma compatível com a natureza dos dados tratados.
      </p>
    ),
  },
  {
    id: 'direitos',
    title: '10. Direitos dos titulares',
    lead:
      'Nos termos da LGPD, titulares podem exercer direitos sobre seus dados pessoais, observadas as hipóteses legais aplicáveis.',
    body: (
      <>
        <p>Esses direitos incluem:</p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {rights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5">
          Quando o pedido envolver dados tratados em nome de uma empresa cliente,
          poderemos encaminhar ou coordenar a solicitação com o cliente controlador.
          Para exercer direitos, entre em contato pelo canal indicado nesta política.
        </p>
      </>
    ),
  },
  {
    id: 'relatorios',
    title: '11. Relatórios, analytics e decisões automatizadas',
    lead:
      'Relatórios, dashboards e analytics são ferramentas de apoio e não substituem revisão humana.',
    body: (
      <p>
        O Evoluteam pode apresentar indicadores, médias, comparativos, dashboards,
        relatórios e histórico operacional com base nos dados inseridos pelo cliente.
        Esses recursos devem ser usados como apoio à decisão. Decisões relevantes
        sobre colaboradores, candidatos, desempenho, desenvolvimento, promoção,
        dispensa ou contratação devem ser avaliadas por pessoas autorizadas pelo
        cliente.
      </p>
    ),
  },
  {
    id: 'incidentes',
    title: '12. Incidentes e comunicação',
    lead:
      'Em caso de incidente de segurança envolvendo dados pessoais, adotaremos medidas de contenção, avaliação e comunicação conforme a LGPD e contratos aplicáveis.',
    body: (
      <p>
        Quando o Evoluteam atuar como operador, a comunicação ao cliente controlador
        seguirá os prazos e procedimentos definidos contratualmente. Quando atuar
        como controlador, avaliaremos as obrigações de comunicação aos titulares e
        à ANPD, conforme risco relevante e legislação aplicável.
      </p>
    ),
  },
  {
    id: 'contato',
    title: '13. Contato',
    lead:
      'Para dúvidas sobre privacidade ou exercício de direitos, use o canal abaixo.',
    body: (
      <p>
        E-mail de contato:{' '}
        <a href={`mailto:${privacyEmail}`} className="font-medium text-brand-coral-deep underline-offset-4 hover:underline">
          {privacyEmail}
        </a>
        .
      </p>
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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-10 md:px-10 md:py-14 lg:flex-row lg:gap-14">
        <aside className="lg:sticky lg:top-8 lg:h-fit lg:w-72 lg:shrink-0">
          <Link href="/" className="inline-flex">
            <BrandWordmark size="sm" />
          </Link>
          <div className="mt-8 rounded border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-coral-deep">
              Política pública
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Última atualização: {lastUpdated}
            </p>
            <nav aria-label="Seções da política" className="mt-6">
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
            Política de privacidade
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
            Documento de transparência sobre tratamento de dados pessoais no
            Evoluteam, com foco na LGPD brasileira e no uso B2B por empresas que
            gerenciam dados de colaboradores e candidatos.
          </p>
          <div className="mt-8 rounded border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
            Esta página tem finalidade informativa e deve ser interpretada em
            conjunto com os contratos aplicáveis e a legislação vigente.
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
