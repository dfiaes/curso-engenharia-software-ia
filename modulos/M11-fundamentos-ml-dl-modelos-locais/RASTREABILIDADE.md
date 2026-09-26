# Rastreabilidade do M11

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/M11-ESPECIFICACAO.md`](../../docs/especificacoes/M11-ESPECIFICACAO.md) · **Estado:** G0/G1/G3/G4 aprovados; G2/G5 parciais; G6 pendente

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 16 h | especificação §2 |
| blocos | 8 | especificação §4 |
| cenários | 35 (`M11-AT-001`–`035`) | especificação §5 |
| fontes | 20 | especificação §6 |
| produto | transformer mínimo + provider local + matriz API×local | especificação §1 e §3 |
| execução externa obrigatória | 0 | especificação §1 |

## Cobertura por bloco

| Bloco | Competência verificável | Cenários | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · fundamento e observabilidade | vocabulário, mapa, logprobs | AT-001–004 | gateway instrumentado | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + CHECKPOINT B01 |
| B02 · tensores e loop de treino | shape, autograd, 5 passos | AT-001,005–007 | regressão + quebra | CONTEÚDO PRODUZIDO; LAB VERDE |
| B03 · atenção e custo quadrático | QKV, máscara, SDPA, O(n²) | AT-008–011 | equivalência + medida | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + CHECKPOINT B03 |
| B04 · tokenização e transformer | BPE, residual, overfitting | AT-012–015 | GPT mínimo + holdout | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + CHECKPOINT B04 |
| B05 · pós-treino e amostragem | SFT/DPO, template, abstenção | AT-016–019 | categoria abstencao | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + CHECKPOINT B05 |
| B06 · pesos abertos e quantização | licenças, VRAM, GGUF | AT-020–023 | `orcamento_vram` | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + CHECKPOINT B06 |
| B07 · serving local e gateway | Ollama, armadilhas, provider | AT-024–029 | provider + ADR-0005 | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + CHECKPOINT B07 |
| B08 · avaliação honesta e fine-tuning | BFCL, escadas, custo, LoRA | AT-030–035 | matriz + break-even | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + CHECKPOINT B08 |

## Matriz de cenários

| Família | Cenários | Estado atual | Condição para promoção |
|---|---|---|---|
| fundamento/observabilidade | AT-001–004 | AT-001/002/003 VERIFICADO; AT-004 parcial (PG BLOCKED) | seed + `zero_grad` provados na B02-L; evidência em `lab/evidence/b02-gates.txt` |
| tensores/loop | AT-005–007 | ORÁCULOS VERDES + CHECKPOINT B02 | rubrica B02 por cenário; evidência + pytest do momento D |
| atenção | AT-008–011 | ORÁCULOS VERDES + CHECKPOINT B03 | rubrica B03 por cenário; pytest do momento D (34 passed) |
| tokenização/transformer | AT-012–015 | ORÁCULOS VERDES + CHECKPOINT B04 | rubrica B04 por cenário; pytest do momento D (45 passed) |
| pós-treino/sampling/abstenção | AT-016–019 | ORÁCULOS VERDES + CHECKPOINT B05 | rubrica B05 por cenário; pytest do momento D (58 passed) |
| VRAM/licenças/quant | AT-020–023 | AT-020/023 VERDES + CHECKPOINT B06; AT-021/022 em quarentena | rubrica B06 por cenário; pytest do momento D (67 passed) |
| serving/gateway | AT-024–029 | ORÁCULOS VERDES + CHECKPOINT B07 | rubrica B07; pytest D (78 passed) |
| avaliação/custo/LoRA | AT-030–035 | ORÁCULOS VERDES + CHECKPOINT B08 | rubrica B08; pytest 94 passed |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0, 35 ATs, 20 fontes, lab local CPU e limites |
| G1 | **APROVADO** | B01–B08 produzidos no padrão e revisados: sem stack prévia, sem relógios, práticas no lab guiado final, fontes por afirmação, contraste e diagnóstico por bloco |
| G2 | PARCIAL (local verde; live bloqueado) | `lab/`: uv.lock, ruff, mypy strict, 94 passed CPU; Ollama/PG/pesos 5 GB BLOCKED sem Docker/rede de pesos |
| G3 | **APROVADO** | checkpoints B01–B08 com rubrica 0–2 por AT-001–035, casos negativos e mutantes; demonstração = oráculos executados e medidos |
| G4 | **APROVADO** | invariantes/adapters separados na spec; Python 3.14 canônico; CPU-only portável; lock multiplataforma; zero pré-requisito de outra stack |
| G5 | PARCIAL (executável coberto; live bloqueado) | cleanup provado, timeout/keep_alive, OOM/dimensionar, host/auth com oráculos; servidor live e PG bloqueados |
| G6 | PENDENTE | tags/âncoras/links validados; CSS responsivo + print; serve 200 via localhost; QA visual interativo (390 px em device, paginação impressa) pendente |

## Auditoria do artefato anterior

| Achado | Impacto | Tratamento planejado |
|---|---|---|
| 9 caixas "Tradução .NET" pressupondo stack | pré-requisito indevido | explicação direta em Python; B01 aplicado (caixa + GC/LOH + NuGet removidos), B02 aplicado (3 caixas + `dotnet`/Matrix/EF removidos), restante em B03–B08 nos lotes C |
| `clock` 00:00–02:00 + durações por prática | sessão obrigatória | referência de escopo, nunca gate; B01+B02 aplicados, restante nos lotes C/E |
| práticas executáveis espalhadas em B01/B05–B08 | N3 sem lab único | B01 aplicada (4 `.step` viraram referência + ponte ao lab); B02 aplicada (setup + 3 `.step` viraram `regressao.py`/`nao_linear.py` + ponte); restante nos lotes C/L |
| rede/conta/download como caminho único (pull ~5 GB, tiktoken/HF, chaves API, compose) | evidência bloqueada por ambiente | núcleo offline-first; B04 com corpus+char-level locais e tiktoken/HF só em trilha opcional; pesos/API/Docker em trilha externa com BLOCKED honesto (lotes L) |
| números do legado sem execução (loss, ~1e-7, tabelas VRAM/quant, SimpleQA, custos) | claim sem evidência | quarentena: não herdados; B01–B03 rotulam faixas como exemplo variável; SDPA mediu 0.0 (melhor que 1e-7) e ~4× virou nuance "onde a computação domina" |
| dois HTML sem norma + README divergindo do B1 nas refs M05/M06/M08 | navegação/retomada | B01 aplicado (âncora `#b01`, TOC linkado, títulos M05b2/M06b3/M08b4/M09b5 conferidos por grep); companheiro vira anexo do lab no G1 |
| zero seção Fontes e versões | claims sem auditabilidade | B01 aplicado (seção Fontes do Bloco 1); spec §6 como matriz |
| `torch 2.13` citado sem URL/versão | versão não verificada | removido do B01 e do B02; **torch 2.9.1 pinado** (primeira série com wheel cp314; `cuda=False` medido); pyproject renomeado para `m11-lab` |

