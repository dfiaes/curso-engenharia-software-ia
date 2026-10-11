# M11 — especificação de escopo e evidência

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.0 · **Data-base:** 14/09/2026 · **Estado:** G0 aprovado; G1 em produção

## 1. Decisão curricular

O M11 ensina o nível de fundamento em que o modelo deixa de ser caixa
preta para o sênior: tensor, gradiente e loop de treino; atenção e seu
preço quadrático; transformer completo com tokenização; pós-treino e
amostragem; pesos abertos, quantização e VRAM; serving local atrás do
gateway do M05; avaliação honesta (modelo ≠ harness ≠ agente) com a
escada que coloca fine-tuning por último. O laboratório é 100% local
com CPU como baseline (GPU só acelera): um transformer mínimo em
PyTorch treinado sobre o próprio código Python do Capstone,
equivalência mão-vs-framework medida, instrumentação de logprobs no
gateway, calculadoras de VRAM e custo, provider local atrás da porta do
M05 e categoria de abstenção nos evals. Download de pesos, perfil
Compose com Ollama, chaves de API para comparação e qualquer conta são
trilha externa opcional, nunca evidência obrigatória.

O lab PyTorch dos blocos B02–B04 é entendimento, não peça: a única
parte do curso que não gera peça do Capstone, declarado aqui para que
nenhum lote cobre integração onde a spec não promete. O legado em dois
HTML é normalizado nesta spec: o companheiro vira anexo de execução do
lab; as práticas espalhadas consolidam-se no `Laboratório guiado M11`
final em G1.

## 2. Resultado, limites e integração

| Aspecto | Definição |
|---|---|
| Carga | oito blocos de duas horas, total de 16 h |
| Entrada | M05 (gateway, adapters, custo), M06 (evals, graders, calibração), M08 (orçamento de atenção, loop, memória) |
| Saída | transformer mínimo explicado/testado, provider local no gateway, benchmark API×local e relatório com decisão |
| Peça do capstone | `services/llm` (provider local + métricas), `evals/` (categoria abstencao), `docs/adr/0005`, `tools/orcamento_vram.py` + `tools/custo_local.py`; integração só após spec própria |
| Não cobre | RAG vetorial (M07), protocolos MCP/A2A (M09), grafos de execução/conhecimento (M10), produção multi-tenant (M12) |
| Evidência mínima | comandos, versões e saída executada; loss/latência/custo só com ambiente e amostras; perplexidade nunca como substituto de eval por tarefa; acordo de juiz só com conjunto humano |

Referência interna de matemática e dependências do principal: ponte do M11. Vetores, gradientes e a execução necessária são ensinados no percurso M11; ML01/ML05 são somente aprofundamentos opcionais.
## 3. Arquitetura do laboratório

```text
corpus próprio (código Python do Capstone, char-level offline)
  ──► regressão/autograd ──► atenção manual ══ SDPA (oráculo) ──► medida O(n²)
  ──► BPE local ──► GPT mínimo ──► treino CPU ──► holdout (overfitting visível)
gateway M05 ◄── provider local (porta) ◄── servidor local opcional
evals M06 ◄── categoria abstencao (rubrica assimétrica) ◄── matriz API×local
```

A referência fica em `modulos/M11-fundamentos-ml-dl-modelos-locais/lab/`.
O roteiro `Laboratório guiado M11`, no final do HTML, cria cópia de
trabalho em diretório temporário possuído pelo laboratório.

O núcleo obrigatório é offline-first: corpus próprio, tokenização
char-level local e fixtures versionadas; `tiktoken`/pesos externos são
trilha opcional com cache declarado. AT-024–029 e AT-035 exercitam
Ollama/Docker quando disponíveis; sem eles, o lote `-L` constrói o
oráculo e registra `BLOCKED`, nunca `skip` verde.

## 4. Blocos, competências e evidência

| Bloco | Competências observáveis | Evidência planejada |
|---|---|---|
| B01 · fundamento e observabilidade | vocabulário, mapa do que não estudar | logprobs no gateway + limiar |
| B02 · tensores e loop de treino | shape/dtype/device, autograd, 5 passos | regressão + quebra `zero_grad` |
| B03 · atenção e custo quadrático | QKV, `√d`, máscara causal, multi-head | equivalência SDPA + medida O(n²) |
| B04 · tokenização e transformer | BPE, residual, arquiteturas, overfitting | GPT mínimo treinado + holdout |
| B05 · pós-treino e amostragem | SFT/DPO, template, T/top-p/top-k, abstenção | categoria abstencao + rubrica |
| B06 · pesos abertos e quantização | licenças, VRAM/KV, GGUF | `orcamento_vram` + pull/medir |
| B07 · serving local e gateway | Ollama/vLLM, 3 armadilhas, provider | `OllamaProvider` + ADR-0005 |
| B08 · avaliação honesta e fine-tuning | BFCL/formato, escadas, custo, LoRA | matriz API×local + break-even |

