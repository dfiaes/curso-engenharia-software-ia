# Evals: meça, não opine

Duas perguntas, uma ferramenta (só Python 3.11+ padrão, sem dependências, qualquer agente ou modelo):

- **A minha skill continua útil?** Compare o mesmo agente com e sem a skill (`--skill-ab`).
- **Um modelo mais barato entrega o mesmo?** Compare variantes (`--variantes grande,barato`) pelo custo por tarefa bem-sucedida.

## Teste agora, sem custo

```bash
python3 evals/run_evals.py --config evals/exemplos/variantes.toml --casos-dir evals/exemplos/casos \
    --variantes modelo-grande,modelo-pequeno --repeticoes 3 --paralelo 4
python3 evals/run_evals.py --config evals/exemplos/variantes.toml --casos-dir evals/exemplos/casos \
    --variantes modelo-grande --skill-ab corrigir-bug --repeticoes 3
```

O agente é um fake determinístico (`exemplos/agente_fake.py`). Veja a saída pronta em `exemplos/relatorio-exemplo.md`. Resultados ficam em `evals/resultados/<data>/` (`resultados.jsonl` + `relatorio.md`; fora do git).

## Seus casos e suas variantes

1. `casos/*.toml`: copie `casos/_modelo.toml`. Campos: `id`, `descricao`, `tags`, `dificuldade`, `prompt`, `fixture` (pasta copiada para um diretório temporário a cada execução), `deve_acionar_skill` e `[verificar]` com `comando` (exit 0 = ok, roda no workdir), `regex_saida` e/ou `arquivos_esperados`.
2. `variantes.toml`: uma por agente/modelo, com `comando` (`{prompt_file}` e `{workdir}`), `modelo`, `env`, preços por milhão de tokens e `regex_tokens` para medir custo. Há exemplos comentados de Claude Code, Codex, OpenCode, Cursor CLI e script próprio; **as flags mudam, confira na doc da sua versão**. Segredos só por variável de ambiente (`"$MINHA_CHAVE"`); chave literal é recusada.
3. Para `--skill-ab`, a variante declara `[variante.com_skill]` e `[variante.sem_skill]` (env, ou `comando` alternativo): por exemplo, um diretório de skills diferente ou uma flag.

Opções: `--variantes a,b` (a primeira é a linha de base), `--casos all|tag|id`, `--repeticoes N`, `--timeout S`, `--paralelo P`, `--saida DIR`, `--tolerancia 0.05`.

## Como montar um bom conjunto de casos

- **20 a 50 casos reais**, tirados do seu histórico (bugs que você corrigiu, features que entregou, PRs revisados). Menos de 20 casos: o relatório avisa que a decisão é frágil.
- **Critério verificável por máquina**: teste que passa, arquivo que existe, saída que casa. Se você precisa "ler e achar bom", ainda não é um caso.
- **Misture dificuldades** e inclua **casos de borda** (entrada vazia, limites, entradas inválidas). Só casos fáceis fazem todo modelo parecer igual.
- **Casos negativos para skill**: tarefas em que a skill NÃO deve ser acionada (`deve_acionar_skill = false`). Sem eles você não vê falso positivo.
- Fixtures pequenas e herméticas (sem rede, sem relógio, sem estado compartilhado). Não deixe a solução ao alcance do agente.
- Repita (k = 3 a 5): agentes variam entre execuções.

## Como ler o relatório

- **pass@1 médio**: acerto médio por tentativa. **pass^k**: casos em que *todas* as k tentativas acertaram: é a confiabilidade que você sente no dia a dia. **pass@k**: casos em que *alguma* acertou: o que o modelo consegue com tentativas extras. Grande distância entre pass@k e pass^k = instável.
- **Custo por sucesso** (custo total / sucessos) é o número que importa: um modelo barato que erra muito pode sair mais caro. `n/d` = faltou `regex_tokens` ou preço.
- **Falhas por motivo**: `timeout`, `agente_erro`, `verificar.*`. Muito `timeout` é problema de instrução ou de limite, não de capacidade.
- **Comparação pareada**: lista os casos que mudaram. O **McNemar exato** diz se o número de mudanças para cada lado passa do acaso. Com poucos casos o normal é "diferença não distinguível de ruído": isso **não** prova que são iguais, só que você ainda não sabe; aumente casos e repetições.
- **Recomendação**: regras fixas e escritas no próprio relatório (trocar só se a perda de pass^k couber na tolerância e o custo por sucesso cair).
- **Modo skill**: ganho de pass^k com vs sem; acionamento correto, falso positivo (disparou à toa) e falso negativo (não disparou quando devia); veredito *útil*, *neutra* (enxugue ou aposente: skill que não ajuda só consome contexto) ou *prejudicial*.

## Quando LLM-as-judge é aceitável

Só quando o critério é irredutivelmente subjetivo (clareza de um texto, tom). Aí: rubrica escrita com notas discretas, juiz de modelo diferente do avaliado, e **calibre contra notas humanas** (rotule 30+ casos à mão e meça a concordância antes de confiar). Se for possível escrever um teste, escreva o teste. Para usar um juiz neste kit, faça o `verificar.comando` chamar seu script de julgamento e devolver exit 0/1.

## Quando rodar de novo

Ao trocar de modelo, ao criar ou editar uma skill, ao mudar o `AGENTS.md` e quando o fornecedor atualizar o modelo (o mesmo nome pode mudar de comportamento). Guarde o `relatorio.md` aprovado como referência e compare.