## Próximo lote

**M11-E concluído. M11 fechado no executável local.** Pela fila do status,
a próxima unidade é **M02A-B07** (falha parcial e qualidade). Fora do
alcance deste ambiente: Ollama/PG/pesos live, QA visual interativo G6 e
revisão Terra/Sol de integração (REL-05) antes do terminal Astra (REL-06).

## Lote M11-S — 14/09/2026 (escopo)

Escopo produzido sem código: `docs/especificacoes/M11-ESPECIFICACAO.md`
(v1.0, 8 blocos, 35 ATs, 20 fontes) e esta rastreabilidade. Verificação
real do orquestrador (CPython 3.14.7):

- `python3 -m unittest discover -s tools -p 'test_*.py'`: **12 passed**;
- `python3 tools/validate_backlog.py`: 422 tarefas atômicas, **0 errors**;
- `python3 tools/backlog_tasks.py --task M11-S`: scope, depende de
  OPS-01, `release_blocking: true`; folhas B01–B08 dependem só de M11-S;
- `python3 tools/check_course.py` no HTML legado: 0 erros
  estruturais/links; 14 ocorrências legadas para revisão contextual.

G0 aprovado nesta data. Nenhum cenário promovido a VERIFICADO; nenhum
gate além de G0 promovido. `PROGRESSO.md` não alterado.

