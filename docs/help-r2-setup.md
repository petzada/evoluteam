# Setup do Cloudflare R2 para tutoriais de ajuda

Este guia explica como hospedar os MP4 da Central de Ajuda no Cloudflare R2 e como publicar novos tutoriais em `content/help/*.mdx`.

## Criar e publicar o bucket

1. No Cloudflare Dashboard, acesse **R2** e crie um bucket chamado `evoluteam-help`.
2. Em **Settings > Public access**, habilite o subdominio publico R2.dev. A URL base ficara no formato `https://pub-<hash>.r2.dev`.
3. Em **Settings > CORS Policy**, adicione:

```json
[
  {
    "AllowedOrigins": ["https://app.seudominio.com.br", "http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range", "Content-Type"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3600
  }
]
```

Troque `https://app.seudominio.com.br` pelo dominio real da aplicacao. O header `Range` e os headers expostos permitem avancar e retroceder no player HTML5 sem baixar o video inteiro.

## Preparar e subir videos

1. Exporte o video em MP4 com H.264 + AAC.
2. Use ate 1080p e, como referencia, bitrate entre 3 e 5 Mbps para tutoriais comuns.
3. Suba o arquivo no bucket com key `help/<slug>.mp4`, por exemplo `help/onboarding.mp4`.
4. Copie a URL publica final, por exemplo `https://pub-<hash>.r2.dev/help/onboarding.mp4`.
5. Teste Range requests:

```bash
curl -I -H "Range: bytes=0-100" https://pub-<hash>.r2.dev/help/onboarding.mp4
```

O esperado e `206 Partial Content` com `Accept-Ranges`/`Content-Range`.

## Adicionar um tutorial

Crie um arquivo `content/help/<slug>.mdx`. O slug da URL vem do nome do arquivo, nao do frontmatter.

```mdx
---
title: Boas-vindas ao Evoluteam
description: Visao geral rapida da plataforma.
videoUrl: https://pub-<hash>.r2.dev/help/onboarding.mp4
duration: 120
order: 1
---

Use o corpo MDX para complementar o video com passos, observacoes e links internos.

<Callout kind="tip">
Mantenha cada tutorial focado em uma tarefa. Se crescer demais, divida em outro topico.
</Callout>
```

Campos aceitos:

- `title`: titulo exibido na lista e na pagina.
- `description`: resumo curto exibido abaixo do titulo.
- `videoUrl`: URL HTTPS publica do MP4 no R2.
- `duration`: duracao em segundos, opcional.
- `order`: ordem numerica, opcional; default `100`.
- `screen`: chave de tela para filtrar via FT-9, opcional.
- `adminOnly`: `true` para restringir a `admin_rh`, opcional.

Depois de criar o MDX, rode a suite local e publique por commit/deploy normal. Sem URL real do R2, nao crie o MDX ainda; a pagina `/ajuda` deve permanecer no empty state.
