---
name: Projeto evoluteam
description: SaaS B2B Next.js para gestão de pessoas — estado atualizado do brainstorm e próximos passos
type: project
originSessionId: b1a397aa-47d0-4b3f-95c2-041bf38034a0
---
evoluteam é um SaaS B2B multi-tenant em Next.js para empresas gerenciarem colaboradores, avaliações de desempenho, feedbacks contínuos, PDIs e dashboards de gestão de pessoas. ICP: empresas de 20–300 colaboradores que hoje usam planilhas.

**Stack confirmada:** Next.js App Router em Railway + Supabase (Auth + Postgres + RLS + Storage) + Resend + Sentry free. UI com shadcn/ui + Geist + Lucide + RHF+Zod + TanStack Table + Recharts + Sonner.

**Estado (2026-04-20):** Brainstorm de produto em andamento. **5 specs commitados em `docs/dev/`**: 00-decisoes-transversais, 01-fase-0-fundacao, 02-ft-1-colaboradores, 03-ft-2-avaliacoes, 04-ft-3-feedbacks. **Nada de código escrito ainda** — só documentação.

**Próximo passo imediato:** brainstorm de **FT-4 (PDI)**. Preview em `docs/dev/HANDOFF.md §3`. Depois FT-5 (Dashboard). Depois scaffold inicial.

**Why:** Para zerar dúvidas antes de começar a implementação e evitar refatoração. Cada feature é spec → review → commit antes do código começar. Ordem linear de dependência: Fase 0 → FT-1 → FT-2 → FT-3 → FT-4 → FT-5 (cada uma depende da anterior).

**How to apply:** Ao retomar em nova sessão, ler primeiro `docs/dev/HANDOFF.md` (tem prompt de retomada + protocolo completo). Não começar implementação antes dos 5 specs estarem prontos. Continuar o brainstorm numerado a partir da **Pergunta 51** (FT-4). Decisões históricas ficam nos próprios specs, não tentar recontá-las de memória.

**Arquivos-chave:**
- `docs/dev/HANDOFF.md` — ponto de retomada
- `docs/dev/00-decisoes-transversais.md` — 17 decisões que valem para tudo
- `features/FT-1.md` a `FT-5.md` — specs originais de produto (fonte para brainstorm de cada feature)
- `.superpowers/brainstorm/*/` — mockups visuais (gitignored); servidor reinicia ao retomar
- `.claude/skills/brainstorming/` — skill usada
