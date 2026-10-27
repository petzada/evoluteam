# Evoluteam

![Status](https://img.shields.io/badge/status-pausado-lightgrey) ![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)

SaaS B2B de **gestão de pessoas**: avaliações de desempenho, feedbacks contínuos e PDIs em um só lugar, para pequenas e médias empresas largarem as planilhas de RH.

## Índice

- [Status do projeto](#status-do-projeto)
- [Demonstração](#demonstração)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos e instalação](#pré-requisitos-e-instalação)
- [Como utilizar](#como-utilizar)
- [Testes](#testes)
- [Contribuição](#contribuição)
- [Licença](#licença)
- [Autor e contato](#autor-e-contato)

## Status do projeto

⏸️ **Pausado**: o MVP foi construído e o desenvolvimento está parado desde maio de 2026.

## Demonstração

Pensado para empresas de 20 a 300 colaboradores. Principais módulos:

- **Estrutura organizacional**: empresa, unidades, áreas, cargos e taxonomias.
- **Colaboradores**: cadastro, convites por e-mail e controle de acesso por papel e permissões.
- **Ciclos de avaliação**: autoavaliação e avaliação do gestor, com lembretes por e-mail e resultados individuais.
- **Feedbacks contínuos** entre colegas e gestores.
- **PDI** (Plano de Desenvolvimento Individual) gerado a partir dos resultados.
- **Recrutamento** e **atividades** recentes.
- **Dashboard** com indicadores de gestão de pessoas.
- **Notificações**, central de **ajuda** em MDX e **landing page** com formulário de contato comercial.

## Tecnologias utilizadas

- **Next.js 16** + **React 19** + **TypeScript**
- **Supabase** (Postgres + Auth)
- **Tailwind CSS 4** + **shadcn/ui**, TanStack Table, Recharts, dnd-kit
- **React Hook Form** + **Zod**
- **Resend** + **React Email** (e-mails transacionais)
- **Vitest** + Testing Library
- **Railway** (hospedagem)

## Pré-requisitos e instalação

**Pré-requisitos**

- **Node.js 20** ou superior e **pnpm 10**
- Projeto no **Supabase** e conta no **Resend**

**Instalação**

```bash
git clone https://github.com/petzada/evoluteam.git
cd evoluteam
pnpm install
cp .env.example .env.local
```

Preencha no `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` e `NEXT_PUBLIC_SITE_URL`. Aplique as migrations de `supabase/migrations/` no seu projeto Supabase.

## Como utilizar

```bash
pnpm dev              # http://localhost:3000
pnpm mock:demo        # cria uma empresa de demonstração com dados fictícios
pnpm email:dev        # prévia dos templates de e-mail em http://localhost:3001
pnpm build && pnpm start
```

## Testes

```bash
pnpm test:run         # Vitest uma vez
pnpm test:ui          # interface do Vitest
pnpm lint
```

Os testes cobrem schemas de validação, regras de permissão, consultas e templates de e-mail.

## Contribuição

Contribuições são bem-vindas! Para propor uma melhoria:

1. Abra uma **issue** descrevendo o problema ou a ideia antes de começar algo grande.
2. Faça um **fork** e crie um branch a partir da `main`: `<tipo>/<nome-kebab>` (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`).
3. Use **commits semânticos** em português: `<tipo>(<escopo>): <descrição no imperativo>`.
4. Rode lint e testes antes de enviar (veja [Testes](#testes)).
5. Abra o **Pull Request** em *draft*, explicando o quê e o porquê. O merge é feito pelo autor.

Não inclua segredos (`.env`, chaves de API, tokens) em commits ou PRs.

## Licença

Distribuído sob a licença **MIT**, de código aberto. Isso significa que você **pode** usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e até vender cópias do código, inclusive em projetos comerciais, **desde que** mantenha o aviso de copyright e o texto da licença. O software é fornecido "no estado em que se encontra", **sem garantias**, e o autor não se responsabiliza por danos decorrentes do uso.

Texto completo em [`LICENSE`](LICENSE).

## Autor e contato

**Marcio Petigrosso** ("petzada"): idealização e desenvolvimento.

- GitHub: [@petzada](https://github.com/petzada)
- LinkedIn: [in/petigrosso](https://www.linkedin.com/in/petigrosso)
