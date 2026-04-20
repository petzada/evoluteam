---
name: Protocolo de brainstorming do Evoluteam
description: Regras rigorosas de como conduzir brainstorm (pergunta/resposta/visual) que o usuário validou em 50+ iterações
type: feedback
originSessionId: b1a397aa-47d0-4b3f-95c2-041bf38034a0
---
Durante o brainstorm do projeto Evoluteam em `C:\Users\Marcio\Desktop\evoluteam`, o usuário validou (por resposta afirmativa ou pushback corrigido) um protocolo específico que deve ser mantido rigorosamente em todas as próximas features.

**Regras de conduta:**

1. **Uma pergunta por mensagem.** Sem batching de múltiplas perguntas. Numerada sequencialmente (continuar da última — Pergunta 51 na retomada).
2. **Múltipla escolha preferível.** Oferecer 2–3 opções rotuladas (A/B/C).
3. **Recomendação explícita no final da pergunta.** Sempre com rationale técnico concreto (ICP PME, custo de setup, manutenção, consistência, skip-level, etc.).
4. **Quando o usuário pede "repita a pergunta depois",** analisar pros/cons honestamente e depois refazer a pergunta com as mesmas opções formatadas de forma idêntica.
5. **Visual Companion para UI.** Mockup HTML fragmento (sem `<!DOCTYPE>`) com paleta laranja `#f97316`. Decisões embutidas em bloco cinza ao final do mockup. Push de `waiting.html` quando a próxima pergunta for terminal.
6. **Terminal para lógica.** Schema, permissions, fluxos de transição, comparação de abordagens — tudo em tabela ou código.
7. **Ao fim de uma feature, escrever spec completo** em `docs/dev/0X-nome.md` seguindo template canônico (ver specs existentes). Fazer spec self-review antes de commitar.
8. **Commit com mensagem detalhada** padrão `docs(dev): FT-X <slug> spec` listando decisões principais. Evitar caracteres acentuados em mensagem de commit (Windows CRLF/encoding).
9. **Gate de revisão explícito** após commit: "Revise o arquivo e me diga 'Revisado, seguir para FT-Y' ou 'Ajustar X'." Aguardar confirmação antes de iniciar próxima feature.

**Why:** O usuário validou esse ritmo em 50+ perguntas com alta taxa de acerto. Desviar (ex: várias perguntas de uma vez, recomendações sem rationale, pular o gate de revisão) quebra o fluxo que já está funcionando.

**How to apply:** Em qualquer futuro brainstorm no projeto Evoluteam, usar esse protocolo sem exceção. Se for sobre um novo projeto, avaliar se o mesmo protocolo cabe (provavelmente sim para brainstorms de produto completo).
