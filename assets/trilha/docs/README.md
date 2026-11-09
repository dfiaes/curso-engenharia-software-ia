Trilha é um sistema para aulas técnicas interativas, sites de apresentação e artigos longos: papel quente, tinta escura, um verde de marca e um terminal escuro que mostra "o que acontece de verdade". Calmo, didático, sem enfeite — a cor só aparece quando carrega significado.

## Princípios

- **Clareza.** O conteúdo é o herói: texto legível, hierarquia por tamanho e peso, uma ação principal por tela.
- **Deferência.** A interface recua: superfícies neutras, materiais translúcidos nas barras, cor só para estado e significado.
- **Profundidade.** Camadas explicam a estrutura — página, painel, cartão, elemento flutuante — com sombras suaves só no que flutua ou se move.
- **Resposta imediata.** Todo toque responde (leve encolher ao pressionar, botão do segmento que desliza, barras que crescem), em 160–320ms; entradas de conteúdo em 0,72s; tudo desligado com "reduzir movimento".
- **Prova, não promessa.** Números vêm com a fonte (`StatGroup` linka para a evidência); exemplos usam dados reais de coleta.

## Conteúdo e voz

- Escreva em português do Brasil, com "você", frases curtas e verbos no imperativo: "Aperte o botão Enter", "Clica numa etapa para ver o que ela fez".
- Explique primeiro em palavras simples, com analogia do dia a dia, e só depois mostre o real: "primeiro o computador pergunta ao DNS qual é o endereço IP do site (como procurar um nome na lista de contatos)".
- Termos técnicos ficam em `body-strong` na primeira menção (**DNS**, **conexão TCP**, **TLS**); nomes de código vão em `code-inline` (`requests.Session`, `curl -v`).
- Feche cada etapa com uma frase-resumo em `takeaway`, com até duas palavras-chave em marca-texto: "Antes do HTTP vêm **DNS, TCP e TLS**, e só depois o request e a resposta, **sempre nessa ordem**." (os trechos em negrito levam o marca-texto).
- Sobretítulos em mono minúsculo numerado: "01 / experiência", "módulo 2". Links externos terminam em ↗; âncoras na página em ↓.
- Erros começam com uma palavra clara: "Ainda não:", "Atenção:". Sem emoji. Capitalização de frase em títulos e botões ("Continuar →", "Entrar na lista").

## Cor

- Página em `surface-100`; painéis e faixas em `surface-200`; cartões e campos em `surface-raised`; trilhos, chips e tags em `surface-300`.
- Títulos e termos em `ink`; texto corrido longo em `ink-body`; descrições, datas e legendas em `ink-muted` (nunca sobre `surface-300`); `ink-faint` só para números de navegação e ornamentos ao lado de um rótulo legível.
- `primary` é o verde da marca: acerto, progresso, status, links no texto do artigo. Texto sobre ele em `on-primary`; tinted e seleção em `primary-tint`.
- `brand-deep` e `brand-deeper` são o verde profundo dos painéis de destaque (GlassPanel escuro), com texto `on-brand-deep`.
- O botão principal é sólido em `action` com `on-action`; desabilitado, `action-disabled` com rótulo em `ink-muted` e a dica do que falta por perto.
- `highlight` só atrás de palavras-chave, com texto em `on-highlight` — nunca como fundo de bloco.
- Estados: `danger` (erro) e `warning` (atenção) com seus `on-*`; sempre com ícone e palavra — verde, laranja e vermelho não se distinguem só pela cor.
- Interação: `fill-subtle` (hover, botão gray, trilho do segmento) e `fill-pressed` (pressionado).
- Etapas de rede: `step-dns`, `step-tcp`, `step-tls`, `step-request`, `step-response`, sempre com o nome e o tempo ao lado (`step-tcp` fica abaixo de 3:1 no claro).
- Terminal e editor são escuros em todos os temas: `terminal-bg`, `terminal-header`, `code-text`, as seis cores `syntax-*` (comentário, string, palavra-chave, número, constante, função) e os logs `log-ok`, `log-warn`, `log-bad` — todas ≥4.5:1 sobre `terminal-bg`.
- Materiais: `material-bar` para barras fixas (desfoque 20px, saturação 180%); `glass-fill` + `glass-edge` + `shadow-glass` para painéis de vidro clássicos; e o Liquid Glass (abaixo).
- Temas: **Claro** (padrão), **Escuro** (derivado, mesmas funções) e **Papel** (sépia quente, para leitura). Qualquer elemento pode receber `data-theme="paper"` e tudo dentro dele muda — é assim que o leitor aplica o tema só ao artigo.

## Liquid Glass

