# Memórias persistentes do Evoluteam

Fonte de verdade versionada das memórias do Claude Code deste projeto. Commitadas no repo para sobreviver entre dispositivos.

## O que está aqui

| Arquivo | Tipo | Uso |
|---|---|---|
| `MEMORY.md` | Índice | Lista as outras 3 memórias com 1 linha cada. Claude Code carrega este arquivo automaticamente em toda conversa se estiver no path correto. |
| `project_evoluteam.md` | `project` | Estado atual do produto/brainstorm e próximos passos |
| `feedback_brainstorming_protocol.md` | `feedback` | Protocolo rigoroso de condução das perguntas (validado em 50+ iterações) |
| `user_preferences.md` | `user` | Padrão decisório do Marcio (simplicidade, consistência, etc.) |

## Como instalar num novo dispositivo

Claude Code espera encontrar estas memórias em um **path específico da máquina** (auto-load funciona só a partir dele):

```
# Linux / macOS
~/.claude/projects/<PROJECT-ID>/memory/

# Windows
C:\Users\<user>\.claude\projects\<PROJECT-ID>\memory\
```

Onde `<PROJECT-ID>` é um identificador que o Claude Code deriva do path do projeto. Na máquina do Marcio é:
```
C--Users-Marcio-Desktop-evoluteam
```

### Passos

1. **Clone o repo** no novo dispositivo.
2. **Abra uma conversa** com o Claude Code apontando para o diretório do projeto (ex: `cd evoluteam && claude`).
3. **Descubra o path correto da memória** pedindo ao Claude:
   > "Qual o caminho do diretório de memória deste projeto na máquina? Crie-o se não existir e copie os arquivos de `docs/dev/memory/` para lá."
4. Alternativa manual: copie os 4 arquivos (`MEMORY.md`, `project_evoluteam.md`, `feedback_brainstorming_protocol.md`, `user_preferences.md`) para o path de memória da máquina.

Depois disso, toda nova conversa carrega `MEMORY.md` automaticamente no contexto — e as 3 memórias linkadas ficam disponíveis por referência.

## Alternativa sem auto-load

Se não quiser copiar manualmente a cada troca de máquina, simplesmente dê este prompt em cada nova sessão:

> "Leia `docs/dev/memory/MEMORY.md` e os 3 arquivos referenciados. Use essas memórias para esta sessão. Depois leia `docs/dev/HANDOFF.md` e continue da Pergunta 51."

Funciona igualmente bem — só não é "automático", precisa do prompt manual.

## Atualizar memórias

Quando algo novo digno de memória acontecer (ex: nova decisão transversal, novo padrão estabelecido, mudança de preferência), Claude deve atualizar tanto a cópia da máquina **quanto** esta cópia no projeto. Este README deve ser updated também se o conjunto de arquivos mudar.

Regra: **projeto é fonte de verdade**. Se divergirem, o versionado no git vence.
