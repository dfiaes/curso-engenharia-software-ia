# M11 · Fundamentos de ML/DL e modelos locais

## Visão geral

Você não vai treinar um modelo de produção. Vai parar de tratar o modelo como caixa preta.

Nos dez módulos anteriores, quatro perguntas ficaram com uma resposta de superfície — não *errada*, mas **inacionável**. Este módulo fecha as quatro:

| Pergunta aberta | Onde apareceu | Resposta na hora | Onde fecha |
|---|---|---|---|
| Por que dobrar o contexto custa mais que o dobro? | M08 b3 | "atenção é quadrática" | Bloco 3 — você implementa a matriz T×T e mede ~4× por dobra |
| Por que o extrator erra ao *contar* e acerta ao *descrever*? | M05 b4 | "LLM é ruim em contas" | Blocos 4 e 5 — tokenização BPE + amostragem |
| Por que temperatura 0 não elimina alucinação? | M06 b5 | "reduz, não elimina" | Bloco 5 — o que temperatura faz com a distribuição |
| Por que um modelo bom em C# trava em modo agente? | M09 b5 | "suporte a tools varia" | Bloco 8 — BFCL V4, sensibilidade a formato, modelo ≠ harness |

E abre uma porta comercial que a API não abre: **o cliente cujo código-fonte não pode sair da rede**.

## Conteúdo do módulo

- **Material principal:** [`M11.html`](M11.html) — blocos 1 e 5 a 8, mais tabela de diagnóstico e checkpoint dos oito blocos
- **Arquivo companheiro:** [`lab-transformer-do-zero.html`](lab-transformer-do-zero.html) — blocos 2 a 4, o laboratório de PyTorch
- **Carga:** 8 blocos de 2h (16h)
- **Pré-requisito:** M05 (gateway), M06 (evals) e M08 (orçamento de contexto)

> **Ordem de leitura.** Termine o bloco 1 no arquivo principal → abra o companheiro e faça os blocos 2 a 4 → volte para o bloco 5. O laboratório está separado pelo mesmo motivo que o M00 separou o bloco 4: é longo, autocontido, e **é a única parte do curso que não gera peça do Capstone** — existe para entendimento. Tudo roda em CPU; GPU só deixa mais rápido.

## Estrutura dos blocos

1. **Bloco 1:** Por que o sênior precisa do fundamento — o nível certo de abstração para furar; vocabulário fixado (logit, softmax, temperatura, tensor); o **mapa honesto do que não estudar** e por quê; prática: instrumentar o gateway com **logprobs** e medir confiança.
2. **Bloco 2** *(lab)*: Tensor, gradiente e o loop de treino — produto escalar como a operação única do campo; autograd como *expression tree* que sabe derivar; os cinco passos do loop; treinar `y = 3x + 2` e ver o loss cair; quebrar de propósito removendo `zero_grad()`.
3. **Bloco 3** *(lab)*: Atenção — Q/K/V, `sqrt(d_k)`, máscara causal, softmax; implementar à mão e **provar que bate com `scaled_dot_product_attention` em ~1e-7**; medir o O(n²) na própria máquina; multi-head com cabeça como dimensão de lote.
4. **Bloco 4** *(lab)*: O transformer completo — BPE e **por que a aritmética falha**; residual como pipeline de middleware; LayerNorm e MLP; as três arquiteturas (encoder-only / decoder-only / encoder-decoder) e por que não são intercambiáveis; treinar ~800k parâmetros sobre o próprio código do Capstone; ver overfitting acontecer.
5. **Bloco 5:** Pré-treino → SFT → RLHF/DPO e o que cada etapa faz com o comportamento; **chat template como wire format**; **por que ele alucina** (Kalai et al. 2025: origem estatística + incentivo de avaliação, com os números do SimpleQA); temperatura/top-p/top-k por dentro; prática: **categoria `abstencao` nos evals com rubrica assimétrica**.
6. **Bloco 6:** Pesos abertos ≠ código aberto (taxonomia de licença); a **conta de VRAM** (pesos + ativações + cache de KV); GGUF, K-quants e imatrix; **os números reais da perda por quantização** — e o achado que quase todo guia erra: perplexidade não prevê comportamento por tarefa, e 3 bits derruba **−9,3 pontos em GSM8K** enquanto senso comum fica intacto.
7. **Bloco 7:** Ollama × llama.cpp × LM Studio × vLLM; **as três armadilhas do Ollama** (contexto 4.096 truncando em silêncio, 1 requisição paralela, descarga em 5 min); o provedor local entrando no gateway do M05 com **um arquivo novo e duas linhas**; ADR-0005 com decisão **por etapa do pipeline**.
8. **Bloco 8:** **Modelo ≠ agente ≠ harness** — as sete competências do modo agente; **BFCL V4** e sensibilidade a formato (26 configurações; JSON Schema > XML > Python na documentação); a **escada de diagnóstico de 8 degraus** em que trocar de modelo é o último; custo local honesto com hardware amortizado; **LoRA/QLoRA e a escada de decisão** em que fine-tuning é o degrau 6 de 6.

## Entregáveis

- `~/lab-transformer/` com atenção implementada à mão batendo com o PyTorch, e o GPT minúsculo treinado (loss de ~4,4 para <1,8).
- `app/services/llm/metrics.py` + colunas de logprob em `llm_calls` — confiança medida em toda chamada.
- `app/services/llm/providers/ollama.py` + o `git diff --stat` provando que **só um arquivo novo e duas linhas mudaram**.
- `tools/orcamento_vram.py` e `tools/custo_local.py` — as duas calculadoras (também material de proposta comercial).
- Categoria `abstencao` nos evals com rubrica assimétrica (certo +1, abstenção +0,5, erro −1) e o antes/depois dos prompts.
- Tabela comparativa API × local-Q4 × local-Q8 por categoria, com p50, p95 e custo; mais o **ponto de equilíbrio** em relatórios/mês.
- `docs/adr/0005-modelos-locais.md` com o quadro por etapa e o gatilho de revisão.
- Perfil `local` no compose: `docker compose --profile local up` sobe API + Postgres + Ollama, com os evals passando.

## Fundamentos reciclados neste módulo

A lei das abstrações que vazam · modelo mental × modelo de implementação · álgebra linear aplicada (produto escalar como concordância, matriz como transformação) · otimização iterativa e o critério de parada · estabilidade numérica em ponto flutuante · generalização, overfitting e o conjunto que você não olha · **Lei de Goodhart: a métrica que você escolhe é o comportamento que você compra** · precisão numérica como decisão de produto · inversão de dependência, cobrando o juro · benchmark honesto (mesma carga, aquecimento, dispersão, fronteira declarada).