## Lote M11-B01-C — 14/09/2026 (conteúdo)

Bloco 1 reescrito em `M11.html` (~230 linhas: orientação, 4 perguntas
com refs M05b2/M06b3/M08b4/M09b5 conferidas por grep, vocabulário N1,
mapa de exclusões, logprobs, `metrics.py` + SQL canônicos, contraste,
ponte ao lab, síntese, fontes do bloco). Removidos do B01: `.clock`,
caixa `.box.net`, GC/LOH/NuGet/`torch 2.13`, 4 `.step` com comandos;
âncora `#b01` + TOC linkado. Verificação real do orquestrador:

- `python3 tools/check_course.py` no HTML: 0 erros estruturais/links;
  14 → 10 ocorrências legadas (restam B05–B08/companheiro);
- varredura do trecho B01: zero `.box.net`, `clock`, durações,
  conectivos vazios ou pressuposto de stack (`struct` = falso positivo
  de "structured output");
- `python3 tools/validate_backlog.py`: 422 tarefas, **0 errors**.

AT-003/AT-004 seguem ESPECIFICADO (prova nos lotes L/D com execução).
Nenhum gate promovido. `STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md`
não alterados neste lote.

## Lote M11-B01-L — 14/09/2026 (laboratório)

`lab/` criado (flat, caminhos congelados do B01-C): `metrics.py`
verbatim, `pct_incerto.sql`, `tests/` (7 AT-003 + 5 AT-004 + 1
working-copy), `fixtures/calls.json`, `create_working_copy.py`,
`README.md`, `pyproject.toml` + `uv.lock`, `evidence/b01-gates.txt`.
Folha executada em scratch pelo subagente e re-executada verbatim no
repo pelo orquestrador (CPython 3.14.7): `ruff check` e `ruff format
--check` aprovados; `mypy` sem achados (5 arquivos); `pytest -q`:
**13 passed**. Scratch removido; `/tmp` sem resíduos. AT-003 com
oráculos verdes; AT-004 com contrato+matemática verdes e execução PG
BLOCKED (Docker ausente, sem SQLite fingindo PG). Nenhum cenário
promovido a VERIFICADO além dos oráculos citados; nenhum gate promovido.

## Lote M11-B01-D — 14/09/2026 (diagnóstico e checkpoint)

6 linhas `[B01]` na Tabela de Diagnóstico (`None` propagado,
`pct_incerto` NULL, SQL no SQLite, perplexidade absurda, limiar que
"não pega nada", `import metrics`) + subseção `Checkpoint B01`
(6 perguntas AT-001–004 com rubrica 0–2 e condição obrigatória cada,
sem solução entregue). Orquestrador re-executou `uv run pytest -q`:
**13 passed**. Decisão: **AT-003 promovido a VERIFICADO** (teoria +
7 oráculos com mutantes + diagnóstico + rubrica, tudo revisado);
AT-004 parcial (PG BLOCKED honesto); AT-001/002 aguardam B02-L.
G3 segue PENDENTE no módulo. `STATUS-IMPLEMENTACAO-CURSO.md` e
`PROGRESSO.md` não alterados neste lote.

## Lote M11-B02-C — 14/09/2026 (conteúdo)

