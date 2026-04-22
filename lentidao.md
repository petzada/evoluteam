Você é um engenheiro sênior especialista em Next.js, performance web, Supabase, Railway e arquitetura full-stack.

Quero que você faça uma auditoria técnica completa e objetiva da minha aplicação, focada em encontrar gargalos de performance, lentidão de carregamento, excesso de redirects, problemas de middleware, rotas lentas, componentes pesados, queries ineficientes e problemas de arquitetura.

## Contexto do projeto

Tenho uma aplicação em Next.js hospedada na Railway.

O banco de dados está no Supabase.

A aplicação possui:

- Landing page pública
- Área logada em formato App Shell
- Sidebar, topbar e páginas internas
- Autenticação
- Rotas protegidas
- Middleware
- Supabase como banco e possivelmente auth/session
- Deploy na Railway
- Site público: https://evolu.team

Estou sentindo uma lentidão grande ao carregar abas, telas e informações dentro da aplicação. Já tive outras aplicações em Next.js com comportamento bem mais rápido, então quero entender se o problema está em:

- Redirects excessivos
- Middleware mal otimizado
- Rotas mal estruturadas
- Server Components pesados
- Client Components em excesso
- Queries Supabase lentas
- Falta de cache
- Fetches repetidos
- Uso incorreto de loading/suspense
- Re-renderizações desnecessárias
- App Shell recarregando mais do que deveria
- Problemas de layout/root layout
- Providers globais pesados
- Bundle JavaScript grande
- Imagens/assets pesados
- Chamadas API desnecessárias
- Falta de paginação ou filtros server-side
- Problemas de cold start ou configuração na Railway

## Objetivo da auditoria

Quero que você analise o projeto de ponta a ponta, mas sem sair refatorando tudo de uma vez.

Primeiro, faça uma auditoria detalhada e identifique:

1. O que provavelmente está causando lentidão.
2. Quais arquivos, rotas ou componentes parecem mais problemáticos.
3. Quais problemas são críticos.
4. Quais problemas são melhorias rápidas.
5. Quais problemas exigem refatoração maior.
6. O que pode ser melhorado sem quebrar autenticação, rotas protegidas e App Shell.

## Regras importantes

- Não altere código ainda na primeira etapa.
- Primeiro leia e entenda a estrutura do projeto.
- Analise `package.json`, `next.config`, `middleware`, layouts, rotas, providers, componentes globais e integrações com Supabase.
- Verifique se o App Shell está sendo remontado desnecessariamente entre páginas.
- Verifique se existem redirects/rewrites excessivos.
- Verifique se o middleware está rodando em rotas onde não deveria.
- Verifique se há queries Supabase sendo executadas muitas vezes.
- Verifique se há chamadas duplicadas no client e no server.
- Verifique se páginas internas estão buscando dados de forma ineficiente.
- Verifique se há excesso de `"use client"` em componentes que poderiam ser Server Components.
- Verifique se componentes pesados estão sendo carregados globalmente sem necessidade.
- Verifique se há bibliotecas grandes sendo importadas em layouts ou providers globais.
- Verifique se há imagens, ícones ou assets pesados.
- Verifique se há problemas de cache, revalidate, dynamic rendering ou fetch sem controle.
- Verifique se há uso indevido de `router.refresh()`, `router.push()`, `redirect()`, `useEffect` ou estado global causando recarregamentos.
- Verifique se a autenticação com Supabase está gerando chamadas excessivas.
- Verifique se o banco pode estar sofrendo com queries sem índice, joins pesados ou N+1 queries.

## Etapas da análise

### 1. Mapeamento inicial

Faça um mapa técnico da aplicação:

- Estrutura de pastas
- Rotas públicas
- Rotas privadas
- Layouts principais
- Middleware
- Providers globais
- Integrações com Supabase
- APIs internas
- Componentes compartilhados
- Fluxo de autenticação
- Fluxo de carregamento da área logada

### 2. Auditoria de middleware e redirects

Analise especialmente:

- `middleware.ts`
- lógica de autenticação
- redirects entre `/login`, `/dashboard`, `/app`, `/auth`, etc.
- matcher do middleware
- chamadas Supabase dentro do middleware
- possíveis loops ou verificações desnecessárias
- middleware rodando em assets, imagens, APIs ou rotas públicas sem necessidade

