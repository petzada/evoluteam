1. Painel de role colaborador hoje ao logar envia direto para /colaboradores, pelo usuário não ter acesso ao dashboard, porém, o dashboard fica sendo exibido na sidebar. Me dê dois brainstorming com opções: removar o dashboard da sidebar ou mostrar um dashboard no sentido "mural de avisos e informativos" para a role colaborador que não é gestão nem nada? O que acha das duas opções?

2. No dashboard de qualquer role, colocar filtros ao lado da saudação inicial alinhados verticalmente, abaixo do sino da topbar. As outras páginas seguem o padrão já estabelecido.

3. Competências não tem tela criada, verificar toda a lógica dessa feature/implementação se está de acordo com docs de spec e implementação.

4. Pensar em algo para Ciclo, como "Todos os ciclos" se admin_rh, para garantir uma visão geral da empresa. 

5. Ao tentar editar um ciclo rascunho, recebi 2 erros do Next.js e a página não abriu pra editar:

"## Error Type
Console Error

## Error Message
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.


    at BreadcrumbProvider.useCallback[clearLabel] [as clearLabel] (src/features/shell/BreadcrumbContext.tsx:23:5)
    at useRegisterBreadcrumbLabel.useEffect (src/features/shell/BreadcrumbContext.tsx:46:22)
    at CycleDetailPage (src\app\(app)\avaliacoes\[cycleId]\page.tsx:52:7)

## Code Frame
  21 |
  22 |   const clearLabel = useCallback((segment: string) => {
> 23 |     setLabels((prev) => {
     |     ^
  24 |       if (!(segment in prev)) return prev;
  25 |       const next = { ...prev };
  26 |       delete next[segment];

Next.js version: 16.2.4 (Turbopack)
"

e

"## Error Type
Console Error

## Error Message
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.


    at button (<anonymous>:null:null)
    at DropdownMenuTrigger (src/components/ui/dropdown-menu.tsx:18:10)
    at CycleDetail (src/features/reviews/components/CycleDetail.tsx:222:15)
    at CycleDetailPage (src\app\(app)\avaliacoes\[cycleId]\page.tsx:53:7)

## Code Frame
  16 |
  17 | function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
> 18 |   return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
     |          ^
  19 | }
  20 |
  21 | function DropdownMenuContent({

Next.js version: 16.2.4 (Turbopack)
"

6. Ao tentar acessar /colaboradores, recebi um erro:

"## Error Type
Console Error

## Error Message
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.


    at BreadcrumbProvider.useCallback[clearLabel] [as clearLabel] (src/features/shell/BreadcrumbContext.tsx:23:5)
    at useRegisterBreadcrumbLabel.useEffect (src/features/shell/BreadcrumbContext.tsx:46:22)
    at EmployeeProfilePage (src\app\(app)\colaboradores\[id]\page.tsx:150:7)

## Code Frame
  21 |
  22 |   const clearLabel = useCallback((segment: string) => {
> 23 |     setLabels((prev) => {
     |     ^
  24 |       if (!(segment in prev)) return prev;
  25 |       const next = { ...prev };
  26 |       delete next[segment];

Next.js version: 16.2.4 (Turbopack)
"

mas a página abriu normalmente.

7. Ao tentar abrir /pdi/[id] a página abriu mas deu erro:

"## Error Type
Console Error

## Error Message
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.


    at BreadcrumbProvider.useCallback[clearLabel] [as clearLabel] (src/features/shell/BreadcrumbContext.tsx:23:5)
    at useRegisterBreadcrumbLabel.useEffect (src/features/shell/BreadcrumbContext.tsx:46:22)
    at PdiDetailRoute (src\app\(app)\pdi\[id]\page.tsx:63:7)

## Code Frame
  21 |
  22 |   const clearLabel = useCallback((segment: string) => {
> 23 |     setLabels((prev) => {
     |     ^
  24 |       if (!(segment in prev)) return prev;
  25 |       const next = { ...prev };
  26 |       delete next[segment];

Next.js version: 16.2.4 (Turbopack)
"