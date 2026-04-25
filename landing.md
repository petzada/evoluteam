<!DOCTYPE html>

<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>evoluteam | Avaliar é fácil. Desenvolver é difícil.</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;1,6..72,400&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "secondary": "#5d5f5f",
                      "on-secondary": "#ffffff",
                      "secondary-fixed-dim": "#c6c6c7",
                      "surface-container-lowest": "#ffffff",
                      "surface-container": "#f1edec",
                      "on-tertiary": "#ffffff",
                      "surface-container-highest": "#e5e2e1",
                      "on-primary-fixed": "#1a1c1c",
                      "inverse-on-surface": "#f4f0ef",
                      "background": "#fcf8f8",
                      "on-primary-fixed-variant": "#454747",
                      "on-tertiary-fixed": "#1a1c1c",
                      "surface": "#fcf8f8",
                      "primary-fixed-dim": "#c6c6c7",
                      "tertiary": "#5d5f5f",
                      "on-tertiary-fixed-variant": "#454747",
                      "on-primary-container": "#747676",
                      "outline": "#747878",
                      "secondary-fixed": "#e2e2e2",
                      "on-tertiary-container": "#747676",
                      "primary-fixed": "#e2e2e2",
                      "primary-container": "#ffffff",
                      "surface-container-low": "#f6f3f2",
                      "outline-variant": "#c4c7c8",
                      "surface-tint": "#5d5f5f",
                      "on-primary": "#ffffff",
                      "surface-container-high": "#ebe7e7",
                      "on-surface": "#1c1b1b",
                      "error-container": "#ffdad6",
                      "primary": "#5d5f5f",
                      "surface-dim": "#ddd9d9",
                      "inverse-primary": "#c6c6c7",
                      "on-secondary-fixed-variant": "#454747",
                      "on-error-container": "#93000a",
                      "on-secondary-fixed": "#1a1c1c",
                      "tertiary-fixed-dim": "#c6c6c7",
                      "on-background": "#1c1b1b",
                      "tertiary-fixed": "#e2e2e2",
                      "inverse-surface": "#313030",
                      "secondary-container": "#dfe0e0",
                      "surface-bright": "#fcf8f8",
                      "on-surface-variant": "#444748",
                      "error": "#ba1a1a",
                      "on-secondary-container": "#616363",
                      "on-error": "#ffffff",
                      "surface-variant": "#e5e2e1",
                      "tertiary-container": "#ffffff"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "stack-sm": "8px",
                      "stack-md": "16px",
                      "container-max": "1200px",
                      "section-padding": "120px",
                      "gutter": "24px",
                      "stack-lg": "32px"
              },
              "fontFamily": {
                      "body-lg": [
                              "Inter"
                      ],
                      "label-caps": [
                              "Inter"
                      ],
                      "h2": [
                              "Newsreader"
                      ],
                      "h1-sub": [
                              "Newsreader"
                      ],
                      "h1": [
                              "Newsreader"
                      ],
                      "body-md": [
                              "Inter"
                      ]
              },
              "fontSize": {
                      "body-lg": [
                              "18px",
                              {
                                      "lineHeight": "1.6",
                                      "fontWeight": "400"
                              }
                      ],
                      "label-caps": [
                              "12px",
                              {
                                      "lineHeight": "1",
                                      "letterSpacing": "0.05em",
                                      "fontWeight": "600"
                              }
                      ],
                      "h2": [
                              "32px",
                              {
                                      "lineHeight": "1.2",
                                      "fontWeight": "500"
                              }
                      ],
                      "h1-sub": [
                              "24px",
                              {
                                      "lineHeight": "1.4",
                                      "fontWeight": "400"
                              }
                      ],
                      "h1": [
                              "48px",
                              {
                                      "lineHeight": "1.1",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "500"
                              }
                      ],
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "1.5",
                                      "fontWeight": "400"
                              }
                      ]
              }
      },
          },
        }
      </script>
