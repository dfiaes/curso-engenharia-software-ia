# OPS-01 — reconciliação de critérios, blocos e evidência

**Estado:** REVISADO  
**Sessão de autoria:** 01a0d671-e469-7ca1-80a1-ef1ab571ec87  
**Sessão de revisão:** 01a0d688-c810-7050-9280-d87bcaaf28e8  
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador  
**Data:** 25/09/2026  
**Trilha:** principal e inventário do apêndice opcional; nenhum gate promovido.

## Baseline e objetivo

O catálogo já tinha os IDs dos critérios, mas 299 de 613 registros não declaravam seu bloco owner em `requirements[].blocks`. O vínculo existia somente na direção inversa, em `blocks[].acceptance_ids`. A matriz publicava a contagem por unidade; os IDs esparsos de LTs e M12 não devem ser tratados como faixas contínuas.

Antes da edição, `python3 tools/check_course.py` informou 101 documentos, zero erros estruturais/links e 14 referências antigas para revisão contextual. `python3 tools/validate_backlog.py` informou 699 tarefas, 26 unidades, 200 blocos planejados e zero erros. Esses comandos verificam estrutura de planejamento, não conteúdo nem execução.

## Alterações e disposições

- Em `docs/planejamento-v4/catalogo.json`, os 613 requisitos mantêm seus IDs. Foram preenchidos os owners explícitos de bloco em 299 registros, derivados de `acceptance_ids`; os demais já tinham a lista correspondente. Há 18 critérios com mais de um bloco owner, mantidos como definidos nos blocos.
- Comparação exata dos IDs enumerados nas 26 specs com os requisitos do catálogo: 613 contra 613, sem ausência ou ID órfão. Nenhum ID foi criado para preencher uma lacuna. Exemplo: LT01 preserva os 18 sufixos `[1, 2, 3, 10, 11, 12, 20, 21, 22, 30, 31, 32, 40, 41, 42, 50, 60, 61]`; AT-004 continua ausente, e 18 é a contagem real.
- Disposição por critério: 602 conservados sem troca de ID; 11 corrigidos no enunciado para retirar resultados quantitativos universais. Foram alterados M07-AT-006/007, M08-AT-014 e M11-AT-002/010/020/021/025/026/029/033, tanto na especificação quanto no catálogo.
- `MATRIZ-RASTREABILIDADE.md` conserva as contagens existentes e registra a checagem pelo inventário enumerado. A soma por unidade coincide com os 613 requisitos. O checker de curso acusou temporariamente o link para esta evidência antes de o relatório ser criado; a verificação será repetida após sua inclusão.
- Rastreabilidade M07 agora descreve comparação por tipo de consulta e aceita ganho, empate ou perda. M08 mantém tabela numérica comparativa sem impor multiplicador. Nenhum estado de teste, AT ou gate foi promovido.

## Natureza da prova e limites

As disposições descrevem o oráculo planejado de cada cenário; não certificam sua execução. Os 11 critérios corrigidos têm estas formas de prova:

| Unidade/IDs | Natureza planejada | Limite registrado |
|---|---|---|
| M07-AT-006/007 | experimento local comparativo, mesmos tipos de consulta/candidatos | embeddings e rerank falsos não provam superioridade geral nem integração com provedor |
| M08-AT-014 | medição local controlada de chamadas, passos, custo declarado e qualidade | conclusão vale para problema, modelo e orçamento medidos |
| M11-AT-002/010 | execução local CPU com loss e tempo observados | dinâmica e razão de tempos variam com seed, forma/tamanho da entrada e hardware |
| M11-AT-020/021 | cálculo local de memória + comparação de quantização por tarefa declarada | weights/VRAM e qualidade são dependentes do modelo/configuração; pesos externos podem ser trilha opcional |
| M11-AT-025/029 | medição local do serving e perfil da configuração | Ollama/recursos físicos são adapter e ambiente; indisponibilidade é BLOCKED, não PASS |
| M11-AT-026 | leitura/medição da política `keep_alive` na versão declarada | claim de produto exige fonte oficial datada e revalidação de alto risco no S correspondente |
| M11-AT-033 | estimativa de break-even com custos de hardware/API e volume declarados | preço e amortização precisam de cotação datada; nenhum vencedor é pressuposto |

Como controles de fronteira, o inventário compara conjuntos de IDs (ID sintético `...-AT-999` fica órfão, não é incorporado), conta IDs presentes sem usar o maior sufixo e compara cada owner explícito com `acceptance_ids`. Para natureza da prova, a especificação M03-AT-021 declara PostgreSQL real via Testcontainers; um teste isolado não substitui essa integração. M13 continua NO-GO e seus PASS sintéticos continuam prova do mecanismo do checker, não prova de operação integrada do produto.

Não houve consulta externa de fontes nesta ação: os critérios foram reescritos como medição local delimitada e não foi acrescentado claim de versão/preço. A tarefa S de cada unidade precisa revisar fontes primárias e a natureza da evidência específica antes de qualquer promoção.

## Verificação e resultado

CWD: raiz do projeto. CPython 3.9 do sistema para os scripts de planejamento. As comparações de IDs/owners foram executadas por script Python local contra as specs e o JSON atuais. Resultado registrado após relatório incluído:

```text
python3 tools/check_course.py
Checked 102 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.

python3 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
Planning validation only: no source, lab, learning outcome or release certified.

inventário specs ↔ catálogo
26 módulos; 613 IDs na spec e 613 no catálogo; 0 ausentes, órfãos ou sem owner.
LT01: 18 IDs; sufixo 004 ausente preservado.
matriz: 26 unidades; 0 divergências de contagem.
```

## Revisão editorial e próximo passo

Rubrica: correspondência de escopo e ownership = 2 (IDs, owners e contagens comparados); decisão/limites = 2 para as 11 correções de critério; natureza da prova = declarada como plano e limite, não evidência executada; fontes/integrações = pendentes nas tarefas S por unidade; navegabilidade e G0–G6 = não avaliados por este cartão. A revisão independente conferiu catálogo, specs, matriz e critérios corrigidos. FIX-01 e FIX-03 também aguardam revisão independente. PROGRESSO.md permanece intocado.

## Revisão independente — 25/09/2026

**Resultado:** REVISADO. RUN `01a0d688-c810-7050-9280-d87bcaaf28e8`; configuração confirmada no agendador como `gpt-6-luna / high`. A revisão confirma configuração do agendador, não introspecção do runtime.

Recalculei os vínculos do catálogo: 26 módulos e 613 IDs; todos os IDs do catálogo aparecem na especificação referenciada e todos os owners de `requirements[].blocks` correspondem aos blocos que listam os IDs em `acceptance_ids`. Nenhuma divergência. A matriz tem 26 unidades e suas contagens somam 613, igual ao catálogo. Confirmei os 11 critérios alterados nas specs e no catálogo; os IDs foram preservados e os textos agora aceitam medição por cenário, inclusive empate, perda, variação e não melhoria quando aplicável. As lacunas esparsas permanecem explícitas.

Verificações executadas na raiz do projeto: `python3 tools/check_course.py` → 104 documentos, zero erros estruturais/links, 14 referências antigas para revisão contextual; `python3 tools/validate_backlog.py` → 699 tarefas, 26 unidades, 200 blocos planejados, zero erros. Esses verificadores confirmam estrutura do curso/backlog, não execução de laboratórios, fontes, conteúdo ou gates. Não encontrei achado pendente no escopo OPS-01; nenhum AT ou gate foi promovido.