- O vidro é a camada de **navegação e controles que flutua sobre o conteúdo**: `LessonToolbar`, a barra do `ReaderView`, `ReaderControls`, `Sheet`, `SegmentedControl glass`, `Button variant="glass"`/`"glass-tint"` e `LiquidGlass`. Texto de artigo, cartões, tabelas e o terminal continuam sólidos.
- Três variantes: `glass-regular` (padrão), `glass-clear` (sobre imagem, vídeo e código, sempre com `glass-scrim` ou texto grande e bold) e `glass-tint` (a ação principal flutuante, texto `on-glass-tint`).
- A espessura vem de `shadow-glass-rim` (brilho `glass-rim` em cima, sombra `glass-rim-shade` embaixo) com `shadow-glass-float`; o reflexo `glass-specular` segue o ponteiro.
- Força: `glass-blur` 14px (`glass-blur-clear` 4px), `glass-saturate` 180%, refração `glass-refraction` 28px numa borda de `glass-bezel` 18px. A refração (a borda que entorta o fundo como lente) só aparece no Chrome e no Edge; no Safari e no Firefox o vidro fica desfocado com brilho.
- Formas em cápsula (`radius-pill`) para barras e botões, `radius-2xl` para painéis e folhas — cantos internos acompanham os externos.
- As barras flutuam 12px abaixo do topo e encolhem ao rolar para baixo, voltando ao rolar para cima; a opção ativa do segmento é uma gota que se deforma de leve ao chegar; toques afundam com elasticidade.
- No máximo 3–4 peças de vidro por tela, e nunca vidro sobre vidro (exceto a gota do segmento).
- Acessibilidade: "reduzir transparência" troca o vidro por `glass-solid`; "aumentar contraste" põe borda `line-strong`; "reduzir movimento" desliga o reflexo, o encolher animado e a elasticidade.

## Tipografia

- A tipografia do macOS: **SF Pro** para interface e títulos, **New York** para leitura longa, **SF Mono** para código. Nada é baixado: as famílias apontam para as fontes do sistema da Apple (`-apple-system`, `ui-serif`, `ui-monospace`), com Helvetica Neue, Iowan Old Style/Georgia e Menlo/Consolas como reserva em outros sistemas.
- `display` (SF Pro Display) para títulos de 19px para cima; `sans` (SF Pro Text) para texto e interface; `serif` (New York) para o corpo do leitor e linhas de abertura; `mono` (SF Mono) para código, URLs e sobretítulos.
- Escala de títulos: `display` 64/68, `headline` 48/52, `title` 32/36, `title-2` 28/32, `title-3` 24/28, `stat` 40/44, `takeaway` 21/25, `heading` 19/23 — todos peso 600 (semibold), nunca 700.
- Texto: `lede` 21/29, `body` 17/25, `body-strong` 17/25 600, `label` 14/20 600, `caption` 14/20, `footnote` e `nav` 12/16.
- Espaçamento entre letras segue a tabela da Apple: negativo no texto (−0,022em a 17px, −0,016em a 14px), levemente positivo nos títulos médios (+0,004 a +0,012em) e negativo de novo nos muito grandes. Cada estilo já traz o seu `letterSpacing`.
- Números que se comparam (tempos, contagens, estatísticas) usam algarismos tabulares.

## Leitura

- Para artigos e textos longos, use o `ReaderView`: coluna de 68 caracteres (`size-measure`), corpo `reader-body` em New York 19/31, títulos `reader-title` 40/46 e `reader-h2` 28/34 em SF Pro Display, abertura `reader-lede` 22/33 em `ink-muted`.
- A pessoa ajusta tamanho (16–24px), fonte (New York ou SF Pro, `reader-body-sans` 18/29), largura (60/68/76 caracteres) e tema (Auto, Claro, Papel, Escuro); a escolha fica salva no navegador.
- Texto com hifenização em português (`lang="pt-BR"`), quebra equilibrada nos títulos e contraste do corpo ≥11:1 em todos os temas (AAA).
- Índice lateral (`TableOfContents`) acompanha a rolagem; notas laterais (`Sidenote`) ficam na margem direita em telas largas e viram caixas no celular — com notas, ponha o índice à esquerda (`asideSide="start"`).
- Dentro do texto: uma `PullQuote` a cada ~800 palavras no máximo, `Callout` de tom `note`, `tip` ou `warning`, código em bloco ou `CodeEditor`, figuras com legenda em `reader-caption`.

## Espaço, forma e profundidade

