Como usar as cores no App Shell logado

Aqui é importante. A área logada precisa ser mais funcional que bonita.

Layout geral
Sidebar: #0F172A
Topbar: #FFFFFF
Fundo da aplicação: #F8FAFC
Área de conteúdo: #F8FAFC
Cards: #FFFFFF
Bordas: #E2E8F0
Texto principal: #0F172A
Texto secundário: #64748B
10. Sidebar

Eu faria sidebar escura. Dá cara de sistema B2B robusto.

Sidebar
Background: #0F172A
Texto normal: #CBD5E1
Texto ativo: #FFFFFF
Item ativo bg: #1E3A8A
Item hover: #1E293B
Borda lateral: #1E293B
Logo na sidebar

Se o nome for CicloRH:

Logo/texto: #FFFFFF
Detalhe/acento: #38BDF8 ou #14B8A6
Menu ativo

Use azul:

background: #1E3A8A
icon: #FFFFFF
text: #FFFFFF

Ou teal se quiser mais humano:

background: #0F766E

Minha escolha: azul para navegação principal, teal para ações de sucesso/desenvolvimento.

11. Topbar

A topbar deve ser limpa.

Background: #FFFFFF
Border-bottom: #E2E8F0
Texto: #0F172A
Ícones: #64748B

Elementos:

nome da página;
breadcrumb;
busca;
notificações;
usuário/avatar;
botão principal contextual.

Exemplo:

Colaboradores > João Silva

Botão:

Novo colaborador
Criar ciclo
Nova vaga

CTA no app:

background: #2563EB
hover: #1D4ED8
text: #FFFFFF
12. Área de conteúdo

Use fundo leve:

#F8FAFC

Cards brancos:

#FFFFFF
border #E2E8F0
radius 12px ou 16px
shadow muito suave

Não faça fundo totalmente branco em tudo, porque os cards somem. O contraste entre #F8FAFC e #FFFFFF fica bom.

13. Cards e componentes
Card padrão
Background: #FFFFFF
Border: #E2E8F0
Title: #0F172A
Description: #64748B
Card de KPI

Exemplo:

Colaboradores ativos;
Avaliações pendentes;
PDIs atrasados;
Candidatos em processo.

Use ícones com fundo suave:

Azul claro: #DBEAFE
Teal claro: #CCFBF1
Amarelo claro: #FEF3C7
Vermelho claro: #FEE2E2
14. Status por módulo
Avaliações
Rascunho: #64748B
Em andamento: #2563EB
Concluído: #16A34A
Atrasado: #F59E0B
Encerrado: #0F172A
PDI
Não iniciado: #64748B
Em andamento: #2563EB
Concluído: #16A34A
Atrasado: #DC2626
Cancelado: #94A3B8
Recrutamento
Triagem: #2563EB
Entrevista RH: #7C3AED
Entrevista Gestor: #0F766E
Teste/Case: #F59E0B
Proposta: #EA580C
Contratado: #16A34A
Desistente: #DC2626
Reprovado: #991B1B

Mas cuidado: não deixe Kanban colorido demais. Use cor só em badges, bordas ou pequenos indicadores.

15. Paleta em formato tokens

Se você for passar para Claude Code/Cursor, use assim:

--background: #F8FAFC;
--foreground: #0F172A;

--card: #FFFFFF;
--card-foreground: #0F172A;

--muted: #F1F5F9;
--muted-foreground: #64748B;

--border: #E2E8F0;
--input: #E2E8F0;

--primary: #2563EB;
--primary-hover: #1D4ED8;
--primary-foreground: #FFFFFF;

--secondary: #0F766E;
--secondary-hover: #0D9488;
--secondary-foreground: #FFFFFF;

--accent: #DBEAFE;
--accent-foreground: #1E3A8A;

--success: #16A34A;
--success-bg: #DCFCE7;

--warning: #F59E0B;
--warning-bg: #FEF3C7;

--danger: #DC2626;
--danger-bg: #FEE2E2;

--sidebar: #0F172A;
--sidebar-foreground: #CBD5E1;
--sidebar-active: #1E3A8A;
--sidebar-active-foreground: #FFFFFF;
--sidebar-border: #1E293B;