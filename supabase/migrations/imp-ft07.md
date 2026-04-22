● Documentos que serviram de base pra implementação completa   do módulo FT-7:                                          
                                                              📚 Specs de desenvolvimento (fonte da verdade da          
  implementação)                                                                                                        
  Em docs/dev/ — criados durante o brainstorm, commitados     antes do código:                                                                                                        Spec: 13-ft-7-fundacao.md                                   Hash: 17f99f6                                               Conteúdo: Arquitetura do módulo, 5 tabelas base, RLS,         sidebar, layout-guard, seeds das 7 etapas                 ────────────────────────────────────────                    Spec: 14-ft-7-onda1-vagas-candidatos.md                     Hash: d7e64dd                                               Conteúdo: CRUD vagas + candidatos, Kanban DnD, aba            Finalizados, saídas laterais, CRUD etapas                 ────────────────────────────────────────                    Spec: 15-ft-7-onda2-feedback-contratacao.md                 Hash: 70869c5                                               Conteúdo: candidate_feedbacks, FeedbackSheet, wizard de       contratação, link bidirecional                            ────────────────────────────────────────                  
  Spec: 16-ft-7-onda3-metricas-scorecard-tarefas.md
  Hash: 6b1e87a
  Conteúdo: candidate_scorecards + candidate_tasks,
  dashboard
    /recrutamento/relatorios

  📘 Documentos transversais do projeto

  - docs/dev/00-decisoes-transversais.md — 17 decisões de   
  stack e convenções que valem pra tudo (Next App Router,   
  Supabase+RLS, shadcn/ui, pt-BR, timezone São Paulo).      
  - docs/dev/01-fase-0-fundacao.md — RLS helpers
  (my_company_id/my_role/my_employee_id), tabelas base      
  (companies, profiles, employees, departments, positions,  
  activity_logs, notifications).
  - docs/dev/02-ft-1-colaboradores.md — estrutura de        
  employees, padrão do EmployeeSheet, permissions matriz,   
  activity_logs pattern.
  - docs/dev/03-ft-2-avaliacoes.md + 04-ft-3-feedbacks.md + 
  05-ft-4-pdi.md + 06-ft-5-dashboard.md — padrões de        
  form/sheet, soft delete, janela de edição, notifications, 
  Recharts.

  📂 Docs de produto (inputs originais do brainstorm)       

  Em docs/features/new-module/ (não commitados, ainda no    
  working tree):

  - PRD-FT-7.md — PRD original do módulo Recrutamento.      
  - FT-7.md — briefing com escopo MVP, etapas padrão, modelo
   mental.
  - FT-7.1.md — Vagas (campos, status).
  - FT-7.2.md — Candidatos (campos, origens).
  - FT-7.3.md — Funil / Kanban (etapas, motivos
  desistência/reprovação).
  - FT-7.4.md — Feedback e scorecard (4 dimensões).
  - FT-7.5.md — Métricas (KPIs, conversão, tempo, origem).  
  - FT-7.6.md — Tarefas.
  - FT-7.7.md — Conversão candidato → colaborador.

  🧠 Memórias (feedback/protocolos persistidos)

  Em ~/.claude/projects/C--Users-Marcio-Desktop-evoluteam/me
  mory/:

  - project_evoluteam.md — estado do projeto e próximos     
  passos.
  - feedback_brainstorming_protocol.md — regras rigorosas do
   brainstorm (1 pergunta/msg, A/B/C, rationale, gate de    
  revisão).
  - feedback_visual_companion.md — regra "toda decisão de   
  UX/UI vai com mockup, sem exceção".
  - feedback_ui_checklist.md — sempre listar
  rota/ação/resultado esperado após implementar.
  - user_preferences.md — simplicidade > rigor, pros/cons   
  reais, consistência de UX.

  🏗️ Código existente consultado como padrão

  Lido durante a implementação pra herdar convenções (não   
  são "docs" mas funcionaram como referência viva):

  - src/features/employees/ — Sheet de 440px, permissions,  
  EmployeeProfile, matriz de roles.
  - src/features/pdi/ — padrão de server actions,
  logActivity, notify, janela de edição.
  - src/features/dashboard/ — Recharts, DashboardFilters com
   Select+items.
  - src/features/taxonomies/ — CRUD simples de entidades    
  pequenas (referência pro RecruitmentStagesManager).       
  - src/components/MultiSelectFilter.tsx — padrão citado nos
   filtros do dashboard.
  - src/lib/activity.ts — extensão de ActivityAction com    
  novos valores.
  - src/lib/notifications.ts — extensão de NotificationType.
  - src/lib/supabase/types.ts — adição de
  Database['public']['Tables'] para as 7 tabelas novas.     
  - Migrations existentes (supabase/migrations/20260419_* a 
  20260601_*) — padrão de numeração
  YYYYMMDD_NNNN_ftX_nome.sql e estrutura.

  ---
  Ponto de partida mental foi sempre os specs 13-16 —       
  escritos antes de qualquer linha de código. Os demais     
  (produto, memórias, padrões de código) entraram como      
  contexto de apoio durante a implementação.