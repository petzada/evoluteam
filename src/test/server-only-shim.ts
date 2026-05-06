// Shim do pacote 'server-only' para vitest. No runtime de produção, o Next
// usa o pacote real para falhar caso um modulo server seja bundleado no
// cliente. Em testes (Node), nao temos client/server distinction, então
// este modulo vazio permite que as importacoes resolvam.
export {};