## 5. Cenários de aceitação

| ID | Oráculo e caso relevante | Bloco |
|---|---|---|
| M11-AT-001 | seed fixa reproduz loss; seed solta diverge | B01/B02 |
| M11-AT-002 | sem `zero_grad()`, gradientes acumulam e as atualizações diferem; registrar o loss observado sem exigir divergência universal | B02 |
| M11-AT-003 | logprob vazio rende `None`; limiar −1.0 e perplexidade calculados | B01 |
| M11-AT-004 | SQL de `pct_incerto` separa arquivo bem-comportado de estranho | B01 |
| M11-AT-005 | broadcast `(4,1)+(1,4)→(4,4)` detectado por assert de shape | B02 |
| M11-AT-006 | junção de tensores com shape errado falha antes do treino | B02 |
| M11-AT-007 | sem ativação, duas camadas colapsam numa (linear ≈ MLP rasa) | B02 |
| M11-AT-008 | máscara `triu` no lugar de `tril` prende o loss em `ln(vocab)` | B03 |
| M11-AT-009 | atenção manual bate SDPA em ~1e-7 (`atol=1e-5`) | B03 |
| M11-AT-010 | medir custo ao dobrar o contexto em CPU, registrar dispersão e comparar com O(n²) sem exigir multiplicador fixo | B03 |
| M11-AT-011 | `view` após `transpose` exige `contiguous()` | B03 |
| M11-AT-012 | BPE segmenta números vizinhos de forma distinta (`1234` vs `1235`) | B04 |
| M11-AT-013 | `gerar()` amostra via `multinomial`, não escolhe o argmax | B04 |
| M11-AT-014 | treino cai e validação sobe: overfitting declarado com early stop | B04 |
| M11-AT-015 | encoder-only posto para gerar degrada; arquiteturas não intercambiam | B04 |
| M11-AT-016 | temperatura redistribui massa sem inverter a ordem (entropia medida) | B05 |
| M11-AT-017 | T=0 repete o mesmo erro; não é determinístico bit-a-bit | B05 |
| M11-AT-018 | base sem template divaga/não para; instruct com template errado ignora system | B05 |
| M11-AT-019 | rubrica +1/+0,5/−1 derruba o prompt chutador no antes/depois | B05 |
| M11-AT-020 | estimar pesos + KV para configurações declaradas e confrontar com VRAM disponível; registrar se cabe ou excede | B06 |
| M11-AT-021 | comparar quantizações em tarefas e benchmarks declarados; reportar variação por tarefa sem impor perda fixa | B06 |
| M11-AT-022 | perplexidade estável com raciocínio degradado: eval por tarefa decide | B06 |
| M11-AT-023 | licença NC/destilado fechado bloqueia uso comercial no ADR | B06 |
| M11-AT-024 | contexto padrão 4096 trunca em silêncio descartando o system | B07 |
| M11-AT-025 | variar concorrência com `NUM_PARALLEL` declarado e medir fila, p95 e throughput sem exigir explosão | B07 |
| M11-AT-026 | medir cold/warm e descarregamento segundo `keep_alive` e versão declarados; não presumir cinco minutos | B07 |
| M11-AT-027 | `HOST 0.0.0.0` sem auth expõe o servidor; proxy autenticado exigido | B07 |
| M11-AT-028 | `OllamaProvider`: um arquivo novo e duas linhas, `usage` preservado, pytest verde | B07 |
| M11-AT-029 | reproduzir limite de memória na configuração declarada, variar um parâmetro e medir o efeito observado | B07 |
| M11-AT-030 | doc JSON Schema supera Python/XML em tool-calling no mesmo modelo | B08 |
| M11-AT-031 | escada de 8 degraus (template→quant→4 tools) antes de trocar de modelo | B08 |
| M11-AT-032 | matriz API×Q4×Q8 com mesma carga, aquecimento, p50/p95, dispersão e fronteira | B08 |
| M11-AT-033 | calcular break-even com hardware, API e volume declarados; explicar qual opção custa menos no cenário medido | B08 |
| M11-AT-034 | LoRA (<1% treinável) resolve formato/comportamento, não fatos (RAG/tool primeiro) | B08 |
| M11-AT-035 | break-even relatórios/mês + `compose --profile local` com evals verdes | B08 |

