1. Testando a aplicação, em /configurações/empresa, ao selecionar um segmento, recebi o erro:

"## Error Type
Console Error

## Error Message
Base UI: A component is changing the default value state of an uncontrolled Select after being initialized. To suppress this warning opt to use a controlled Select.


    at Object.render (src/features/company/components/CompanyEditForm.tsx:64:13)
    at FormField (file://C:/Users/Marcio/Desktop/evoluteam/.next/dev/static/chunks/src_0k_rl9~._.js:1084:332)
    at CompanyEditForm (src/features/company/components/CompanyEditForm.tsx:61:9)
    at EmpresaPage (src\app\(app)\configuracoes\empresa\page.tsx:18:7)

## Code Frame
  62 |           <FormItem>
  63 |             <FormLabel>Segmento *</FormLabel>
> 64 |             <Select onValueChange={field.onChange} defaultValue={field.value}>
     |             ^
  65 |               <FormControl>
  66 |                 <SelectTrigger><SelectValue /></SelectTrigger>
  67 |               </FormControl>

Next.js version: 16.2.4 (Turbopack)"

2. Em configurações/auditoria, alguns eventos estão com nomes de funções e etc, da pra generalizar tudo pra uma linguagem normal para o meu ICP? Visando entender mais fácil quando surgir alguma dúvida sobre algum evento, etc. Se possível, paginar também conforme outras features que tem paginação.

3. Da pra normalizar os campos que tem número (exemplo: telefone em (xx) xxxxx-xxxx ou CPF em yyy.yyy.yyy-yy? Pelo menos na visualização, o usuário digita sem pontos, mas o sistema mostra com pontuação (no banco pode ser guardado como está, não sei se interfere).

4. O Supabase Storage acredito que foi configurado, faça um checklist antes para que eu confira e me mostre onde irei utilizar no MVP. Acredito que hoje o usuário não consegue subir sua foto de perfil em nenhum lugar (principalmente em configurações/perfil).

5. As páginas/features que tem algum tipo de filtro, o que acha de padronizarmos o lugar do filtro ao lado ou abaixo do botão CTA que fica abaixo do topbar (com o sino)? Seria em prática verticalmente alinhado com a saudação/nome da página que é exibida no começo da área de conteúdo. 

6. Confira as lógicas de todos os kpis/gráficos e informações do dashboard estão devidamente alimentadas corretamente, coletando dados de tudo que faz sentido com aquela exibição proposta.

7. Padronize o tamanho dos cards do dashboard. Exemplo: card de avaliações pendentes, por ter uma informação "3 no total" tem tamanho maior que o restante. Confira a lógica dos outros cards para se caso quando for alimentado, não crescerá acima do padrão estabelecido também. (O tamanho atual estão ok, precisa apenas padronizar tamanho).

8. Confira se os filtros realmente estão funcionando e fazem sentido. Vou citar um exemplo que acredito ser um erro: Thainara Mariano de Paula, populada no banco, é colaboradora, porém está aparecendo na lista de "Todos os gestores" do filtro em /colaboradores.

9. Em /colaboradores/[id], "atividade da conta" na tab Acesso e a tab Histórico fazem a mesma função ou não? Se sim, reduza a somente histórico e retire a "Atividade da Conta". Se fazem funções distintas, vamos alinhar necessidade.

10. Em /avaliações/[cycleId]/editar, ao clicar em salvar rascunho, nada é executado, fica carregando o botão "Salvando..." com erro 500 fetch no Network F12.

11. Em /pdi/[id do pdi ou equivalente], consegui com minha conta Admin RH colocar um colaborador como responsável pela ação, isso está certo? Acredito que tem a ver com as permissões de cada usuário.

12. ***MUITO IMPORTANTE*** Conferir todas as permissões de visualização/edição de acordo com o temos hoje e identificar divergências quanto as specs, pois, por exemplo, Diretor pode visualizar mas não pode editar (ele será setado como admin/rh ou tem permissão separada?) O colaborador pode ser responsável por uma ação mesmo que ele não é líder? Como estão separadas as funções de permissões de acesso? Fiz o convite para um e-mail como colaborador e ele consegue não visualizar apenas os itens de /configurações, mas o restante consegue até editar algumas informações que não deveria. Verifique toda a lógica de permissões e como funciona para melhorarmos.

14. ***IMPORTANTE*** Verifique também a lógica de permissões de VISUALIZAÇÃO das páginas de acordo com cada role, evitando que colaboradores vejam informações destinadas a gestão e vice-versa.

13. /configurações era pra ter uma sidebar menor ao lado da sidebar principal? Pois ela não mostra status quando alguma sessão está ativa, deveria ficar igual o destaque quando estamos em alguma sessão da sidebar principal ou algo do tipo, que não chame tanta atenção.

14. Nome na footer sidebar está sobressaindo a sidebar lateralmente se muito grande, o nome deveria ser truncado ou abreviado primeiro e último nome, por exemplo (me de uma ideia boa sobre isso).

15. /configurações/auditoria deve existir paginação conforme já estabelecida na aplicação. Também deve ter sua linguagem mais normal para o meu ICP e retirada as informações como plan_id [token] ou name: Diretor por exemplo, verificar melhor correção para esse caso, ou mesmo truncar essas informações, apenas afim de evitar scroll vertical nessa seção.

16. Breadcrumb em páginas onde tem token id ou id, por exemplo, estão aparecendo os respectivos tokens e ids e não um nome ou algo do tipo. Precisa normalizar isso para meu ICP.