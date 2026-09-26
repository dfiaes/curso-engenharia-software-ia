# OPS-03 — ambiente mínimo e comandos canônicos

**Estado:** REVISADO
**Sessão de autoria:** 01a0d6c4-4b1a-7482-9c37-d3608215101e
**Sessão de revisão:** 01a0d6d2-06df-7fa1-a6e2-0c11bf34be2e
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
**Data:** 25/09/2026
**Trilha:** principal · **Escopo:** M00–M13 e LT01–LT04
**ATs/gates:** nenhum AT ou gate promovido.

## Baseline focal

Antes da edição, inventariei os labs principais e LT sem instalar dependências. A saída matricial completa, com `cwd`, requisitos de Python, extras/grupos, lock, comandos aplicáveis e estado observado, está em [`ambientes.json`](../ambientes.json).

No host desta execução, `python3 --version` retornou Python 3.9.6; `python3.14 --version`, Python 3.14.7; `uv --version`, 0.12.7. `uname -a` indicou macOS 27.0.0 arm64 e `os.cpu_count()` retornou 16. Os 19 diretórios de lab encontrados já possuíam `.venv` com Python 3.14.7, `pyproject.toml` e `uv.lock`.

`~/.cache/uv` existe, mas uv não conseguiu ler seu metadado padrão (`Operation not permitted`). `UV_CACHE_DIR=/private/tmp/ops03-uv-cache` permitiu validar locks sem instalar pacotes. O cache pip não existe; o cache Hugging Face existe, mas não foi inspecionado além da contagem de entradas nem usado para baixar artefatos; não há cache torch. Docker não está instalado. Nenhuma sincronização, instalação de pacote, download de modelo ou execução de suíte dos 19 labs foi feita.

## Matriz e procedimento

- Cada lock passou `uv lock --check --offline` no respectivo `cwd`: 19/19. Isso verifica coerência lock/metadata, não instala nem testa as dependências.
- A matriz distingue bootstrap limpo (`uv sync --locked`, com rede possivelmente necessária), sync offline somente quando o cache já contém todas as dependências e execução offline (`uv run --locked --offline ...`) em ambiente existente. Comandos são templates, salvo onde um controle negativo ou gate positivo estiver explicitamente marcado como executado.
- M00 e M01 usam extra opcional `dev`; `mcp` é um extra separado somente em M00. Labs com grupo `dev` usam o grupo padrão de uv. M12 tem grupo `postgres` opcional, que depende de Docker/PostgreSQL e não foi executado.
- Em M02A, o projeto e a pasta `lab/` existem, mas não há `lab/README.md`; o README da unidade fica na raiz do módulo. Não alterei essa documentação porque o write set permite READMEs apenas para corrigir comandos incorretos e não encontrei comando incorreto nesse arquivo.
- ML01–ML07 têm especificações, mas não labs produzidos. A matriz registra apenas um procedimento futuro para a trilha opcional: conferir cartão e especificação, requisitos/lock e orientação oficial CPU/GPU; começar em CPU se o cartão permitir; separar bootstrap de execução offline; evitar download de pesos fora do escopo; marcar hardware/dependência indisponível como BLOCKED. Não executado e não bloqueia o principal.

## Controles e resultados observados

| Caso | Comando e `cwd` | Resultado |
|---|---|---|
| Extra inexistente no M01 | `UV_CACHE_DIR=/private/tmp/ops03-uv-cache uv sync --locked --offline --dry-run --extra mcp` · `modulos/M01-workflow-ia-driven/lab` | Exit 2: `Extra mcp is not defined`; dry-run, sem instalar. Confirma que o comando com extra não declarado não deve aparecer como canônico. |
| Mypy sem alvos no M12 | `MYPY_CACHE_DIR=/private/tmp/ops03-mypy-cache ./.venv/bin/mypy --no-incremental` · `modulos/M12-producao-seguranca-sre-billing/lab` | Exit 2: pacote `m12_lab` não tem marcador `py.typed`. Comando documentado `./.venv/bin/mypy --strict src` passou: 10 arquivos, zero issues. A matriz usa o comando com alvo. |
| Wheel forçado em Python 3.9 | `UV_CACHE_DIR=/private/tmp/ops03-uv-cache uv build --python 3.9 --no-build-isolation --out-dir /private/tmp/ops03-wheel-negative` · `modulos/M02A-engenharia-software-senior/lab` | Exit 2 antes de testar compatibilidade: Hatchling não está instalado no Python 3.9. Não instalei o backend. O `pyproject.toml` declara `requires-python >=3.14`; o teste de build negativo fica inconclusivo por esse bloqueio. |
| Lab principal ausente | inventário `find modulos -maxdepth 2 -type d -name lab` · raiz | Nenhum lab principal ausente: 19 diretórios, projetos, locks e venvs existem. O lab M02A sem README e os labs ML opcionais ainda não produzidos foram distinguidos e não tratados como falha principal. |
| Docker ausente | `docker --version` · raiz | Exit 127: `command not found`; integração Docker/PostgreSQL permanece não executada. |

