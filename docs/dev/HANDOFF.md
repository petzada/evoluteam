# HANDOFF — Brainstorming Evoluteam

Documento de retomada. Lido por nova sessão para continuar com exatamente a mesma precisão, ritmo e padrão de brainstorming.

**Última pausa:** 2026-04-20, após commit de FT-3.
**Próximo passo:** brainstorm da **FT-4 (PDI — Plano de Desenvolvimento Individual)**.

---

## 1. Para retomar em nova sessão — copie e cole este prompt

> Claude, estou retomando o projeto Evoluteam, um SaaS B2B em Next.js para gestão de pessoas. Pausamos após commit de FT-3.
>
> **Primeiro carregue as memórias** versionadas do projeto:
>
> 1. Leia `docs/dev/memory/MEMORY.md` e os 3 arquivos que ele lista (`project_evoluteam.md`, `feedback_brainstorming_protocol.md`, `user_preferences.md`). Use-os como memória ativa para esta sessão.
> 2. Se o diretório local de memórias do Claude Code neste dispositivo existir e estiver vazio ou desatualizado, ofereça copiar os arquivos de `docs/dev/memory/` para lá (ver `docs/dev/memory/README.md`).
>
> **Depois reconstrua contexto técnico** lendo nesta ordem:
>
> 3. `docs/dev/HANDOFF.md` — este documento (estado, protocolo, próximos passos)
> 4. `docs/dev/00-decisoes-transversais.md` — 17 decisões transversais
> 5. `docs/dev/01-fase-0-fundacao.md` — Fundação (auth, onboarding, multi-tenant)
> 6. `docs/dev/02-ft-1-colaboradores.md` — FT-1
> 7. `docs/dev/03-ft-2-avaliacoes.md` — FT-2 (ciclos de avaliação)
> 8. `docs/dev/04-ft-3-feedbacks.md` — FT-3 (feedbacks contínuos)
> 9. `features/FT-4.md` + `docs/USERS-ABLE.md §10` + `docs/MVP.md §4` + `docs/ESTRUTURA.md §12` (para entender FT-4)
>
> Use a skill **brainstorming** (`/brainstorming`).
> **Ative o Visual Companion** desde o início — confirmarei quando pedir (script em `.claude/skills/brainstorming/scripts/start-server.sh --project-dir <caminho-do-projeto-no-dispositivo-atual>`).
>
> Mantenha **rigorosamente** o protocolo descrito em HANDOFF.md §4 e na memória `feedback_brainstorming_protocol.md`:
> - Uma pergunta por mensagem, numerada
> - Múltipla escolha preferível; recomendação clara com rationale técnico
> - Visual Companion para UI; terminal para lógica/schema
> - Side sheet 440px como padrão de "criar algo"
> - Commits sequenciais conforme plano em HANDOFF.md §5
>
> Continuamos na **pergunta 51** (início do brainstorm FT-4). Quando terminar o brainstorm da FT-4, escreva `docs/dev/05-ft-4-pdi.md` e commit. Depois FT-5 do mesmo jeito, e por último o brainstorm de scaffold/implementação.
>
> Me responda em PT-BR (obrigatório). Começa perguntando se pode invocar o Visual Companion e depois parte para a Pergunta 51.

---

## 2. Estado atual — o que já está commitado

```
45c95c4 docs(dev): FT-3 feedbacks spec
14660e3 docs(dev): FT-2 avaliacoes spec
3af082b docs(dev): unify users/colaboradores model + FT-1 spec
6b8748f docs(dev): transversal decisions and Fase 0 foundation spec
506d656 chore: initial product documentation
```

