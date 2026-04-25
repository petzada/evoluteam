import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  MessageSquareText,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

export const navItems = [
  { href: '#produto', label: 'Produto' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#planos', label: 'Planos' },
  { href: '#faq', label: 'FAQ' },
];

export const painPoints = [
  {
    number: '01',
    title: 'Planilhas se perdem.',
    body: 'Cada ciclo vira um arquivo novo em uma pasta nova. O histórico não existe; existe arqueologia.',
  },
  {
    number: '02',
    title: 'Feedback vira memória.',
    body: 'Na hora de avaliar, o gestor lembra do último mês. O ano inteiro fica fora da conversa.',
  },
  {
    number: '03',
    title: 'Nota não vira plano.',
    body: 'O ciclo fecha, o relatório fica bonito, e nada muda. É aqui que o desenvolvimento real morre.',
  },
];

export const flowSteps = [
  {
    eyebrow: 'CONTÍNUO',
    title: 'Feedback',
    body: 'Contexto registrado enquanto o trabalho acontece.',
  },
  {
    eyebrow: 'FORMAL',
    title: 'Ciclo',
    body: 'Avaliação com histórico, formulário e progresso no mesmo lugar.',
  },
  {
    eyebrow: 'AÇÃO',
    title: 'PDI',
    body: 'Cada resultado ganha próximos passos, prazo e acompanhamento.',
    featured: true,
  },
];

export const featureBullets = {
  feedback: [
    'Visibilidade granular: privado, gestor, RH ou público',
    'Vínculo com competência para relatórios',
    'Histórico no perfil do colaborador',
  ],
  reviews: [
    'Wizard de criação em etapas claras',
    'Autoavaliação e gestor, com comparativo automático',
    'Progresso acompanhado pelo RH em tempo real',
  ],
  pdi: [
    'Vinculado à avaliação que originou o plano',
    'Ações com responsável, prazo e status',
    'Colaborador atualiza progresso, gestor acompanha',
  ],
};

export const faqItems = [
  {
    question: 'Serve pra empresa que nunca fez avaliação formal?',
    answer:
      'Sim. O onboarding assume que pode ser o primeiro ciclo: competências, formulários e fluxo sugerido já chegam prontos para o RH adaptar.',
  },
  {
    question: 'E se já usamos Google Forms ou planilhas?',
    answer:
      'A demo parte do que vocês já usam hoje. A diferença é que o histórico deixa de ficar espalhado: feedback, avaliação, resultado e PDI passam a morar no mesmo fluxo.',
  },
  {
    question: 'Como funciona a permissão entre RH, gestor e colaborador?',
    answer:
      'Cada papel acessa apenas o que precisa. RH configura e acompanha ciclos, gestores avaliam seus liderados, colaboradores respondem e acompanham seus próprios registros.',
  },
  {
    question: 'O PDI é obrigatório em todo ciclo?',
    answer:
      'Não precisa ser uma burocracia para todo mundo. A proposta é que resultados relevantes virem plano de ação quando houver algo concreto para desenvolver ou acompanhar.',
  },
  {
    question: 'Os dados dos colaboradores são isolados por empresa?',
    answer:
      'Sim. A aplicação foi desenhada com separação por empresa no banco e nas permissões da plataforma. Um cliente não acessa dados de outro cliente.',
  },
  {
    question: 'Tem avaliação 360, 9-box ou OKR?',
    answer:
      'Não no momento. A versão atual foca em ciclo, feedback e PDI, que são os pilares do problema principal. Essas camadas entram no radar depois que o fluxo-base está sólido.',
  },
  {
    question: 'Como funciona a implantação?',
    answer:
      'Começa com uma conversa curta para mapear o ciclo atual, papéis e competências. Depois configuramos a empresa, importamos a base inicial e acompanhamos o primeiro ciclo.',
  },
];

export type PricingFeature = {
  title: string;
  tag: string;
  body: string;
  icon: LucideIcon;
  featured?: boolean;
};

export const pricingFeatures: PricingFeature[] = [
  {
    title: 'Ciclos de avaliação',
    tag: 'incluso',
    body: 'Criação guiada, formulários customizáveis, autoavaliação, gestor e progresso em tempo real.',
    icon: ClipboardCheck,
  },
  {
    title: 'Resultados comparados',
    tag: 'incluso',
    body: 'Médias por competência e comparação entre percepções, com liberação controlada.',
    icon: BarChart3,
  },
  {
    title: 'Feedback contínuo',
    tag: 'incluso',
    body: 'Registros ao longo do ano com visibilidade granular e contexto na avaliação.',
    icon: MessageSquareText,
  },
  {
    title: 'PDI - Plano de Desenvolvimento',
    tag: 'diferencial',
    body: 'Ações, prazos, responsáveis e acompanhamento vinculados ao resultado.',
    icon: Route,
    featured: true,
  },
  {
    title: 'Dashboard de gestão',
    tag: 'incluso',
    body: 'Indicadores do ciclo, médias por área, planos atrasados e alertas operacionais.',
    icon: Sparkles,
  },
];

export const footerColumns = [
  {
    title: 'Produto',
    links: [
      { href: '#como-funciona', label: 'Como funciona' },
      { href: '#planos', label: 'Planos' },
      { href: '#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { href: '#fundador', label: 'Sobre' },
      { href: 'mailto:contato@evoluteam.com', label: 'Contato' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacidade', label: 'Privacidade' },
      { href: '/termos', label: 'Termos de uso' },
    ],
  },
];

export const trustItems = [
  { icon: ShieldCheck, label: 'Dados separados por empresa' },
  { icon: LockKeyhole, label: 'Permissões por papel' },
  { icon: FileText, label: 'Histórico auditável' },
  { icon: Users, label: 'RH, gestor e colaborador' },
];
