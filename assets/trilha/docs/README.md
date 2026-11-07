Trilha é um sistema para aulas técnicas interativas: papel creme, tinta quente, um verde de marca e um terminal escuro que mostra "o que acontece de verdade". Calmo, didático, sem enfeite — a cor só aparece quando carrega significado.

## Princípios

- **Clareza.** O conteúdo é o herói: texto legível, hierarquia por tamanho e peso, uma ação principal por tela.
- **Deferência.** A interface recua: superfícies neutras, materiais translúcidos nas barras, cor só para estado e significado.
- **Profundidade.** Camadas explicam a estrutura — página, painel, cartão, elemento flutuante — com sombras suaves só no que flutua ou se move.
- **Resposta imediata.** Todo toque responde (leve encolher ao pressionar, botão do segmento que desliza, barras que crescem), em 180–320ms e desligado com "reduzir movimento".

## Conteúdo e voz

- Escreva em português do Brasil, com "você", frases curtas e verbos no imperativo: "Aperte o botão Enter", "Clica numa etapa para ver o que ela fez".
- Explique primeiro em palavras simples, com analogia do dia a dia, e só depois mostre o real: "primeiro o computador pergunta ao DNS qual é o endereço IP do site (como procurar um nome na lista de contatos)".
- Termos técnicos ficam em `body-strong` na primeira menção (**DNS**, **conexão TCP**, **TLS**); nomes de código vão em `code-inline` (`requests.Session`, `curl -v`).
- Feche cada etapa com uma frase-resumo em `takeaway`, centralizada, com as palavras-chave em marca-texto: "Antes do HTTP vêm **DNS, TCP e TLS**, e só depois o request e a resposta, **sempre nessa ordem**." (os trechos em negrito levam o marca-texto).
- Sem emoji. Capitalização de frase em títulos e botões ("Rode o caminho do request", "Continuar →").

## Cor

- Página em `surface-100`; o exercício interativo é um painel `surface-200` com `radius-xl`; dentro dele, cartões e campos em `surface-raised`.
- Títulos e termos em `ink`; texto corrido em `ink-body`; descrições, tempos e dicas em `ink-muted` (nunca sobre `surface-300`).
- `primary` é o verde da marca: feedback de acerto, progresso, a etapa final. Texto sobre ele em `on-primary`.
- O botão principal é sólido em `action` com `on-action`; desabilitado, `action-disabled` com rótulo em `ink-muted`.
- `highlight` só atrás de palavras-chave da frase-resumo, com texto em `on-highlight` — nunca como fundo de bloco.
- As etapas de rede têm cores fixas: `step-dns`, `step-tcp`, `step-tls`, `step-request`, `step-response`. Cada barra vem sempre com o nome da etapa e o tempo ao lado: a cor reforça, não identifica sozinha (`step-tcp` fica abaixo de 3:1 no tema claro).
- O terminal é escuro nos dois temas: `terminal-bg`, faixa `terminal-header`, comando em `terminal-ink`, dicas em `terminal-muted`, linhas `*` em `terminal-info`, `>` em `terminal-out`, `<` em `terminal-in`.
- Estados de interação: `fill-subtle` (hover, botão gray, trilho do segmento) e `fill-pressed` (pressionado); seleção e botão tinted em `primary-tint` com texto `primary`.
- Erro em `danger` com `on-danger`, sempre com ícone e uma palavra ("Ainda não:") — verde e laranja não se distinguem só pela cor.
- Barras fixas em `material-bar` com desfoque de fundo (saturate 180%, blur 20px).
- O tema Escuro é derivado do Claro (não aparece na fonte): mesmas funções, valores clareados para manter ≥4.5:1.

## Tipografia

- Uma família sem serifa do sistema (`sans`) para tudo, e uma mono (`mono`) para terminal, URL e código.
- Escala: `title` 28/34 bold (−0.02em), `takeaway` 22/30 bold, `heading` 17/24, `body` 15/24, `label` 14/20 semibold, `caption` 13/18, `nav` 12/16; `code` e `code-inline` 13/20.
- Pesos: 400 para texto, 600 para rótulos, 700 para títulos e termos.

## Espaço, forma e profundidade

- Espaçamento em `space-1` a `space-12` (4–48px). Painel com padding `space-6`; cartões e campos `space-4`; nome → descrição da etapa `space-2`.
- Cantos: barras e chips `radius-sm`, botões e balões `radius-md`, cartões e terminal `radius-lg`, painel `radius-xl`, card elevated `radius-2xl`, busca e etiquetas `radius-pill`.
- Profundidade primeiro por fundo e borda (`line` entre cartões, `line-strong` no contorno de campos). Sombra só no que flutua: `shadow-card` (card elevated), `shadow-control` (botão do segmento, etapa selecionada), `shadow-popover` (terminal).
- Alvos de toque com no mínimo 44px de altura em listas e campos.
- Foco: anel sólido de 2px em `focus-ring`, deslocado 2px (≥5:1 em todas as superfícies).

## Padrões recorrentes

- **Exercício "rode e observe"**: enunciado num cartão, um campo com o input real (URL em `code`) e um botão `action` "Enter ↵"; à esquerda a lista de etapas com barras de tempo, à direita o terminal que vai se preenchendo.
- **Balão do tutor**: `tutor` com instrução antes da ação; vira `primary` quando a pessoa conclui ("Cinco etapas em uns 170 ms…").
- **Passo a passo da aula**: abas em `nav` (As etapas · Quebrar · Conferir) com barra de progresso fina em `ink` sobre `surface-300`, e "Continuar →" no topo e no rodapé.

## Componentes

Carregue `tokens.css`, `components/bundle.css`, React 18 e `components/bundle.js`; tudo fica em `window.Trilha`. Cada componente tem seu guia em `components/<Nome>/README.md`.

- **Ações:** `Button` (filled, brand, tinted, gray, plain), `Badge`.
- **Texto:** `Code`, `Takeaway` com `Mark`.
- **Navegação:** `LessonToolbar`, `SegmentedControl`, `ProgressBar`, `List` com `ListRow`.
- **Superfícies e formulários:** `Card` (panel, raised, elevated), `TextField`.
- **Aula interativa:** `StepTimeline`, `Terminal`, `TutorBubble`, `Callout`.

Monte o exercício "rode e observe" assim: `Card variant="panel"` → `Callout` (quando concluir) → `TextField prefix="URL" mono` com `Button size="sm"` → duas colunas com `StepTimeline` e `Terminal` (apague com `dim` as linhas fora da etapa selecionada) → `TutorBubble` → `Takeaway`.

## Iconografia e marcas

- Nenhum logo ou conjunto de ícones foi fornecido: use o nome em texto simples. Os ícones vistos são glifos de texto (↵, →, ✓); mantenha-os como caracteres.