Bloco 2 reescrito no companheiro `lab-transformer-do-zero.html`
(~230 linhas: orientação, tensor B/T/C, 3 operações, autograd que soma,
loop de 5 passos, Adam/AdamW, colapso sem ativação, overfitting,
`regressao.py` + `nao_linear.py` canônicos, ponte, síntese, fontes).
Desvio honesto registrado: a ferramenta lista `M11.html` como saída,
mas a spec §1 define o companheiro como anexo do lab B02–B04;
escrever a teoria no principal duplicaria o bloco. Removidos do B02:
`.clock`, 3 caixas `.box.net`, setup com comandos, 3 `.step`,
`torch 2.13`, analogias PID/retry/EF. Correções do orquestrador com
registro: SVG do ciclo preservado (o diff o omitia); TOC linkado com
`#b02`; inserção indevida de seção duplicada do B01 rejeitada e
removida antes de integrar. Verificação: `check_course.py` no
companheiro com 0 erros; varredura do trecho B02 com zero ocorrências
proibidas. AT-001/002/005–007 seguem ESPECIFICADO (prova na B02-L).
Nenhum gate promovido.

## Lote M11-B02-L — 14/09/2026 (laboratório)

`lab/regressao.py` + `lab/nao_linear.py` verbatim (zero divergência,
mypy strict limpo sem retoque), torch **2.9.1** pinado com `uv.lock`
regenerado, 10 testes novos (seed reproduz/diverge, converge/diverge,
forma errada levanta, MLP<<reta, mutante sem-Tanh≈reta, broadcast).
Orquestrador re-executou verbatim: ruff + format + mypy (10 arquivos)
verdes; `pytest -q` **23 passed em 8.52s** (13 B01 intactos).
Medido: feliz 8.7459→0.0127 (w=3.00, b=2.01); quebrado 3.0697 sem nan;
seno reta 0.1657 vs MLP 0.0045. **Correção honesta com registro:**
"explode até nan" não se confirma neste ambiente — spec AT-002, teoria
B02 e Q6 do checkpoint B01 emendados para "diverge (até nan)"; o teste
aceita nan OU perda > 0.5. Scratch removido. Decisão: **AT-001, AT-002,
AT-005, AT-006, AT-007 promovidos a VERIFICADO**; G2 parcial estendido
ao B02. `STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md` não alterados.

## Lote M11-B02-D — 14/09/2026 (diagnóstico e checkpoint)

7 linhas `[B02]` no diagnóstico (feliz longe de 0.01, 3.07 sem nan,
semente sem ressemeadura, "must match", MLP≈reta, `import regressao`,
índice CPU no macOS) + correção da linha legada do `zero_grad` para a
nuance medida + subseção `Checkpoint B02` (6 perguntas AT-001/002/
005–007 com rubrica 0–2, ancoradas nos números medidos). Orquestrador
re-executou `uv run pytest -q`: **23 passed**. VERIFICADO confirmado
para AT-001/002/005/006/007. G3 segue PENDENTE no módulo.
`STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md` não alterados.

## Lote M11-B03-C — 14/09/2026 (conteúdo)

Bloco 3 reescrito no companheiro (~230 linhas: orientação, polissemia,
QKV, fórmula peça por peça, softmax+contraste+estabilidade, SDPA/
FlashAttention, custo/TTFT com 0.7², multi-head, 3 referências
canônicas, ponte, síntese, fontes). Removidos: `.clock`, caixa Roslyn,
2 práticas com comandos, números sem medição (16,7M células, 40s/80s,
desconto 10×) — substituídos por varredura até 1024 e rótulo variável.
Correções do orquestrador com registro: partição do diff em 10 blocos
após sobreposição de intervalos na entrega; prosa ajustada de
128→4096 para 128→1024/64× (coerente com CONTEXTOS do contrato).
Verificação: `check_course.py` 0 erros; varredura B03 zero proibições.
AT-008–011 seguem ESPECIFICADO (prova na B03-L). Nenhum gate promovido.

## Lote M11-B03-L — 14/09/2026 (laboratório)