- Espaçamento em `space-1` a `space-24` (4–96px): `space-16` abaixo do `SectionHeader`, `space-24` entre seções de página, `space-6` de padding em painéis, `space-4` em cartões.
- Larguras: `size-wrap` 1180px para páginas, `size-wrap-narrow` 920px para seções de texto, `size-sidebar` 264px.
- Cantos concêntricos: `radius-sm` 4 (barras, chips), `radius-md` 8 (botões, campos), `radius-lg` 12 (cartões, terminal, editor), `radius-xl` 14 (nós da trilha, painel), `radius-2xl` 22 (vidro, folhas, card elevated), `radius-pill`.
- Duas linguagens de profundidade, sem misturar na mesma área: **suave** (`shadow-card`, `shadow-control`, `shadow-popover`, `shadow-glass`) para interface e aulas; **carimbo** (`shadow-stamp`, `shadow-stamp-soft`, borda `ink`, canto reto) para chamadas editoriais em páginas de apresentação.
- Fora isso, profundidade por fundo e borda: `line` entre cartões e linhas de tabela, `line-dark` para divisórias enfáticas, `line-strong` no contorno de campos.
- Alvos de toque com no mínimo 44px em listas, campos e botões `lg`.
- Foco: anel sólido de 2px em `focus-ring`, deslocado 2px (≥4.8:1 em todas as superfícies e temas).

## Componentes

Carregue `tokens.css`, `components/bundle.css`, React 18 e `components/bundle.js`; tudo fica em `window.Trilha`. Cada componente tem seu guia em `components/<Nome>/README.md`.

- **Ações:** `Button` (filled, brand, tinted, gray, plain, stamp, glass, glass-tint), `Badge`.
- **Texto:** `Code`, `Takeaway` com `Mark`, `Eyebrow`.
- **Página:** `SiteSidebar`, `SectionHeader`, `TextLink`, `StatusDot`, `LanguageSwitch`.
- **Conteúdo:** `StatGroup`, `MetricStrip`, `TagList`, `Timeline`, `ProjectList`, `FAQ`, `ProfileCard`, `EmailCapture`.
- **Navegação:** `LessonToolbar`, `SegmentedControl`, `ProgressBar`, `List` com `ListRow`.
- **Superfícies e formulários:** `Card` (panel, raised, elevated, stamp), `LiquidGlass`, `GlassPanel`, `Sheet`, `TextField`, `Reveal`.
- **Curso e aula interativa:** `CurriculumTrack`, `ChallengeStepper`, `CodeEditor`, `Terminal` (com logs), `DataTable`, `BrowserFrame`, `StepTimeline`, `TutorBubble`, `Callout`, `Skeleton`.
- **Leitura:** `ReaderView`, `ReaderControls`, `ArticleLayout`, `ArticleHeader`, `Prose`, `PullQuote`, `Sidenote`, `TableOfContents`, `ReadingProgress`. A página `ArticlePage` mostra tudo junto.

## Receitas

- **Exercício "rode e observe":** `Card variant="panel"` → `Callout` (quando concluir) → `TextField prefix="URL" mono` com `Button size="sm"` → duas colunas com `StepTimeline` e `Terminal` (apague com `dim` as linhas fora da etapa selecionada) → `TutorBubble` → `Takeaway`.
- **Exercício de código:** `CodeEditor editable` com `onRun` → `DataTable` com o resultado (estado vazio até rodar) → `Terminal` com linhas `ok`/`warn`/`bad` → `ChallengeStepper` mostrando o que libera depois.
- **Página de apresentação:** `SiteSidebar` à esquerda → seções com `SectionHeader` numerado (`id` igual ao `href` da barra) → `StatGroup` com links para as provas na `Timeline` → `ProjectList` → `FAQ` → `EmailCapture`; entradas com `Reveal stagger`.
- **Página do curso:** título `display` + `lede` + `EmailCapture` → `CodeEditor` com `BrowserFrame` ao lado → `CurriculumTrack` → `ProfileCard` → `FAQ`.
- **Controles sobre mídia:** imagem, vídeo ou `CodeEditor` de fundo → `Button variant="glass"` para ações secundárias e `"glass-tint"` para a principal → `SegmentedControl glass` para trocar de visão.
- **Artigo:** `ReaderView` → `ArticleLayout asideSide="start"` com `TableOfContents` → `TableOfContents variant="mobile"` → `ArticleHeader` → `Prose` (com `Sidenote`, `PullQuote`, `Callout`) → `Takeaway`.

## Iconografia e marcas

- Nenhum logo ou conjunto de ícones foi fornecido: o nome vai em texto simples, e a `SiteSidebar` usa a inicial até que exista uma marca própria. Os ícones são glifos de texto (↵ → ↗ ↓ ✓ ›), mantidos como caracteres; o cadeado do `BrowserFrame` é o único desenho, em SVG de uma cor (`currentColor`).
- Não reproduza marcas, mascotes ou layouts de terceiros nas demonstrações; use domínios `exemplo.com.br` e lojas genéricas.
