# Roteiros de tutoriais — Central de Ajuda

Roteiros guiados para gravação dos vídeos da `/ajuda`. **Os arquivos `.md` deste diretório não são consumidos pela aplicação** — são insumo de produção. Cada roteiro vira um vídeo MP4 que depois é hospedado no Cloudflare R2 e referenciado em `content/help/<slug>.mdx` via `videoUrl`.

Spec do design: [`docs/superpowers/specs/2026-05-07-roteiros-tutoriais-design.md`](../superpowers/specs/2026-05-07-roteiros-tutoriais-design.md).

## Pipeline de produção

1. **Escrever roteiro** em `docs/roteiros/<slug>.md` seguindo o template abaixo.
2. **Gravar vídeo** usando o roteiro como narração + checklist de tela.
3. **Subir MP4** no bucket R2 com key `help/<slug>.mp4` (ver [`docs/help-r2-setup.md`](../help-r2-setup.md)).
4. **Publicar tutorial** criando `content/help/<slug>.mdx` com o `videoUrl` apontando para o R2 e o mesmo `slug` do roteiro.

O slug do roteiro = slug do MDX = key do MP4 no R2. Manter os três alinhados é o que destrava a Central de Ajuda mostrar o vídeo certo na tela certa via filtro `screen`.

## Elenco fixo da empresa demo

Mantenha os mesmos personagens e cenário em todos os vídeos. A continuidade ajuda quem assiste mais de um tutorial a construir um mental model.

**Empresa:** Acme Tecnologia — ~80 colaboradores.

**Estrutura:**

- Unidades: Matriz São Paulo, Filial Recife.
- Departamentos: Tecnologia, Comercial, Pessoas, Financeiro.
- Cargos: Desenvolvedor(a), Analista Comercial, Gerente, Coordenador(a).

**Personagens recorrentes:**

| Personagem | Papel | Aparece em |
|---|---|---|
| **Márcia Rocha** | admin_rh | tour admin + todos os 8 roteiros admin |
| **Carlos Oliveira** | gerente de Tecnologia (5 liderados) | tour gestor + 2 roteiros gestor; recebe avaliação como liderado em alguns admin |
| **Maria Silva** | desenvolvedora liderada por Carlos | protagonista da maioria: cadastrada, responde ciclo, recebe feedback, ganha PDI |
| **Pedro Santos** | candidato | 2 roteiros de recrutamento |

**Cenário recorrente:**

- Ciclo demo: **Avaliação Q2 2026**.
- Vaga demo: **Desenvolvedor(a) Pleno — Tecnologia**.
- Competência fio condutor: **Comunicação** (aparece em formulário, feedback, PDI).
- PDI fio condutor: **"Maria desenvolver Comunicação"**.

**Domínio de e-mail demo:** `@acme-demo.com` (use sempre — nunca exponha e-mails reais na gravação).

## Convenções de tom

- Tratamento **você**.
- Contrações naturais ("pra", "tá", "vou", "dá pra").
- Sempre que possível, explicar o **porquê** da ação além do passo. Ex.: *"atribuo o gestor agora porque é esse vínculo que destrava o PDI compartilhado depois"*.
- Sem gírias datadas ("bora lá", "show", "massa") — público-alvo é RH/Diretor de Pessoas.

## Template do roteiro

```markdown
---
slug: <kebab-case>
persona: admin_rh | gestor | colaborador
duration_estimate: "3–5 min"
related_screens:
  - /rota1
  - /rota2
---

# <Título>

## 🎯 Objetivo
<Uma frase: o que o espectador deve saber fazer ao final.>

## 📋 Pré-requisitos para gravar
<Estado do banco demo necessário antes de apertar REC.>

## 🎬 Abertura (~15s)
**🎙️ Fala**
> "Olá! ..."

## 🎬 Bloco 1 — <título>
**🖥️ Tela**
- ...

**🎙️ Fala**
> "..."

**💡 Observações** *(opcional)*
- ...

## 🎬 Encerramento (~10s)
**🎙️ Fala**
> "..."

## 📝 Notas de gravação
- ...
```

## Catálogo

### Tours
- [`tour-admin-rh.md`](./tour-admin-rh.md) — Visão geral da plataforma para RH (5–7 min)
- [`tour-gestor.md`](./tour-gestor.md) — Visão geral para quem lidera time (3–5 min)
- [`tour-colaborador.md`](./tour-colaborador.md) — Visão geral para colaborador (3–5 min)

### admin_rh
- [`admin-setup-inicial.md`](./admin-setup-inicial.md) — Configuração inicial: empresa, unidades, departamentos, cargos, competências
- [`admin-gerenciar-colaboradores.md`](./admin-gerenciar-colaboradores.md) — Cadastro manual, convite, atribuir gestor/depto/cargo, desativar/reativar/desligar
- [`admin-criar-ciclo-avaliacao.md`](./admin-criar-ciclo-avaliacao.md) — Wizard de 5 passos: criar ciclo + montar formulário
- [`admin-distribuir-acompanhar-ciclo.md`](./admin-distribuir-acompanhar-ciclo.md) — Distribuir avaliadores, lembretes, encerrar/arquivar
- [`admin-resultados-ciclo.md`](./admin-resultados-ciclo.md) — Ler resultados, comparar auto vs gestor, liberar para colaborador
- [`admin-pdi-completo.md`](./admin-pdi-completo.md) — Criar PDI, ações com prazo/responsável, acompanhar
- [`admin-recrutamento-setup-vaga.md`](./admin-recrutamento-setup-vaga.md) — Etapas do funil + criar vaga (com snapshot)
- [`admin-gerenciar-candidatos-vaga.md`](./admin-gerenciar-candidatos-vaga.md) — Cadastrar candidato, kanban, contratar, relatórios

### gestor
- [`gestor-avaliar-e-resultados.md`](./gestor-avaliar-e-resultados.md) — Responder avaliação de liderado + ler resultados do time
- [`gestor-desenvolver-time.md`](./gestor-desenvolver-time.md) — PDI e feedback para o time

### colaborador
- [`colab-completar-perfil.md`](./colab-completar-perfil.md) — Primeiro acesso e perfil
- [`colab-responder-avaliacao.md`](./colab-responder-avaliacao.md) — Responder ciclo (rascunho + envio)
- [`colab-feedback.md`](./colab-feedback.md) — Enviar feedback e ver recebidos/enviados
- [`colab-acompanhar-pdi.md`](./colab-acompanhar-pdi.md) — Atualizar status de ações e comentar
