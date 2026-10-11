# M11 · Fundamentos de ML/DL e modelos locais

**Fase 4** · Pré-requisitos: F03, M05. Estado: [STATUS](../../STATUS.md).

## Visão geral

Você não vai treinar um modelo de produção. Vai parar de tratar o modelo como caixa preta.

Nos dez módulos anteriores, quatro perguntas ficaram com uma resposta de superfície — não *errada*, mas **inacionável**. Este módulo fecha as quatro:

| Pergunta aberta | Onde apareceu | Resposta na hora | Onde fecha |
|---|---|---|---|
| Por que dobrar o contexto custa mais que o dobro? | M08 b4 | "atenção é quadrática" | Bloco 3 — matriz T×T implementada e medida (~4× onde computação domina) |
| Por que o extrator erra ao *contar* e acerta ao *descrever*? | M05 b2 | "LLM não é bom em contas" | Blocos 4 e 5 — tokenização BPE + amostragem |
| Por que temperatura 0 não elimina alucinação? | M06 b3 | "reduz, não elimina" | Bloco 5 — o que temperatura faz com a distribuição |
| Por que um modelo bom em código trava em modo agente? | M09 b5 | "suporte a tools varia" | Bloco 8 — BFCL, sensibilidade a formato, modelo ≠ harness |

E abre uma porta comercial que a API não abre: **o cliente cujo código-fonte não pode sair da rede**.

## Conteúdo do módulo

- **Material principal:** [`M11.html`](M11.html) — blocos 1 e 5 a 8, laboratório guiado final, tabela de diagnóstico e checkpoint dos oito blocos
- **Arquivo companheiro:** [`lab-transformer-do-zero.html`](lab-transformer-do-zero.html) — blocos 2 a 4, o laboratório de PyTorch (anexo de execução)
- **Referência executável:** [`lab/`](lab/) — módulos, testes, fixtures e evidências (94 testes verdes; PG/servidor live como BLOCKED registrado)
- **Carga:** 8 blocos de 2h (16h, estimativa editorial, sem sessão obrigatória)
- **Pré-requisito:** F03 e M05 (gateway); usa também M06 (evals) e M08 (orçamento de contexto)

> **Ordem de leitura.** Termine o bloco 1 no arquivo principal → abra o companheiro e faça os blocos 2 a 4 → volte para o bloco 5. O laboratório está separado pelo mesmo motivo que o M00 separou o bloco 4: é longo, autocontido, e **é a única parte do curso que não gera peça do Capstone** — existe para entendimento. Tudo roda em CPU; GPU só deixa mais rápido.

## Estrutura dos blocos

1. **Bloco 1:** Por que o sênior precisa do fundamento — vocabulário com mecanismo e limite; o **mapa honesto do que não estudar**; logprobs como instrumento de confiança (leitura; execução no laboratório guiado).
2. **Bloco 2** *(lab)*: Tensor, gradiente e o loop de treino — B/T/C, produto escalar, matmul, broadcasting; autograd como grafo dinâmico que soma; os cinco passos; regressão `y = 3x + 2`, quebra sem `zero_grad`, seno linear vs MLP.
3. **Bloco 3** *(lab)*: Atenção — Q/K/V, `sqrt(d)`, máscara causal, softmax; equivalência manual vs SDPA; custo O(n²) medido; multi-head sem loop.
4. **Bloco 4** *(lab)*: O transformer completo — BPE offline e **por que a aritmética falha**; residual Pre-LN, LayerNorm, MLP; as três arquiteturas por máscara; GPT mínimo treinado sobre corpus local; overfitting declarado pelo gap treino/val.
5. **Bloco 5:** Pré-treino → SFT → RLHF/DPO; **chat template como formato de fio**; **por que ele alucina** (origem estatística + incentivo; SimpleQA em quarentena); temperatura/top-p/top-k por dentro; **categoria `abstencao` com rubrica assimétrica**.
6. **Bloco 6:** Pesos abertos vs código aberto (4 faixas + ADR); a **conta de VRAM** (pesos + overhead + cache de KV); GGUF, K-quants e imatrix; perda **não uniforme por tarefa** (raciocínio encadeado quebra primeiro; perplexidade não aprova quant; estudo externo em quarentena).
7. **Bloco 7:** Ollama × llama.cpp × LM Studio × vLLM; **as três armadilhas** (ctx curto, parallel 1, unload 5 min) com validação local; provider atrás da porta do M05 (transporte injetável, sem servidor); ADR-0005 **por etapa do pipeline**.
8. **Bloco 8:** **Modelo ≠ agente ≠ harness** — sete competências; BFCL e sensibilidade a formato (par modelo-formato); **escada de 8 degraus**; custo local com hardware amortizado; **LoRA/QLoRA e a escada de 6** (fine-tuning é o degrau 6 de 6).

## Entregáveis (núcleo executável no `lab/`; live na trilha externa)

- `lab/` com 94 testes verdes: atenção equivalente a SDPA, GPT mínimo com trajetória treino/val, matriz e break-even, rubrica de abstenção.
- `metrics.py` + `pct_incerto.sql` (este executa só no PostgreSQL do Capstone).
- `orcamento_vram.py`, `custo_local.py`, `dimensionar_local.py` com números calculados na máquina.
- `provedor_local.py` atrás da porta (transporte injetável; servidor live é trilha externa).
- Categoria `abstencao` com rubrica assimétrica e honesto &gt; chutador medidos.
- Tabela comparativa por categoria (p50, p95, custo) sobre mesma carga; break-even por cenário.
- `docs/adr/0005-modelos-locais.md` (peça Capstone, integração após spec própria) e perfil `local` no compose (trilha externa, BLOCKED sem Docker).

## Fundamentos reciclados neste módulo

A lei das abstrações que vazam · modelo mental × modelo de implementação · álgebra linear aplicada (produto escalar como concordância, matriz como transformação) · otimização iterativa e o critério de parada · estabilidade numérica em ponto flutuante · generalização, overfitting e o conjunto que você não olha · **Lei de Goodhart: a métrica que você escolhe é o comportamento que você compra** · precisão numérica como decisão de produto · inversão de dependência, cobrando o juro · benchmark honesto (mesma carga, aquecimento, dispersão, fronteira declarada).