Quero que você diga se o middleware está leve ou pesado.

Se estiver pesado, proponha uma versão otimizada.

### 3. Auditoria de layouts e App Shell

Analise:

- `app/layout.tsx`
- layouts aninhados
- layout da área logada
- sidebar
- topbar
- providers
- componentes globais

Verifique se o App Shell está sendo renderizado de forma eficiente ou se cada troca de aba/tela está remontando estruturas grandes.

Identifique componentes que deveriam ser persistentes e componentes que deveriam ser carregados por rota.

### 4. Auditoria de Server Components e Client Components

Procure excesso de `"use client"`.

Classifique os componentes principais em:

- Precisa ser client
- Poderia ser server
- Está client sem necessidade
- Está pesado demais para estar no layout global

Verifique uso de hooks como:

- `useEffect`
- `useState`
- `useRouter`
- `useSearchParams`
- `usePathname`
- context providers
- stores globais

Aponte onde isso pode estar causando re-renderizações.

### 5. Auditoria de data fetching

Analise todas as chamadas para Supabase e APIs internas.

Verifique:

- queries repetidas
- fetch em cascata
- N+1 queries
- falta de `select` específico
- busca de dados demais
- ausência de paginação
- ausência de cache
- chamadas feitas no client que poderiam ser server-side
- chamadas feitas em layout global sem necessidade
- chamadas duplicadas entre layout e página
- chamadas executadas a cada troca de rota

Para cada problema encontrado, indique o arquivo, a query/chamada e o impacto provável.

### 6. Auditoria de bundle e bibliotecas

Analise imports e dependências.

Procure:

- bibliotecas grandes importadas globalmente
- ícones importados de forma ineficiente
- charts carregados antes da hora
- editores, tabelas, modais ou componentes pesados carregando no layout
- animações pesadas
- componentes Magic UI ou shadcn usados de forma excessiva
- imports que deveriam ser dinâmicos com `dynamic()`

Sugira onde usar lazy loading/dynamic import.

### 7. Auditoria de loading states e UX percebida

Verifique:

- `loading.tsx`
- Suspense boundaries
- skeletons
- transições entre páginas
- estados vazios
- estados de carregamento
- bloqueios de tela por dados que poderiam carregar de forma incremental

Quero sugestões para melhorar a percepção de velocidade mesmo quando o backend demorar.

### 8. Auditoria Supabase

Analise o uso do Supabase:

- criação do client server-side
- criação do client client-side
- uso de cookies/session
- queries em tabelas principais
- filtros
- joins
- índices necessários
- RLS impactando performance
- chamadas repetidas para buscar user/company/profile
- padrão de multi-tenant, se existir

Sugira índices SQL se encontrar consultas que provavelmente precisam deles.

### 9. Auditoria Railway/Deploy

Analise possíveis causas relacionadas ao deploy:

- cold start
- configuração de build
- variáveis de ambiente
- uso de serverless vs long-running
- Next.js rodando como Node server
- caching
- compressão
- logs
- health checks
- tempo de resposta das rotas

Diga o que vale verificar na Railway para confirmar.

### 10. Relatório final

Ao final, gere um relatório em Markdown com:

## Diagnóstico geral

Resumo objetivo do estado da performance.

## Principais suspeitas

Liste os principais gargalos encontrados, em ordem de impacto provável.

## Problemas críticos

Tabela com:

- Problema
- Arquivo/rota
- Impacto
- Evidência encontrada
- Sugestão de correção
- Prioridade

## Quick wins

Liste melhorias simples que podem ser feitas rapidamente.

## Refatorações recomendadas

Liste melhorias maiores, com cuidado para não quebrar o projeto.

## Melhorias no middleware

Explique o que mudar.

## Melhorias no App Shell

Explique o que mudar.

## Melhorias no Supabase/data fetching

Explique o que mudar.

## Melhorias de bundle/client components

Explique o que mudar.

## Plano de ação por fases

Monte um plano em 3 fases:

### Fase 1 — Correções rápidas sem risco
### Fase 2 — Otimização estrutural moderada
### Fase 3 — Refatorações maiores

## Depois da auditoria

Depois de gerar o relatório, pergunte se eu quero que você implemente a Fase 1.

Não implemente alterações automaticamente antes de apresentar o diagnóstico.