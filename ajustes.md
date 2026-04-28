
1. Em /dashboard, no card com o gráfico de "Média por departamento", quando há departamento com nomes extensos e muitos departamentos, os nomes dos departamentos abaixo das barras do gráfico ficam sobrepondo uns aos outros, quero que você quebre a linha se detectado sobreposição ou trunque os nomes extensos para evitar essa sobreposição.

2. Em /recrutamento/etapas, as badges "Entrada", "Intermediária" e "Contratação" estão pequenas, deve aumentar o tamanho da fonte um pouco.

3. Em /colaboradores, o status "Ativo" está na cor primária do app, pode mudar pra verde.

4. Em /recrutamento/candidatos, /recrutamento/vagas, /configuracoes/departamentos, /configuracoes/cargos, /configuracoes/competencias, /configuracoes/auditoria, os cabeçalhos das tabelas estão com a mesma cor do restante da tabela, precisaria alterar a cor do fundo do cabeçalho (e somente do cabeçalho) para a cor do background da sidebar, o azul. O restante da tabela continua com background branco normalmente.

5. Na aplicação por inteiro (app logado e landing/login) onde utiliza a fonte Geist, quero trocar pra fonte Inter. Seguindo os padrões da tipografia já utilizado (bold, medium, etc), somente trocar uma fonte por outra.

6. Se um usuário tenta preencher um formulário e ele não preenche o mínimo de caracter viável, o botão da ação fica inclicável. Deixar o botão de ação clicável, porém se o usuário não preencher o mínimo de caracteres da validação, a ação não pode ser submetida e deve ser dado um aviso de onde está o erro e o restante de caracteres necessários.

7. Os selects da aplicação por inteiro, onde a pessoa pode selecionar opção de escolha devem sempre renderizar as opções pra baixo do input. Por exemplo: nos casos em que a pessoa seleciona uma opção do final da lista e reabre o select, as opções abrem "pra cima do input" e prejudica a UX do usuário. Verificar pra mostrar o input selecionado e as opções que estavam acima poderem ser acessíveis com um scroll ou algo do tipo, mais natural.

8. Mesmo os perfis de teste serem mock, percebi alguns erros e gostaria de verificar se isso está sendo realizado pra qualquer usuário ou somente por ser dados mock de teste, tem erros: em /recrutamento/relatorios, o gráfico de funil de conversão não mostra nenhuma pessoa contratada, mas no gráfico de origens possui. Verificar.

9. No gráfico de origens dos candidatos, em /recrutamento/relatorios, o gráfico está torto, os círculos não estão no mesmo alinhamento vertical. Verificar. Aproveitar e remover também a legenda do final do card, pode deixar apenas a legenda abaixo dos gráficos em círculo (candidatos e contratados).