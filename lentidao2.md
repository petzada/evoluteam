Faça uma validação pós-implementação da Fase 1 de performance.

Não implemente novas features ainda.
Não avance para Fase 2.
Não mexa no proxy.ts/middleware ainda.
Não crie migration, RPC ou alteração de schema.

Objetivo:
Verificar se a Fase 1 foi implementada corretamente, se não houve regressão de autenticação/permissão/redirects e se a estimativa de queries realmente melhorou.

Valide os seguintes pontos:

## 1. Build, lint e typecheck

Rode os comandos disponíveis no projeto:

- npm run build
- npm run lint, se existir
- npm run typecheck, se existir
- npm test, se existir

Se algum script não existir, apenas informe.

## 2. Revisar getActorContext()

Analise `src/features/auth/context.ts` e confirme:

- Se usa `React.cache()` corretamente.
- Se não cria client Supabase várias vezes sem necessidade dentro do mesmo fluxo.
- Se não altera regras de negócio em relação ao comportamento anterior.
- Se os redirects de terminated/suspended/sem empresa apenas preservam a lógica antiga.
- Se o contexto só é usado em rotas protegidas.
- Se não há risco de redirect indesejado em páginas públicas.

Liste qualquer risco encontrado.

## 3. Revisar TopBar

Confirme se `TopBar` realmente não chama mais:

- `supabase.auth.getUser()`
- queries em `profiles`
- queries em `employees`

Se ainda houver chamadas, explique por quê.

Também explique a inconsistência do relatório anterior:
Você disse “TopBar com zero auth duplicado”, mas depois estimou “TopBar (2)”.
Confirme se foi apenas erro de estimativa ou se ainda existem 2 chamadas reais.

## 4. Revisar NotificationBell

Valide se a alteração do count não gerou bug.

Confirme:

- O contador mostra o total real de notificações não lidas?
- Ou mostra apenas o total carregado na lista?
- Existe `limit` na query?
- Existe uso de `{ count: 'exact' }`?
- Se houver risco de mostrar contagem errada, proponha correção simples sem trocar para Realtime e sem criar RPC.

## 5. Revisar redirects e permissões

Compare a lógica antiga com a nova nos seguintes casos:

- usuário não autenticado acessando rota privada;
- usuário autenticado acessando área logada;
- usuário sem empresa;
- usuário com empresa suspensa;
- usuário terminated;
- manager;
- hiring manager;
- usuário comum;
- acesso ao módulo recrutamento;
- acesso a configurações;
- acesso a colaboradores;
- acesso a avaliações.

Informe se alguma regra foi alterada por acidente.

## 6. Medir queries restantes

Faça uma leitura dos arquivos principais e estime, por rota, quantas chamadas ao Supabase ainda acontecem.

Rotas prioritárias:

- `/dashboard`
- `/colaboradores`
- `/colaboradores/[id]`
- `/avaliacoes`
- `/feedbacks`
- `/pdi`
- `/configuracoes`
- `/recrutamento`
- `/recrutamento/vagas`
- `/recrutamento/candidatos`

Para cada rota, liste:

- chamadas de contexto/auth;
- chamadas próprias da página;
- possíveis queries duplicadas;
- possíveis N+1;
- chamadas client-side;
- chamadas em componentes globais.

## 7. Verificar se App Shell persiste

Confirme se o App Shell está no layout correto e se sidebar/topbar não estão sendo remontados desnecessariamente em navegação interna.

Verifique especialmente:

- `src/app/(app)/layout.tsx`
- layouts aninhados de recrutamento/configurações
- providers globais
- componentes client usados no shell

## 8. Gerar relatório final

Gere um relatório com:

- Resultado do build/lint/typecheck
- Regressões encontradas, se houver
- Inconsistências encontradas
- Queries que foram realmente deduplicadas
- Queries que ainda permanecem
- Rotas ainda lentas ou suspeitas
- Correções pequenas recomendadas antes da Fase 2
- Se a aplicação está segura para seguir para Fase 2 ou se precisa corrigir algo antes

Não implemente nada novo sem minha aprovação.