### Arquivos em `docs/dev/`
| Arquivo | Status | Conteúdo |
|---|---|---|
| `00-decisoes-transversais.md` | ✅ Aprovado | 17 decisões transversais (stack, multi-tenant, papéis, convite, testes, etc.) |
| `01-fase-0-fundacao.md` | ✅ Aprovado (ajustado na FT-1) | Fundação: auth, onboarding wizard 4 passos, `/colaboradores` base, middleware, schema Fase 0, RLS |
| `02-ft-1-colaboradores.md` | ✅ Aprovado | CRUD expandido de `/colaboradores`, perfil `[id]` com 6 tabs, deptos/cargos CRUD, validações de hierarquia |
| `03-ft-2-avaliacoes.md` | ✅ Aprovado | Ciclos de avaliação — wizard 5 passos, formulário, assignments, resposta, resultados |
| `04-ft-3-feedbacks.md` | ✅ Aprovado | Feedbacks contínuos — 5 tipos, 3 visibilidades, `FeedbackSheet` via `EntitySheet` |
| `05-ft-4-pdi.md` | ⏳ Pendente | PDI — próximo alvo do brainstorm |
| `06-ft-5-dashboard.md` | ⏳ Pendente | Dashboard — depois de FT-4 |
| `memory/` | ✅ Versionado | Memórias persistentes do Claude Code (índice + 3 memórias + README de instalação) |

### Decisões confirmadas até agora (51 perguntas respondidas)
Os números aqui são de ordem aproximada do brainstorm — a lista canônica de decisões está em `00-decisoes-transversais.md` e nos specs individuais.

**Bloco transversal (Q1–Q17)**
1. Stack: Next.js (Railway) + Supabase (Auth+Postgres+RLS+Storage) + Resend
2. Multi-tenant: 1 user ↔ 1 empresa
3. Relação user/employee: **C.1** — todo user logado É employee
4. Papéis: `admin_rh / director / user` + gestor derivado de `manager_id`
5. Skip-level: leitura total na árvore, escrita só em liderados diretos
6. Convite: checkbox + email+senha + tabela `invites` + Resend + 7 dias
7. Testes: Vitest + Playwright + ESLint + Prettier (sem Husky/CI)
8. Data access: Supabase Client em todo lugar + `features/{domain}/*`
9. Env: 1 projeto Supabase cloud único
10. Locale: pt-BR hardcoded + UTC/São Paulo
11. Observabilidade: Sentry free
12. Notificações: application code + polling 30s
13. Activity logs: schema + tela em `/configuracoes/auditoria`
14. Seed: departamentos vazios; 4 cargos; 7 competências
15. Identidade: Evoluteam / `evolu.team` / laranja / e-mails de `marcio@marct.co`
16. UI: shadcn/ui + Geist + Lucide + RHF+Zod + TanStack + Recharts + Sonner
17. Billing: nenhum no MVP, signup desativado

**Fase 0 (Q18–Q31)** — wizard 4 passos, 4 telas auth, app shell sidebar escura, /configuracoes/usuarios (depois renomeado para /colaboradores na FT-1), dashboard stub, edit empresa/perfil, schema + RLS, error states.

**FT-1 (Q32–Q38)** — unificação /colaboradores · nível combinado/notas internas só admin_rh · perfil 6 tabs · lista expandida · status semantics · validações de hierarquia · deptos/cargos CRUD.

**FT-2 (Q39–Q47)** — lifecycle 4 status lazy-close · wizard 5 passos · seleção participantes combinável · template padrão · assignments self+manager · resposta single-page auto-save · 4 tabs no detalhe · resultados com gestor como fonte · liberação controlada.

**FT-3 (Q48–Q50)** — 3 abas listagem · `FeedbackSheet` (sidesheet) · 5 tipos · 3 visibilidades com skip-level · imutabilidade após envio.

---

## 3. Próximos blocos

### FT-4 — PDI (próximo)
Referências: `features/FT-4.md`, `docs/USERS-ABLE.md §10`, `docs/MVP.md §4`, `docs/ESTRUTURA.md §12`.

**Questões a explorar (preview — não perguntar tudo de uma vez):**
1. Relação PDI ↔ ciclo de avaliação (obrigatório vincular? opcional?)
2. Status do PDI vs status das ações (dois níveis)
3. UI de criação (side sheet `PdiSheet`? dedicated page?)
4. Ações dentro do PDI — scope (título, descrição, prazo, responsável, status, comentários, evidências)
5. Responsável por ação (auto = colaborador, override manual?)
6. Quem cria PDI (admin_rh? gestor? colaborador?)
7. Quem acompanha status das ações
8. Listagem `/pdi` — abas ou filtros?
9. Integração com resultado de avaliação (botão "Criar PDI com base neste resultado")
10. Aba "PDI" ativa no perfil (era "em breve" em FT-1)
11. Aba "PDI" no ciclo de avaliação (ou `/pdi` independente?)
12. Notificações (criação, ação próxima do prazo, conclusão)
13. Comentários em PDI — who, visibility
14. Evidências/anexos — in/out do MVP?
15. Cancelamento de PDI quando colaborador é desligado
16. Permissions (canViewPdi, canEditPdi)
17. RLS
18. Edge cases