## 6. Fontes e versões

| ID | Fonte e uso | Tipo | Risco |
|---|---|---|---|
| SRC-M11-01 | [PyTorch docs](https://pytorch.org/docs/stable/) — Tensor, autograd, `nn`, SDPA | documentação oficial | médio |
| SRC-M11-02 | [Attention Is All You Need](https://arxiv.org/abs/1706.03762) — QKV, atenção, transformer | científica | baixo |
| SRC-M11-03 | [BERT](https://arxiv.org/abs/1810.04805) — encoder-only bidirecional | científica | baixo |
| SRC-M11-04 | [InstructGPT](https://arxiv.org/abs/2203.02155) — SFT + RLHF | científica | baixo |
| SRC-M11-05 | [DPO](https://arxiv.org/abs/2305.18290) — preferência direta sem PPO | científica | baixo |
| SRC-M11-06 | [Llama 2](https://arxiv.org/abs/2307.09288) — referência de arquitetura aberta | científica | médio |
| SRC-M11-07 | [PagedAttention](https://arxiv.org/abs/2309.06180) — KV em páginas, throughput | científica | médio |
| SRC-M11-08 | [FlashAttention](https://arxiv.org/abs/2205.14135) — economia de memória, não de computação | científica | baixo |
| SRC-M11-09 | [BPE/Sennrich](https://arxiv.org/abs/1508.07909) — subword e falha em números | científica | baixo |
| SRC-M11-10 | [LayerNorm](https://arxiv.org/abs/1607.06450) — normalização por camada | científica | baixo |
| SRC-M11-11 | [Adam](https://arxiv.org/abs/1412.6980) — otimizador do treino | científica | baixo |
| SRC-M11-12 | [LoRA](https://arxiv.org/abs/2106.09685) — adaptador de baixo posto | científica | baixo |
| SRC-M11-13 | [tokenizers (HF)](https://huggingface.co/docs/tokenizers) — BPE/WordPiece no produto | documentação oficial | baixo |
| SRC-M11-14 | [PEFT (HF)](https://huggingface.co/docs/peft) — LoRA/QLoRA no produto | documentação oficial | médio |
| SRC-M11-15 | [llama.cpp](https://github.com/ggerganov/llama.cpp) — GGUF, quants, servidor local | projeto aberto | alto |
| SRC-M11-16 | [Ollama](https://github.com/ollama/ollama) — `num_ctx`, `parallel`, `keep_alive` | fornecedor | alto |
| SRC-M11-17 | [vLLM](https://github.com/vllm-project/vllm) — batching contínuo em produção GPU | projeto aberto | alto |
| SRC-M11-18 | [BFCL/gorilla](https://github.com/ShishirPatil/gorilla) — tool-calling e sensibilidade a formato | industrial | alto |
| SRC-M11-19 | Kalai et al. 2025 (alucinação) + SimpleQA — citados no legado sem URL; referência a confirmar no lote C05; números não herdados como evidência | científica | alto |
| SRC-M11-20 | estudo de quantização citado no legado sem autoria — não herdado; o lab mede no hardware local; confirmar ou substituir no lote C06 | industrial | alto |

Consultadas em 14/09/2026. Pesos, versões de servidor/modelo,
preços, vazões e benchmarks: revalidar em até 90 dias. O invariante
ensinado (tensor, gradiente, atenção, amostragem, VRAM, avaliação
honesta) não depende de nenhum fornecedor; retratos de produto e
famílias de pesos pertencem aos adapters e à trilha externa.

## 7. Panorama de prática vigente

Modelos de pesos abertos servidos localmente atrás de API compatível
com OpenAI são prática observável — sustentam a decisão didática
(porta do M05, ADR por etapa) sem definir fundamento nem recomendar
produto.

## 8. Gates e decisão G0

| Gate | Estado | Critério |
|---|---|---|
| G0 · escopo | **APROVADO** | oito blocos, 35 cenários, fontes classificadas, lab local CPU e limites definidos |
| G1–G6 | EM PRODUÇÃO/PENDENTE | HTML legado em dois arquivos em revisão; lab e avaliação em construção neste ciclo |

**Decisão de G0:** aprovada em 14/09/2026 pelo orquestrador. Define o
trabalho; não certifica HTML legado ou lab inexistente.
