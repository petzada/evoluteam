Feature 3 — Feedbacks contínuos
11.1. Objetivo

Permitir que colaboradores, gestores e RH registrem feedbacks durante o ano, criando histórico útil para avaliações e desenvolvimento.

11.2. Escopo do MVP

Entra no MVP:

enviar feedback;
listar feedbacks recebidos;
listar feedbacks enviados;
vincular feedback a colaborador;
vincular feedback a competência;
definir tipo de feedback;
definir visibilidade simples;
mostrar feedbacks no perfil do colaborador.

Não entra no MVP 1.0:

mural público da empresa;
reações e comentários em feedback;
anonimato;
campanhas de reconhecimento;
badges/gamificação;
moderação avançada.
11.3. Tipos de feedback
elogio
reconhecimento
ponto_de_melhoria
orientacao
observacao_privada
11.4. Visibilidade
privado
visivel_para_gestor
visivel_para_rh

No MVP, eu evitaria “público para toda a empresa”, porque isso adiciona complexidade de cultura, moderação e privacidade.

11.5. User stories

Users should be able to enviar feedback para outro colaborador.

Users should be able to escolher o tipo de feedback.

Users should be able to escrever a mensagem do feedback.

Users should be able to vincular feedback a uma competência.

Users should be able to definir a visibilidade do feedback.

Users should be able to visualizar feedbacks recebidos.

Users should be able to visualizar feedbacks enviados.

Gestores should be able to visualizar feedbacks permitidos dos seus liderados.

RH should be able to visualizar feedbacks permitidos da empresa.

Users with permission should be able to visualizar feedbacks no perfil do colaborador.

Users with permission should be able to usar feedbacks como contexto em uma avaliação.

11.6. Critérios de aceite
Usuário consegue enviar feedback.
Destinatário consegue visualizar feedback recebido.
Feedback respeita regras de visibilidade.
Gestor não visualiza feedback privado sem permissão.
RH visualiza apenas feedbacks com visibilidade permitida.
Feedback aparece no perfil do colaborador.
Feedback pode ser filtrado por competência e período.
11.7. Entidades principais
feedbacks
feedback_visibility
competencies
11.8. Rotas principais
/feedbacks
/feedbacks/novo
/colaboradores/[id]/feedbacks