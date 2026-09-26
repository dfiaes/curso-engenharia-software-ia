# Lab M11 B01–B08 — logprobs, tensores, atenção, transformer, amostragem, VRAM, serving e avaliação honesta

Instrumentação de confiança por logprobs no gateway: `metrics.py`
(resumo por geração) + `pct_incerto.sql` (comparação de chamadas).
Python 3.14 canônico, gerenciado com `uv`. **Núcleo offline-first,
sem rede/conta/GPU**: só stdlib no runtime do B01; o B02/B03 usa torch
local em CPU (ver nota do torch abaixo); PostgreSQL é oráculo
externo e NÃO é executado aqui (exige Docker).

Módulo flat (sem pacote): `import metrics` (e `import regressao`,
`import nao_linear`, `import atencao`, `import custo_quadratico`,
`import multihead`) direto da raiz, via `pythonpath=["."]` no pytest.

## Comandos de qualidade (oráculos do programa)

    uv sync
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy
    uv run pytest -q

## O que cada parte prova

| Arquivo | Cenários | Ambiente |
|---|---|---|
| `metrics.py` | contrato AT-003 (verbatim do Bloco 1) | stdlib local |
| `tests/test_metrics.py` | vazio→None, limiar −1.0, perplexidade, mutantes (AT-003) | sem serviços |
| `pct_incerto.sql` | contrato AT-004 (verbatim do Bloco 1) | PostgreSQL (BLOCKED sem Docker) |
| `tests/test_pct_incerto_sql.py` | contrato estático + paridade da matemática (AT-004) | sem serviços |
| `fixtures/calls.json` | chamadas sintéticas locais e rotuladas | fixture |
| `regressao.py` | contrato AT-001/AT-002 (verbatim do Bloco 2) | torch CPU local |
| `nao_linear.py` | contrato AT-007 (verbatim do Bloco 2) | torch CPU local |
| `tests/test_regressao.py` | semente reproduz/diverge (AT-001), converge/diverge (AT-002), forma errada falha (AT-006) | torch CPU local |
| `tests/test_nao_linear.py` | MLP com Tanh << reta; mutante sem ativação ≈ reta (AT-007) | torch CPU local |
| `tests/test_formas.py` | broadcast (4,1)+(1,4)→(4,4) + guarda de forma (AT-005/AT-006) | torch CPU local |
| `atencao.py` | contrato AT-008/AT-009 (Bloco 3; +3 linhas de tipagem p/ mypy-strict) | torch CPU local |
| `custo_quadratico.py` | contrato AT-010 (verbatim do Bloco 3) | torch CPU local |
| `multihead.py` | contrato AT-011 (Bloco 3; +1 linha de tipagem p/ mypy-strict) | torch CPU local |
| `tests/test_atencao.py` | manual==SDPA erro 0.0 (AT-009); tril não vaza / triu vaza (AT-008) | torch CPU local |
| `tests/test_custo.py` | células T*T exatas + banda larga (AT-010) | torch CPU local |
| `tests/test_multihead.py` | forma (4,32,128) + contiguous + indivisível (AT-011) | torch CPU local |
| `gpt.py` | contrato AT-013/AT-015 (Bloco 4; verbatim) | torch CPU local |
| `treinar.py` | contrato AT-014 (Bloco 4; +1 linha de tipagem p/ mypy-strict) | torch CPU local |
| `bpe_mini.py` | contrato AT-012 (Bloco 4; +1 anotação e quebra de linha p/ lint) | stdlib local |
| `fixtures/corpus.txt` | código Python local p/ treino char-level 90/10 | fixture |
| `tests/test_bpe_mini.py` | 1234→1 segmento vs 1235→2 distintos, determinismo (AT-012) | sem serviços |
| `tests/test_gpt.py` | gerar diverge / greedy coincide (AT-013); causal não vaza, ablação vaza (AT-015) | torch CPU local |
| `tests/test_treinar.py` | split+deslocamento; treino desce; gap declara overfitting (AT-014) | torch CPU local |
| `amostragem.py` | contrato AT-016/AT-017 (verbatim do Bloco 5) | stdlib local |
| `template_chat.py` | contrato AT-018 (verbatim do Bloco 5) | stdlib local |
| `abstencao.py` | contrato AT-019 (verbatim do Bloco 5) | stdlib local |
| `fixtures/abstencao.json` | 5 casos locais rotulados (3 ABSTENCAO + 2) | fixture |
| `tests/test_amostragem.py` | ordem preservada, entropia monotônica, T=0 greedy (AT-016/017) | sem serviços |
| `tests/test_template_chat.py` | render/detecta/diagnostica, errado com 2ª família (AT-018) | sem serviços |
| `tests/test_abstencao.py` | rubrica, grader, honesto 3.5 > chutador -5.0 (AT-019) | sem serviços |
| `orcamento_vram.py` | contrato AT-020 (verbatim do Bloco 6) | stdlib local |
| `licencas.py` | contrato AT-023 (verbatim do Bloco 6) | stdlib local |
| `tests/test_orcamento_vram.py` | 8B Q4 6.82 vs 69.82 GB, KV dobra, KeyError, CLI (AT-020) | sem serviços |
| `tests/test_licencas.py` | 4 faixas + vereditos, NC/destilado bloqueiam (AT-023) | sem serviços |
| `provedor_local.py` | contrato AT-024–028 (verbatim do Bloco 7) | stdlib local |
| `dimensionar_local.py` | contrato AT-029 (verbatim do Bloco 7) | stdlib local |
| `tests/test_provedor_local.py` | knobs, host/auth, fake preserva usage/custo 0 (AT-024–028) | sem serviços |
| `tests/test_dimensionar_local.py` | maior quant / reduzido / API, parallel ×KV (AT-029) | sem serviços |
| `custo_local.py` | contrato AT-033/AT-035 (verbatim do Bloco 8) | stdlib local |
| `matriz_local.py` | contrato AT-030–032/AT-034–035 (verbatim do Bloco 8, sem `main`) | stdlib local |
| `tests/test_custo_local.py` | HW amortizado perde da API em baixo volume; break-even (AT-033/035) | sem serviços |
| `tests/test_matriz_local.py` | par (modelo,formato), escada, tabela, LoRA <1%, break-even (AT-030–032/034–035) | sem serviços |