Controles positivos de ambiente: `modulos/M12-producao-seguranca-sre-billing/lab/.venv/bin/mypy --strict src` → `Success: no issues found in 10 source files`; `modulos/M11-fundamentos-ml-dl-modelos-locais/lab/.venv/bin/python` reportou torch 2.9.1, `cuda.is_available() == False`, `torch.version.cuda == None`. O import avisou que NumPy não está instalado; não fiz operação que dependa de NumPy. Essa amostra comprova somente o estado local, não todos os labs ou hardware diferente.

## Fontes consultadas

- Documentação oficial do uv sobre [locking e syncing](https://docs.astral.sh/uv/concepts/projects/sync/) e [grupos e extras](https://docs.astral.sh/uv/concepts/projects/dependencies/), consultada em 25/09/2026. Ela distingue lock de instalação, `--locked` de `--no-sync`, extras opcionais e o grupo `dev` padrão. O registro de ambientes relaciona essas instruções com o TOML local; a versão efetiva do uv foi lida no host.

## Verificações e limites

Executadas na raiz do repositório após a alteração:

```text
python3.14 -m json.tool docs/planejamento-v4/ambientes.json
JSON válido

python3 tools/check_course.py
Checked 107 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.

python3 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
Planning validation only: no source, lab, learning outcome or release certified.
```

O checker e o validador foram registrados como estruturais/planejamento. O comando `uv build` para Python 3.9 não verificou o requisito do interpretador porque faltava o backend, então não foi contado como PASS/FAIL de compatibilidade. A ausência de Docker é um bloqueio ambiental para integrações, não uma evidência substituta. Nenhum AT, gate ou readiness foi promovido; `PROGRESSO.md` permaneceu intocado. Esta autoria requer revisão independente em outro RUN.


## Revisão independente — 25/09/2026

**RUN revisor:** `01a0d6c4-4b1a-7482-9c37-d3608215101e` · **Configuração:** `gpt-6-luna / high`, origem `automation.toml`.

**Resultado:** AJUSTES_NECESSARIOS. A matriz e os limites são transparentes, mas faltam itens explícitos do aceite: (1) registrar a rubrica aplicável da especificação geral; (2) identificar um caso de borda separado de controles positivos/negativos e anexar sua evidência; (3) classificar o controle “novo lab ausente” como não exercitável se nenhum lab estiver ausente, sem contá-lo como controle negativo executado, ou apresentar um caso seguro que prove essa condição. O build interrompido por Hatchling ausente permanece inconclusivo e não satisfaz sozinho o caso de borda.

**Verificação do revisor:** `python3 tools/check_course.py` → 109 documentos, zero erros estruturais/links; `python3 tools/validate_backlog.py` → 699 tarefas, zero erros; `uv lock --check --offline` nos `cwd` listados → 19/19 PASS; JSON carregado com `json.tool` na autoria e estrutura revisada com 19 unidades/19 caminhos existentes. As fontes oficiais atuais do uv confirmam os claims sobre `--locked`, lock/sync, extras e grupo `dev`. Nenhum gate/AT promovido.


## Complemento de autoria após revisão — 25/09/2026

**RUN autor desta revisão:** `01a0d6c4-4b1a-7482-9c37-d3608215101e` · `gpt-6-luna / high`, configuração do agendador.

### Caso de borda e controles

- **Positivo:** `uv lock --check --offline` passou em 19/19 labs; `mypy --strict src` passou no M12.
- **Borda de interpretador:** em `modulos/M02A-engenharia-software-senior/lab`, `UV_CACHE_DIR=/private/tmp/ops03-review-uv-cache uv sync --locked --offline --dry-run --python 3.9` retornou exit 2 antes de sync: Python 3.9.6 é incompatível com `requires-python >=3.14`. É controle dry-run, sem instalação. O teste de build de wheel continua explicitamente inconclusivo por Hatchling ausente.
- **Ausência do lab novo:** inspeção focal real encontrou `lab/` presente, `lab/README.md` ausente e `README.md` do módulo presente. Portanto, a hipótese “diretório de lab ausente” não pôde ser exercitada no checkout atual; esse caso não é contado como controle negativo executado. A ausência do README local não impede localizar as instruções no README do módulo; não foi corrigido porque o cartão só autoriza READMEs para comandos incorretos.
- **Negativos executados:** extra `mcp` inexistente no M01, mypy sem alvo explícito no M12, build Python 3.9 inconclusivo por pré-requisito ausente e Docker não disponível. Resultados/limites permanecem na matriz e na tabela anterior.
- **Borda do ambiente:** o cache uv padrão existe, mas sua leitura falha por permissão; o override em `/private/tmp` permitiu os checks de lock sem instalação.

### Rubrica aplicada ao artefato operacional (0 ausente, 1 parcial, 2 suficiente)

| Critério | Nota | Evidência e limite |
|---|---:|---|
| Contexto e pré-requisitos | 2 | Host, Python, uv, CPU, cache e Docker identificados; observação vale para este host. |
| Mecanismo | 2 | lock, sync, extras/grupos e execução offline separados; `uv lock --check` não é tratado como instalação. |
| Exemplo trabalhado | 2 | Matriz contém `cwd` e comandos por unidade; templates aparecem separados de comandos executados. |
| Decisão e limites | 2 | CPU local, bootstrap com rede e bloqueios Docker/cache descritos; ML segue opcional. |
| Falha e diagnóstico | 2 | Saídas reais e causas distinguem incompatibilidade, alvo mypy, cache e Docker; wheel fica inconclusivo. |
| Transferência | 2 | Procedimento geral reutilizável por unidade e protocolo explícito para labs ML futuros. |
| Fontes e evidência | 2 | Documentação oficial uv consultada e claims ligados; locks reexecutados pelo revisor em 19/19 cwd. |
| Navegabilidade | 2 | JSON por unidade e relatório com links, comandos, saída, estado e limites. |

A rubrica avalia a utilidade editorial deste inventário, não promove gate do curso. O controle do diretório de lab ausente permanece não exercitado e explícito. Solicita-se revisão independente deste complemento.


## Revisão independente — 25/09/2026

**RUN revisor:** `01a0d6d2-06df-7fa1-a6e2-0c11bf34be2e` · **Configuração:** `gpt-6-luna / high`, origem `automation.toml`.

**Resultado:** REVISADO. Conferi a matriz, o complemento, os caminhos e os limites; a matriz possui 19 unidades e todos os `cwd`, `pyproject.toml` e `uv.lock` referenciados existem. O caso “lab principal ausente” está corretamente classificado como não exercitável no estado observado: os 19 labs existem, enquanto a ausência do README local de M02A está separada e não foi transformada em falha de lab. A rubrica contém as oito dimensões da especificação geral, com evidência e limites por dimensão. O caso de borda Python 3.9 rejeita o interpretador antes de sincronizar; o build de wheel permanece inconclusivo por Hatchling ausente. Nenhum achado de revisão permaneceu aberto.

**Verificação independente:** `python3 tools/check_course.py` → 109 documentos, zero erros estruturais/links (14 referências/relógios legados sinalizados para análise contextual); `python3 tools/validate_backlog.py` → 699 tarefas, zero erros; `python3.14 -m json.tool docs/planejamento-v4/ambientes.json` → JSON válido; inspeção de estrutura → 19 unidades e caminhos completos. `UV_CACHE_DIR=/private/tmp/ops03-review-run-cache uv lock --check --offline` nos 19 `cwd` → 19/19 exit 0. A tentativa inicial sem `UV_CACHE_DIR` falhou por bloqueio de acesso ao cache padrão; o override em `/private/tmp` repetiu o check com sucesso.

Reproduzi os controles focais: extra `mcp` não declarado no M01 → exit 2; mypy M12 sem alvo → exit 2 por ausência de `py.typed`, enquanto `mypy --strict src` → zero issues em 10 arquivos; `uv sync --locked --offline --dry-run --python 3.9` em M02A → exit 2 por `requires-python >=3.14`, antes de instalar; Docker → indisponível, exit 127. A documentação oficial atual do uv confirma a distinção entre validar lock e sincronizar ambiente, o uso opt-in de extras e o grupo `dev` padrão: [locking/syncing](https://docs.astral.sh/uv/concepts/projects/sync/) e [dependências](https://docs.astral.sh/uv/concepts/projects/dependencies/), consultadas em 25/09/2026. Nenhuma suíte completa dos labs, integração Docker/PostgreSQL, execução visual ou instalação foi certificada. Nenhum AT, gate ou readiness promovido.