`lab/atencao.py` + `lab/custo_quadratico.py` (verbatim) +
`lab/multihead.py` (verbatim +1 anotação p/ strict), 11 testes novos
(invariança causal tril/triu, erro 0.0, negativo por máscara, células
exatas, banda larga, forma/contiguous/indivisível). Orquestrador
re-executou verbatim: ruff + format + mypy (16 arquivos) verdes;
`pytest -q` **34 passed em 2.09s** (23 anteriores intactos). Medido:
erro 0.00e+00; (4,32,128) e 65536 params; razões 1.74×/1.79×/3.39×.
**Correções honestas com registro:** 3 anotações de tipagem emendadas
no HTML (comportamento idêntico); "~4×" com nuance "onde a computação
domina" na teoria, síntese e spec AT-010; negativo por tolerância
trocado por negativo por máscara (allclose 1e-12 passa com 0.0).
Scratch removido. Decisão: **AT-008–011 promovidos a VERIFICADO**; G2
parcial estendido ao B03. `STATUS-IMPLEMENTACAO-CURSO.md` e
`PROGRESSO.md` não alterados.

## Lote M11-B03-D — 14/09/2026 (diagnóstico e checkpoint)

7 linhas `[B03]` no diagnóstico (1e-1, 0.0-vácuo, 1.79×, ln(vocab),
is_causal esquecido, stride, indivisível) + subseção `Checkpoint B03`
(6 perguntas AT-008–011 com rubrica 0–2, ancoradas nos medidos).
Orquestrador re-executou `uv run pytest -q`: **34 passed**.
VERIFICADO confirmado para AT-008–011. G3 segue PENDENTE no módulo.
`STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md` não alterados.

## Lote M11-B04-C — 14/09/2026 (conteúdo)

Bloco 4 reescrito no companheiro (~260 linhas: orientação, BPE,
aritmética+mitigação, peças em tabela, 3 arquiteturas, gerar com
multinomial, generalização/holdout, 3 referências canônicas, ponte,
síntese, fontes). Removidos: `.clock`, 2 caixas .NET (lexer/middleware),
3 `.step` com comandos, tiktoken como caminho único, `~/capstone`
hardcoded, 800k params/4.4→1.8/3–8min sem medição. Correção do
orquestrador com registro: âncoras da entrega abreviadas não batiam o
legado — releitura integral e 10 edições com spans exatos; nenhuma
sobra de código legado. Verificação: `check_course.py` 0 erros;
companheiro com **zero** ocorrências legadas; varredura B04 limpa.
AT-012–015 seguem ESPECIFICADO (prova na B04-L). Nenhum gate promovido.

## Lote M11-B04-L — 14/09/2026 (laboratório, construção direta)

Task com rate limit: orquestrador construiu como escritor único
(ownership lab/, sem conflito) e executou os gates. `lab/gpt.py`
(verbatim) + `lab/treinar.py`/`lab/bpe_mini.py` (verbatim + anotações
mínimas p/ strict + pairwise + quebras de linha; HTML emendado nos
mesmos pontos) + `fixtures/corpus.txt` local (9957 chars, vocab 75) +
11 testes (BPE determinístico, gerar diverge/greedy coincide, causal
0.0 vs ablação 0.126, split+deslocamento, treino desce, gap declara
overfitting). Gates: ruff + format + mypy (22 arquivos) verdes;
`pytest -q` **45 passed em 54.97s** (34 anteriores intactos). Medido:
BPE (['1234'],['123','5']); smoke (2,8,64) 4.11; normal 4.42→1.14 /
4.27→1.67 (valid voltou a subir no fim); demo 4.37→0.09 / →1.46.
Correções honestas: threshold da ablação 0.5→0.05 (4 camadas diluem;
discriminação no par 0.0 vs ≠0.0); overfitting por GAP (valid da demo
< valid do normal: corpus menor). Decisão: **AT-012–015 promovidos a
VERIFICADO**; G2 parcial estendido ao B04. STATUS e PROGRESSO intactos.

## Lote M11-B04-D — 14/09/2026 (diagnóstico e checkpoint)

7 linhas `[B04]` no diagnóstico + subseção `Checkpoint B04` (5 perguntas
AT-012–015 com rubrica 0–2, ancoradas nos medidos). Orquestrador
re-executou `uv run pytest -q`: **45 passed**. VERIFICADO confirmado
para AT-012–015. G3 segue PENDENTE no módulo. STATUS e PROGRESSO
intactos.

## Lote M11-B05-C — 14/09/2026 (conteúdo)

