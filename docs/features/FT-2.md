Feature 2 — Ciclos de avaliação de desempenho
10.1. Objetivo

Permitir que o RH crie, publique e acompanhe ciclos de avaliação de desempenho.

Essa é a principal feature do produto.

10.2. Escopo do MVP

Entra no MVP:

criar ciclo de avaliação;
salvar ciclo como rascunho;
selecionar colaboradores avaliados;
criar formulário personalizado;
usar perguntas de nota e texto;
configurar autoavaliação;
configurar avaliação do gestor;
publicar ciclo;
gerar avaliações pendentes;
responder avaliação;
salvar rascunho;
enviar avaliação;
acompanhar progresso;
visualizar resultado individual.

Não entra no MVP 1.0:

avaliação 360 completa;
anonimato avançado;
calibração de notas;
múltiplas etapas de aprovação;
pesos avançados por pergunta;
templates complexos;
benchmark externo.
10.3. Tipos de avaliação no MVP
autoavaliação
avaliação do gestor

Avaliação por pares pode entrar no MVP 1.5.

10.4. Status do ciclo
rascunho
publicado
em_andamento
encerrado
arquivado
10.5. User stories — criação do ciclo

Admins should be able to criar um ciclo de avaliação.

Admins should be able to definir nome do ciclo.

Admins should be able to definir descrição do ciclo.

Admins should be able to definir período avaliado.

Admins should be able to definir data de início.

Admins should be able to definir prazo final de resposta.

Admins should be able to salvar ciclo como rascunho.

Admins should be able to selecionar colaboradores avaliados.

Admins should be able to selecionar colaboradores por departamento.

Admins should be able to selecionar colaboradores manualmente.

Admins should be able to definir se haverá autoavaliação.

Admins should be able to definir se haverá avaliação do gestor.

Admins should be able to revisar o ciclo antes de publicar.

Admins should be able to publicar o ciclo.

Admins should be able to encerrar o ciclo.

Admins should be able to arquivar ciclos antigos.

10.6. User stories — formulário

Admins should be able to criar perguntas no formulário.

Admins should be able to editar perguntas antes da publicação.

Admins should be able to remover perguntas antes da publicação.

Admins should be able to ordenar perguntas.

Admins should be able to criar perguntas de nota de 1 a 5.

Admins should be able to criar perguntas de texto livre.

Admins should be able to marcar perguntas como obrigatórias.

Admins should be able to agrupar perguntas por competência.

Admins should be able to usar competências padrão da empresa.

10.7. User stories — distribuição

System should be able to gerar uma autoavaliação para cada colaborador avaliado.

System should be able to gerar uma avaliação do gestor para cada colaborador que possui gestor direto.

Admins should be able to visualizar quem avalia quem.

Admins should be able to acompanhar avaliações pendentes.

Admins should be able to acompanhar avaliações concluídas.

Admins should be able to reenviar lembretes de avaliação pendente.

10.8. User stories — resposta

Users should be able to visualizar avaliações pendentes.

Users should be able to abrir uma avaliação pendente.

Users should be able to responder perguntas de nota.

Users should be able to responder perguntas de texto.

Users should be able to salvar respostas como rascunho.

Users should be able to continuar uma avaliação de onde parou.

Users should be able to enviar avaliação finalizada.

Users should be able to visualizar confirmação após envio.

Users should not be able to alterar avaliação enviada, exceto se o RH reabrir.

10.9. User stories — resultados

Users with permission should be able to visualizar resultado individual de um colaborador.

Users with permission should be able to ver média geral do colaborador.

Users with permission should be able to ver média por competência.

Users with permission should be able to comparar autoavaliação com avaliação do gestor.

Users with permission should be able to visualizar comentários recebidos.

Users with permission should be able to identificar pontos fortes.

Users with permission should be able to identificar pontos de melhoria.

Admins should be able to liberar ou ocultar resultado para o colaborador.

10.10. Critérios de aceite
Admin cria ciclo em rascunho.
Admin adiciona perguntas ao formulário.
Admin seleciona colaboradores.
Ao publicar, o sistema gera avaliações pendentes.
Colaborador consegue responder autoavaliação.
Gestor consegue responder avaliação do liderado.
Sistema calcula médias.
RH consegue acompanhar progresso.
Resultado individual é exibido corretamente.
Usuário sem permissão não acessa resultados indevidos.
10.11. Entidades principais
review_cycles
review_cycle_participants
review_forms
review_questions
review_assignments
review_answers
review_results
competencies
10.12. Rotas principais
/avaliacoes
/avaliacoes/nova
/avaliacoes/[cycleId]
/avaliacoes/[cycleId]/editar
/avaliacoes/[cycleId]/responder/[assignmentId]
/avaliacoes/[cycleId]/resultados
/avaliacoes/[cycleId]/resultados/[employeeId]