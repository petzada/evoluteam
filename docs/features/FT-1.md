Feature 1 — Gestão de colaboradores e estrutura da empresa
9.1. Objetivo

Permitir que a empresa organize sua base de colaboradores, departamentos, cargos e relações de liderança.

Essa feature é a fundação operacional do produto. Sem colaboradores cadastrados, não existe avaliação, feedback, PDI ou dashboard.

9.2. Escopo do MVP

Entra no MVP:

cadastro manual de colaboradores;
listagem de colaboradores;
edição de colaboradores;
desativação de colaboradores;
departamentos;
cargos;
gestor direto;
filtros básicos;
perfil individual do colaborador.

Não entra no MVP 1.0:

importação CSV;
organograma visual;
histórico completo de movimentações;
integração com folha de pagamento;
múltiplos vínculos por colaborador.
9.3. User stories

Admins should be able to cadastrar colaboradores.

Admins should be able to editar dados de colaboradores.

Admins should be able to desativar colaboradores.

Admins should be able to reativar colaboradores.

Users with permission should be able to listar colaboradores da empresa.

Users with permission should be able to buscar colaboradores por nome ou e-mail.

Users with permission should be able to filtrar colaboradores por departamento.

Users with permission should be able to filtrar colaboradores por cargo.

Users with permission should be able to filtrar colaboradores por status.

Users with permission should be able to filtrar colaboradores por gestor direto.

Admins should be able to criar departamentos.

Admins should be able to editar departamentos.

Admins should be able to arquivar departamentos.

Admins should be able to criar cargos.

Admins should be able to editar cargos.

Admins should be able to arquivar cargos.

Admins should be able to definir o gestor direto de um colaborador.

Users with permission should be able to visualizar o perfil completo de um colaborador.

Gestores should be able to visualizar seus liderados.

Colaboradores should be able to visualizar seu próprio perfil.

9.4. Campos do colaborador
nome
email
telefone opcional
cargo
departamento
gestor direto
data de admissão
status
nível opcional
observações internas opcionais
9.5. Status do colaborador
ativo
inativo
desligado
9.6. Critérios de aceite
Admin consegue criar colaborador.
Admin consegue vincular colaborador a departamento.
Admin consegue vincular colaborador a cargo.
Admin consegue definir gestor direto.
Gestor consegue visualizar apenas seus liderados.
Colaborador consegue visualizar apenas seu próprio perfil.
Colaborador desativado não deve aparecer em novos ciclos por padrão.
Filtros funcionam corretamente na listagem.
9.7. Entidades principais
employees
departments
positions
employee_manager_relations
9.8. Rotas principais
/colaboradores
/colaboradores/novo
/colaboradores/[id]
/configuracoes/departamentos
/configuracoes/cargos