Bloco 5 reescrito (~250 linhas: orientação, 3 etapas por efeito,
RLHF vs DPO, sycophancy como incentivo, template como fio, alucinação
em 2 partes com Goodhart, sampling por dentro, 4 referências stdlib,
ponte, síntese, fontes). Removidos: `.clock`, 2 caixas .NET, 4 `.step`
com comandos, tabela SimpleQA como evidência (quarentena SRC-M11-19),
`~/lab-transformer` e perda 0.81/1.7 sem medição. Correção do
orquestrador: menção TryParse residual reescrita de forma neutra.
Verificação: `check_course.py` 0 erros; varredura B05 limpa.
AT-016–019 seguem ESPECIFICADO (prova na B05-L). Nenhum gate promovido.

## Lote M11-B05-L — 14/09/2026 (laboratório, construção direta)

`lab/amostragem.py` + `lab/template_chat.py` + `lab/abstencao.py` +
`fixtures/abstencao.json` verbatim (zero divergência), só stdlib, sem
modelo/rede. 13 testes novos (ordem/entropia/top1, T=0 greedy,
render/diagnóstico com 2ª família via monkeypatch, rubrica e honesto
3.5 > chutador -5.0). Gates: ruff + format + mypy (28 arquivos) verdes;
`pytest -q` **58 passed em 55.71s** (45 anteriores intactos). Medido:
H 0.476→1.521, top1 0.817→0.387 (legado dizia 0.7/1.7: exemplo variável).
Correções honestas: resposta acentuada fora do conjunto do contrato
(fronteira documentada); template-errado exige marcador próprio +
estranho. Decisão: **AT-016–019 promovidos a VERIFICADO**; G2 parcial
estendido ao B05. STATUS e PROGRESSO intactos.

## Lote M11-B05-D — 14/09/2026 (diagnóstico e checkpoint)

6 linhas `[B05]` no diagnóstico (entropia fora do legado, soma ≠1.0,
T=0 bit a bit, template com typo, acento, honesto vs chutador) +
subseção `Checkpoint B05` (6 perguntas AT-016–019 com rubrica 0–2,
ancoradas nos medidos). Orquestrador re-executou `uv run pytest -q`:
**58 passed**. VERIFICADO confirmado para AT-016–019. G3 segue
PENDENTE no módulo. STATUS e PROGRESSO intactos.

## Lote M11-B06-C — 14/09/2026 (conteúdo)

Bloco 6 reescrito (~230 linhas: orientação, 4 faixas de licença + ADR,
conta VRAM com fórmula, GGUF/K-quants/imatrix, perda não-uniforme com
quarentena SRC-M11-20, 2 referências stdlib, ponte, síntese, fontes).
Removidos: `.clock`, caixa .NET working-set, 5 `.step` (calculadora
antiga, install Ollama, pull 5GB, run verbose, ps), tabelas VRAM/quant
sem medição (13 configs + por-tarefa), vazões 5-120 tok/s, qwen3:8b.
Âncoras conferidas uma a uma; spans exatos do legado. Verificação:
`check_course.py` 0 erros; varredura B06 limpa (M11.html com 5 legadas:
B07/B08). AT-020–023 seguem ESPECIFICADO (prova na B06-L). Sem gate.

## Lote M11-B06-L — 14/09/2026 (laboratório, construção direta)

`lab/orcamento_vram.py` + `lab/licencas.py` verbatim (zero divergência,
strict limpo sem retoque) + 9 testes (6.82 vs 69.82 GB, KV dobra,
KeyError, CLI, 4 faixas + vereditos). Gates: ruff + format + mypy
(32 arquivos) verdes; `pytest -q` **67 passed em 53.77s** (58 anteriores
intactos). CLI medida confirma os limiares. Decisão: **AT-020 e AT-023
promovidos a VERIFICADO**; AT-021/022 em construção local + quarentena
(exigem pesos reais; prova por matriz no B08). G2 parcial estendido ao
B06. STATUS e PROGRESSO intactos.

## Lote M11-B06-D — 14/09/2026 (diagnóstico e checkpoint)