<style>
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      </style>
</head>
<body class="bg-surface-container-lowest text-on-surface font-body-md text-body-md antialiased selection:bg-surface-variant selection:text-on-surface">
<!-- 1. Header (Sticky) -->
<header class="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md docked full-width top-0 border-b border-neutral-200 dark:border-neutral-800 flat no shadows sticky z-50 w-full flex justify-between items-center px-6 md:px-12 h-16 max-w-[1200px] mx-auto">
<a class="font-newsreader text-2xl font-bold tracking-tighter text-neutral-900 dark:text-neutral-50" href="#">evoluteam</a>
<nav class="hidden md:flex items-center gap-8">
<a class="text-neutral-500 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200" href="#produto">Produto</a>
<a class="text-neutral-500 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200" href="#como-funciona">Como funciona</a>
<a class="text-neutral-500 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200" href="#precos">Preços</a>
<a class="text-neutral-500 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200" href="#faq">FAQ</a>
</nav>
<div class="flex items-center gap-4">
<a class="hidden md:block text-neutral-500 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200" href="#">Entrar</a>
<a class="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-DEFAULT font-medium hover:bg-neutral-800 transition-colors active:scale-95 transition-transform" href="#demo">Agendar demo</a>
</div>
</header>
<main>
<!-- 2. Hero -->
<section class="pt-section-padding pb-section-padding px-6 md:px-12 max-w-container-max mx-auto text-center">
<div class="inline-flex items-center gap-2 mb-stack-lg border border-outline-variant rounded-full px-4 py-1.5">
<span class="w-2 h-2 rounded-full bg-[#f97316]"></span>
<span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">Performance · Feedback · Desenvolvimento</span>
</div>
<h1 class="font-h1 text-h1 text-on-surface mb-stack-md max-w-4xl mx-auto text-balance">
                Avaliar é fácil. <em class="italic font-newsreader">Desenvolver</em> é difícil.
            </h1>
<p class="font-h1-sub text-h1-sub text-on-surface-variant max-w-2xl mx-auto mb-stack-lg text-balance">
                A plataforma editorial para gestão de performance B2B. Clara, densa e orientada para a ação real.
            </p>
<div class="flex flex-col sm:flex-row justify-center gap-4 mb-section-padding">
<a class="bg-[#0a0a0a] text-white px-8 py-3 rounded-DEFAULT font-medium hover:bg-neutral-800 transition-colors" href="#demo">Agendar demo</a>
<a class="border border-outline px-8 py-3 rounded-DEFAULT font-medium hover:bg-surface-variant transition-colors text-on-surface" href="#produto">Explorar produto</a>
</div>
<div class="relative max-w-5xl mx-auto border border-outline-variant rounded-lg overflow-hidden bg-white shadow-sm p-2">
<img alt="Dashboard interface showing clear performance metrics and development plans in a clean, minimalist layout" class="w-full h-auto rounded border border-outline-variant" data-alt="Modern SaaS dashboard interface showing clear data visualization, clean typography, and a development plan timeline on a white background with subtle borders" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyGLDVrBcJlTGBz8WqY9NtxlmbnoOeBV7l4xAODkzHy_HN17FrxzHn_3fep-sqr7TNXF4kj3NLwUkqViR6PuGFQLyZ8YMgfn_rnv_04BXP4-mlfAQy6gS63hi9qhP73SNxvqTzYna5a0NnB5H4KgdHsX6Ej07ppLE-gmRUuawlEYWsa6YluJAwJlfe0IYXiJ9F7J0ZHqcSRBW2HXk32IZ_mZctGsYzNgEsHJ5qRBVPtvZWgwlUn9enyhLQqSxhhlm_Sq4Xv3E3_EKQ"/>
</div>
</section>
<!-- 3. Problema -->
<section class="py-section-padding px-6 md:px-12 bg-white border-t border-outline-variant" id="problema">
<div class="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
<div class="space-y-12">
<div class="flex gap-6">
<span class="font-h2 text-h2 text-outline-variant">01</span>
<div>
<h3 class="font-h2 text-h2 mb-2">Avaliações superficiais</h3>
<p class="font-body-lg text-body-lg text-on-surface-variant">O foco fica na nota, não no contexto do trabalho realizado.</p>
</div>
</div>
<div class="flex gap-6">
<span class="font-h2 text-h2 text-outline-variant">02</span>
<div>
<h3 class="font-h2 text-h2 mb-2">Feedback solto</h3>
<p class="font-body-lg text-body-lg text-on-surface-variant">Conversas importantes perdem-se em chats e documentos espalhados.</p>
</div>
</div>
<div class="flex gap-6">
<span class="font-h2 text-h2 text-outline-variant">03</span>
<div>
<h3 class="font-h2 text-h2 mb-2">Ação inexistente</h3>
<p class="font-body-lg text-body-lg text-on-surface-variant">O ciclo termina sem um plano claro para o desenvolvimento futuro.</p>
</div>
</div>
</div>
<div class="border-l border-outline-variant pl-8 md:pl-16 py-8">
<blockquote class="font-h1-sub text-h1-sub text-on-surface italic max-w-md">
                        "As empresas medem o passado mas esquecem de arquitetar o futuro."
                    </blockquote>
