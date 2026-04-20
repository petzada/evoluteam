14. IA no MVP

Eu colocaria IA como MVP 1.5, não como parte obrigatória do MVP 1.0.

Mas deixaria a arquitetura preparada.

14.1. Features de IA recomendadas

Users with permission should be able to gerar resumo da avaliação de um colaborador.

Users with permission should be able to gerar sugestão de PDI com base na avaliação.

Gestores should be able to gerar rascunho de devolutiva para conversa com o colaborador.

14.2. Dados usados pela IA
respostas da avaliação
notas por competência
comentários abertos
feedbacks recentes
PDI anterior, se existir
cargo
departamento
14.3. Cuidados
IA não deve tomar decisão automática sobre promoção, demissão ou punição.
IA deve gerar sugestão, não conclusão definitiva.
Usuário deve revisar antes de salvar.
Histórico de geração deve ser registrado.
14.4. Entidade recomendada
ai_generations

Campos:

company_id
employee_id
source_type
source_id
prompt_type
input_snapshot
output_text
created_by
created_at
15. Notificações
15.1. Escopo MVP

Entra no MVP:

notificações internas;
avaliação pendente;
feedback recebido;
PDI criado;
ação de PDI próxima do prazo.

E-mail pode entrar no MVP 1.5.

15.2. User stories

Users should be able to receber notificação quando houver avaliação pendente.

Users should be able to receber notificação quando receberem feedback.

Users should be able to receber notificação quando um PDI for criado.

Users should be able to receber notificação quando uma ação de PDI estiver próxima do prazo.

Users should be able to marcar notificação como lida.

Users should be able to visualizar lista de notificações.

15.3. Entidade principal
notifications