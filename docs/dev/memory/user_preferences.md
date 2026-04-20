---
name: Preferências do Marcio (dono do Evoluteam)
description: Padrões observados em 50+ decisões — ajuda a antecipar o que ele vai aceitar/recusar
type: user
originSessionId: b1a397aa-47d0-4b3f-95c2-041bf38034a0
---
Marcio é o dono da agência `marct.co` e está construindo o Evoluteam como produto próprio. Tem experiência prática com desenvolvimento e tomada de decisão de produto.

**Preferências técnicas comprovadas:**

- **Simplicidade antes de rigor.** Cortou explicitamente GitHub Actions, Husky, lint-staged, setup de múltiplos ambientes Supabase. Quando uma ferramenta não for indispensável no MVP, perguntar se é pra entrar antes de propor.
- **Pede pros/cons reais quando intuição diverge.** Na pergunta sobre unificar /colaboradores vs separar, pediu "me dê prós e contras antes de eu escolher — e depois repita a pergunta". Honrar esse padrão sempre.
- **Valoriza consistência de UX.** Trocou modal por side sheet em feedbacks quando apontou "o que acha do sheet lateral igual já foi feito em colaborador?". Priorizar reuso de patterns.
- **UI clean sem over-explaining.** Pediu remover aviso "editável apenas pelo admin_rh" da tela de perfil — regras ficam implícitas, copy só informativo essencial.
- **Transparência só quando útil.** Aprovou copy "você pode editar depois em Configurações" no wizard porque reduz ansiedade. Não aprovaria copy redundante.
- **Decisões em cadeia.** Aceita recomendação, mas se uma decisão anterior fica inconsistente com a nova, espera que seja ajustada proativamente (fiz ajuste em Fase 0 quando unificamos /colaboradores na FT-1).
- **Commits por fase.** Cada spec vira 1 commit. Ajustes retroativos a specs anteriores agrupam no mesmo commit da feature que os motivou.

**Contexto de negócio:**

- Cliente modelo tem 4 cargos (Colaborador, Líder/Supervisor, Coordenador, Administrativo/RH) — usar esses como exemplo em vez de abstrações genéricas.
- Admin inicial de cada empresa é criado manualmente por ele no Supabase (não há signup público no MVP).
- Domínio do produto: `evolu.team`. Remetente dos e-mails por ora: `marcio@marct.co` (domínio pessoal).
- Paleta: branco + cinza + laranja `#f97316` destaque. Logo placeholder text-only.
- Idioma fixo pt-BR. Timezone fixo America/Sao_Paulo.

**How to apply:** Antes de recomendar qualquer ferramenta/pattern novo, perguntar se vale a pena ou propor o caminho mais simples primeiro. Quando ele pede análise, priorizar honestidade sobre concordar rápido. Sempre oferecer a opção de reaproveitar componentes/patterns existentes.