</div>
</div>
</section>
<!-- 4. Solução -->
<section class="py-section-padding px-6 md:px-12 bg-[#fafafa] border-t border-outline-variant" id="como-funciona">
<div class="max-w-container-max mx-auto">
<div class="text-center mb-16">
<h2 class="font-h2 text-h2 mb-4">A Arquitetura do Desenvolvimento</h2>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
<!-- Card 1 -->
<div class="bg-white border border-outline-variant p-8 rounded-DEFAULT">
<div class="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase mb-4">Contínuo</div>
<h3 class="font-h2 text-h2 mb-4">Feedback</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Registo atómico e persistente de interações diárias. O alicerce para qualquer avaliação formal.</p>
</div>
<!-- Card 2 -->
<div class="bg-white border border-outline-variant p-8 rounded-DEFAULT">
<div class="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase mb-4">Formal</div>
<h3 class="font-h2 text-h2 mb-4">Ciclo</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Momentos estruturados de síntese. Calibração baseada em dados reais, não em memórias recentes.</p>
</div>
<!-- Card 3 -->
<div class="bg-[#0a0a0a] border border-[#333] p-8 rounded-DEFAULT relative overflow-hidden group">
<div class="absolute top-0 right-0 w-32 h-32 bg-[#f97316] opacity-10 rounded-bl-full transform translate-x-16 -translate-y-16"></div>
<div class="font-label-caps text-label-caps text-[#f97316] tracking-widest uppercase mb-4">Ação</div>
<h3 class="font-h2 text-h2 text-white mb-4">PDI</h3>
<p class="font-body-md text-body-md text-neutral-400">Onde a performance encontra o futuro. Planos de desenvolvimento claros, rigorosos e acompanhados.</p>
</div>
</div>
</div>
</section>
<!-- 10. Pricing -->
<section class="py-section-padding px-6 md:px-12 bg-white border-t border-outline-variant" id="precos">
<div class="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
<div class="pr-md:8">
<h2 class="font-h1 text-h1 mb-6">Investimento claro.</h2>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-md">
                        Sem planos complexos ou funcionalidades escondidas. Acesso completo a toda a arquitetura de desenvolvimento, concebida para equipas que levam a performance a sério.
                    </p>
<a class="inline-flex bg-[#0a0a0a] text-white px-8 py-3 rounded-DEFAULT font-medium hover:bg-neutral-800 transition-colors" href="#demo">Falar com vendas</a>
</div>
<div class="bg-white border border-outline-variant rounded-DEFAULT p-8 md:p-12">
<div class="mb-8 border-b border-outline-variant pb-8">
<h3 class="font-h2 text-h2 mb-2">Plano Enterprise</h3>
<div class="text-on-surface-variant font-body-md text-body-md">Preço sob consulta, ajustado à dimensão da sua operação.</div>
</div>
<ul class="space-y-4 font-body-md text-body-md">
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-on-surface text-[20px] mt-0.5" data-icon="check">check</span>
<span>Módulos completos de Feedback, Ciclo e PDI</span>
</li>
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-on-surface text-[20px] mt-0.5" data-icon="check">check</span>
<span>Histórico persistente e rastreável</span>
</li>
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-on-surface text-[20px] mt-0.5" data-icon="check">check</span>
<span>Matrizes de calibração avançadas</span>
</li>
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-on-surface text-[20px] mt-0.5" data-icon="check">check</span>
<span>Suporte técnico dedicado</span>
</li>
</ul>
</div>
</div>
</section>
<!-- 12. Footer -->
<footer class="bg-white dark:bg-neutral-950 full-width border-t border-neutral-200 dark:border-neutral-800 flat no shadows text-neutral-900 dark:text-neutral-50 font-newsreader text-sm w-full py-16 px-6 md:px-12 max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
<div class="col-span-1 md:col-span-2">
<div class="font-newsreader text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">evoluteam</div>
<p class="text-neutral-500 dark:text-neutral-400">© 2024 evoluteam. Autoridade editorial em B2B.</p>
</div>
<div>
<ul class="space-y-2">
<li><a class="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors" href="#">Termos</a></li>
<li><a class="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors" href="#">Privacidade</a></li>
</ul>
</div>
<div>
<ul class="space-y-2">
<li><a class="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors" href="#">Contato</a></li>
<li><a class="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors" href="#">Imprensa</a></li>
</ul>
</div>
</footer>
</main>
</body></html>