6 linhas `[B06]` no diagnóstico (demo vs produção, KV imóvel, KeyError,
própria≠liberado, Q3/perplexidade, NC baixado) + subseção `Checkpoint B06`
(6 perguntas AT-020–023 com rubrica 0–2, ancoradas em 6.82/69.82 e nas
4 faixas). Orquestrador re-executou `uv run pytest -q`: **67 passed**.
VERIFICADO confirmado para AT-020/023; AT-021/022 em quarentena.
G3 segue PENDENTE no módulo. STATUS e PROGRESSO intactos.

## Lote M11-B07-C — 14/09/2026 (conteúdo)

Bloco 7 reescrito (~240 linhas: orientação, porta M05/DIP, 4 opções com
tabela preservada, batching/PagedAttention, 3 armadilhas com validar_local,
knobs+política host/auth, provider atrás da porta, 2 referências, ADR-0005
por etapa com tabela preservada, síntese, fontes). Removidos: `.clock`,
caixa ILogger, 5 `.step` (curl, provider SDK, factory, extrator, ADR),
env Ollama, tabela VRAM duplicada. Correções do orquestrador: partição
âncora-a-âncora rejeitada (deixaria legados) — 12 edições com spans
exatos; ref1 sem corpo na entrega reconstruída da evidência (imports
collections.abc); TOC linkado com #b07. Verificação: `check_course.py`
0 erros; varredura B07 limpa (M11.html com 3 legadas: B08).
AT-024–029 seguem ESPECIFICADO (prova sem servidor na B07-L). Sem gate.

## Lote M11-B07-L — 14/09/2026 (laboratório, construção direta)

`lab/provedor_local.py` + `lab/dimensionar_local.py` verbatim (imports
collections.abc por UP035, sem efeito semântico) + 11 testes (knobs,
host/auth, fake com usage/custo/logprobs, recomendar pleno/reduzido/
API, parallel ×KV). Gates: ruff + format + mypy (36 arquivos) verdes;
`pytest -q` **78 passed em 54.50s** (67 anteriores intactos). Medido:
Uso(10,5,0.0), conf -0.15; Q8_0 pleno em 24 GB, Q6_K reduzido em 8 GB,
API em 4 GB. Decisão: **AT-024–029 promovidos a VERIFICADO** (oráculos
sem servidor; live BLOCKED com registro). G2 parcial estendido ao B07.
STATUS e PROGRESSO intactos.

## Lote M11-B08-L — 14/09/2026 (escrita direta)
`lab/custo_local.py` + `lab/matriz_local.py` + 16 testes + evidência; README/pyproject estendidos. Gates re-executados pelo orquestrador: ruff + format + mypy (40) verdes; **94 passed**. Medido: local US$4.24/Mtok > API 3.00 em baixo volume; break-even por cenário; LoRA r16 = 0.78%. Decisão: **AT-030–035 VERIFICADO** (estrutura + fórmula locais; live BLOCKED). G2 parcial total B01–B08.

## Lote M11-B08-D — 14/09/2026 (direto)
6 linhas `[B08]` + `Checkpoint B08` (6 perguntas AT-030–035). pytest: 94 passed (reaproveitado do B08-L, sem mudança no lab). G3: rubricas B01–B08 completas; checkpoint global pendente do M11-E.

## Lote M11-E — 14/09/2026 (consolidação editorial)
Laboratório guiado M11 final (objetivo/limite, cópia descartável, mapa, 8 passos, validação, limpeza); TOC com âncoras nos 8 blocos + companheiro; CSS com rolagem de tabela em telas estreitas; stack ref da intro removida; checkpoint global com SimpleQA em quarentena e entregáveis no lab/ + BLOCKED; README atualizado. QA: serve 200 via localhost nos 2 HTML; âncoras b01–b08 verificadas; 0 erros. Decisão: **G1/G3/G4 APROVADOS; G2/G5 PARCIAIS (live BLOCKED); G6 PENDENTE** (visual interativo). STATUS atualizado; PROGRESSO intacto.