**Alvo final:** `docs/dev/05-ft-4-pdi.md` commitado com `docs(dev): FT-4 PDI spec`.

### FT-5 — Dashboard (depois de FT-4)
Referências: `features/FT-5.md`, `docs/USERS-ABLE.md §12`, `docs/MVP.md §5`, `docs/ESTRUTURA.md §13`.

**Questões a explorar:**
- KPIs exatos (com fórmulas)
- Gráficos (barras, radar de competências)
- Filtros (ciclo, depto, gestor)
- Visões por papel (admin_rh, director, gestor)
- Drill-down
- Substituição completa do stub da Fase 0
- Performance de queries agregadas

**Alvo final:** `docs/dev/06-ft-5-dashboard.md` commitado com `docs(dev): FT-5 dashboard spec`.

### Scaffold / Implementação (depois dos specs)
Depois das 5 features documentadas, próxima fase é brainstorm de **ordem de implementação prática**, setup inicial e primeiro commit de código:
- `docs/dev/07-scaffold-inicial.md` — passo-a-passo do zero ao deploy
- Criar projeto Next.js, setup Supabase, migrations, etc.

---

## 4. Protocolo de brainstorming (mantenha rigorosamente)

### Estilo da pergunta
- **Uma pergunta por mensagem.** Sem batching.
- **Numerada em sequência** (Pergunta 51, 52, ...).
- **Múltipla escolha** quando possível (A, B, C com ≥2 opções).
- **Recomendação explícita** no final com rationale técnico claro.
- **Rationale cita motivos concretos** — ICP PME, custo de setup, manutenção, consistência com decisões anteriores, etc.

### Decisão do formato
- **Terminal** — quando a pergunta é conceitual, tabela, comparação de abordagens, schema, lógica.
- **Visual Companion** — quando a pergunta é sobre layout, mockup, fluxo de UI, hierarquia visual.

### Visual Companion
- Ativar via `scripts/start-server.sh --project-dir` com `run_in_background: true`.
- URL padrão retorna em `.superpowers/brainstorm/*/state/server-info`.
- Arquivo por pergunta com nome semântico (`feedbacks-list.html`, `cycle-detail.html`, etc.).
- Mockup HTML fragmento (sem `<!DOCTYPE>`) com decisões embutidas num bloco cinza ao final.
- Usa paleta laranja `#f97316` + cinzas neutros.
- Quando a pergunta seguinte é terminal, push um `waiting.html` para limpar.

### Padrões de resposta do usuário
O usuário **sempre** responde de forma enxuta (ex: "A", "Seguir", "Concordo", "A + i"). Às vezes pede análise antes de escolher ("O que acha do X? Repita a pergunta depois"). Sempre honre o pedido — quando pede repetir, repita com as opções formatadas identicamente.

### Quando escrever e commitar spec
- Depois de **todas as perguntas** de uma feature estarem respondidas.
- Escrever `docs/dev/0X-nome.md` com estrutura padrão (ver specs anteriores como template):
  1. Objetivo · 2. Escopo (in/out) · 3. User stories · 4. Rotas · 5. Schema + migrations · 6. RLS policies · 7. Componentes/telas · 8. Permissions · 9. Notifications · 10. Error states · 11. Critérios de aceite · 12. Plano de implementação · 13. Não-funcionais · 14. Referências
- Fazer **spec self-review** antes de commitar (placeholders, contradições, ambiguidades).
- Commit com mensagem detalhada padrão `docs(dev): FT-X <slug> spec`.
- Após commit, **gate de revisão** — pergunta explicitamente se usuário revisou e aprovou antes de seguir para próxima feature.