## torch: versão fixada e nota do índice CPU

Versão fixada: **`torch==2.9.1`** (primeira série com wheel `cp314`;
medido `torch.__version__ == 2.9.1`, `cuda.is_available() == False`).
Todo o código do lab é CPU-only (nenhum `.to(cuda)`); GPU ausente ou
presente não muda o resultado.

Sobre o tamanho do download: o pin usa o PyPI para que o mesmo lock
sirva macOS e Linux. Nesta máquina (macOS ARM64) o wheel do PyPI já é
só-CPU (74,4 MB de download; 364 MB instalado). Em Linux x86_64 o
mesmo pin baixa ~900 MB porque o wheel do PyPI embute CUDA (a GPU
continua sem uso no lab). Quem quiser economizar em Linux x86_64 pode
instalar pela roda só-CPU em `https://download.pytorch.org/whl/cpu`,
mas o `uv.lock` versionado NÃO faz isso: o índice CPU não publica
wheels para macOS, de modo que forçar `[[tool.uv.sources]]` para lá
quebraria o `uv sync` no macOS. Registro honesto: portabilidade do
lock primeiro; economia de banda em Linux como passo manual opcional.

## Cópia de trabalho

Não edite esta referência diretamente:

    python3 create_working_copy.py

## Limite honesto

`pct_incerto.sql` executa SOMENTE no PostgreSQL do Capstone (Docker).
Sem Docker nesta máquina, o oráculo PG está BLOCKED — os testes guardam
contrato + matemática e não fingem execução PG.

B03 (medido em CPU, torch 2.9.1; detalhe em `evidence/b03-gates.txt`):
`comparar_com_sdpa()` devolve erro 0.0 (bit-idêntico), melhor que a casa
de 1e-7 rotulada no Bloco 3 como exemplo variável; o negativo honesto
troca a máscara (causal vs não-causal difere em 1.95), não a tolerância.
A varredura publica células T*T exatas (4× por dobra); o "~4× de tempo
por dobra" vale onde a computação domina (512→1024 mede ~3.2×) — em
T≤512 o overhead domina (razões ~1.3–2.5×) e a banda larga [1.0×, 8.0×]
absorve o cronômetro sub-ms.

B06 (calculado pela fórmula, execução real da CLI; `evidence/b06-gates.txt`):
8B Q4_K_M ctx 8192 batch 1 → 4.32 + 1.00 + 1.50 = 6.82 GB;
ctx 131072 batch 4 → KV 64.00, total 69.82 GB. Licenças: Apache/MIT
liberado, NC/destilado bloqueado, própria exige leitura. AT-021/022
(quant por tarefa) exigem pesos reais: construção local + quarentena,
prova por matriz no B08; pull/medida Ollama na trilha externa.

B07 (transporte fake + fórmula; `evidence/b07-gates.txt`): adapter
preserva usage, zera custo, propaga logprobs e força num_ctx/keep_alive;
localhost aprova, 0.0.0.0 sem proxy levanta; dimensionar devolve maior
quant, ctx reduzido ou API. Servidor live (Ollama/Docker/GPU) ausente:
oráculos com pull/run/ps BLOCKED com registro.

B08 (fórmula + dict puro; `evidence/b08-gates.txt`): `custo_local.py`
com HW amortizado perde da API em baixo volume (exemplo: total ~4.24
contra 3.00 US$/Mtok); `matriz_local.py` guarda um `ResultadoExec` por
combinação e imprime taxa/p50/p95/custo; formato como par
(modelo,formato) em dict puro; LoRA r=16/D=4096 dá 0.78% treinável
(degrau 6 de 6, sem treino); break-even aritmético exato. Pesos,
servidor e API de comparação na trilha externa (live BLOCKED).

B04 (medido em CPU, torch 2.9.1; detalhe em `evidence/b04-gates.txt`):
BPE toy publica `1234→['1234']` e `1235→['123','5']` sem tiktoken/rede;
`gerar()` com mesma semente DIVERGE (amostra) e o controle greedy
coincide; causal diff-em-t 0.0, ablação sem máscara 0.126 (limiar 0.05
com registro); treino normal 4.42→1.14 com valid 4.27→1.67 (valid
voltou a subir no fim); demo 4.37→0.09 com valid 1.46 — overfitting
declarado pelo GAP treino/val, não por valor absoluto (a valid da demo
é menor que a do normal: corpus menor é mais fácil). Suite total ~55s
(contrato PASSOS/demo mantidos, sem redução).