### Preferências conhecidas do usuário (resumo)
- **Simplicidade > over-engineering.** Cortou GitHub Actions, Husky, lint-staged, 2 ambientes Supabase.
- **Pede pros/cons honestos antes de decidir** quando intuição dele diverge.
- **Valoriza consistência de UI** — escolheu unificar `/colaboradores` pra reduzir duplicação; preferiu side sheet em vez de modal pra feedback para bater com o padrão.
- **UI clean sem over-explaining.** Pediu remover aviso "editável apenas pelo admin_rh" da UI — regras ficam implícitas.
- **Transparência em copy.** Aprovou wizard com copy "você pode editar depois em Configurações".
- **Commits por etapa.** Cada spec = 1 commit. Ajustes retroativos quando fazem sentido agrupam-se.

---

## 5. Estrutura dos specs — checklist

Copie de `03-ft-2-avaliacoes.md` ou `04-ft-3-feedbacks.md` como template. Seções em ordem:

1. **Cabeçalho** — Pré-requisitos (o que ler antes) + última atualização
2. **Objetivo** — 1 parágrafo
3. **Escopo** — Dentro do MVP 1.0 · Fora do MVP 1.0
4. **User stories** — agrupadas por persona ou bloco funcional
5. **Rotas** — lista com proteção de role
6. **Schema SQL** — migrations com número `YYYYMMDD_NNNN_descr.sql`
7. **RLS policies** — código SQL com comentários
8. **Componentes e telas** — subseções por tela, comportamento detalhado
9. **Permissions** — TypeScript helpers
10. **Notifications** — tabela evento → destinatário → tipo
11. **Error states e edge cases** — tabela de situação → tratamento
12. **Critérios de aceite** — checkbox list
13. **Plano de implementação** — passos numerados
14. **Não-funcionais** — performance, segurança, a11y, observabilidade
15. **Referências** — cross-links

---

## 6. Visual Companion — retomada

O servidor foi iniciado em `http://localhost:61800` (sessão `864-1776649479`) e mockups ficam em `.superpowers/brainstorm/864-1776649479/content/`. O servidor **desliga após 30 min de inatividade**, então em nova sessão precisa iniciar de novo.

### Para reiniciar o servidor
```bash
bash C:/Users/Marcio/Desktop/evoluteam/.claude/skills/brainstorming/scripts/start-server.sh --project-dir C:/Users/Marcio/Desktop/evoluteam
# com run_in_background: true no Bash tool
# ler C:/Users/Marcio/Desktop/evoluteam/.superpowers/brainstorm/*/state/server-info para URL
```

Mockups anteriores ficam no diretório `content/` — útil pra referência mas não serão servidos (apenas o arquivo mais novo é servido).

---

## 7. Roadmap de alto nível

```
Fase 0 Fundação        ✅ spec commitada
FT-1 Colaboradores     ✅ spec commitada
FT-2 Avaliações        ✅ spec commitada
FT-3 Feedbacks         ✅ spec commitada
FT-4 PDI               ⏳ próximo brainstorm
FT-5 Dashboard         ⏳ depois de FT-4
Scaffold inicial       ⏳ depois dos 5 specs
Implementação real     ⏳ após todos os specs
```

**Tempo médio observado:** ~7–9 perguntas + 1 spec + 1 commit por feature. Usuário responde ~imediato.

---

## 8. Arquivos importantes para não perder

- `docs/dev/*` — todos os specs (versionados em git)
- `docs/dev/memory/*.md` — **memórias persistentes versionadas** (fonte de verdade; ler `docs/dev/memory/README.md` para saber como instalar em novo dispositivo)
- `.superpowers/brainstorm/*/content/*.html` — mockups (gitignored, mas úteis como referência local)
- `CLAUDE.md` — ainda não existe; pode ser criado em sessão futura se quiser contexto automático em toda conversa

---

## 9. Checklist de sanidade ao retomar

- [ ] Git: pull mais recente + verificar que está em `main` limpo
- [ ] Docs: todos os 5 specs em `docs/dev/` lidos
- [ ] Memory: 3 arquivos em `docs/dev/memory/` lidos (ou copiados para o path de auto-load conforme `docs/dev/memory/README.md`)
- [ ] Visual Companion: servidor rodando (se pergunta próxima for UI)
- [ ] Usuário confirmou retomada? Sim → começar pela Pergunta 51 (FT-4)
