# OPS-05 — CI equivalente ao gate local

**Estado:** REVISADO
**Sessão de autoria:** 01a0de8b-ffd8-72d2-800e-ffb966485ed6
**Sessão de revisão:** 01a0dea7-003e-7262-8bbd-4ed3faf5d5e2
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
**Data:** 26/09/2026
**Trilha:** principal · **Escopo:** workflow, matriz offline e integração PostgreSQL M03
**ATs/gates:** nenhum AT ou gate promovido.

## Baseline focal

`.github/workflows/ci-m03.yml` usava refs mutáveis `actions/checkout@v4`, `astral-sh/setup-uv@v4` e `docker/build-push-action@v6`. A etapa PostgreSQL virava skip verde quando Docker faltava, e o job da branch principal publicava `:latest` e a imagem com SHA usando `packages: write`. Não existia workflow principal para checker/labs nem fluxo opcional isolado para ML.

## Implementação

- `ci-course-core.yml` executa checker e validador e uma matriz offline de 18 labs do principal/LTs. M03 fica no workflow especializado para que a integração PostgreSQL tenha gate explícito.
- `ci-m03.yml` executa verificação do lock, `uv sync --frozen`, Ruff, formatação, mypy e testes offline (marcador `postgres` excluído). Job PostgreSQL depende de `quality`, exige Docker acessível antes de chamar pytest e falha se o pré-requisito não estiver disponível ou qualquer caso for omitido.
- O build da imagem mantém o contrato estrutural do M03, roda somente em `main` depois dos gates offline e PostgreSQL e usa `push: false`/`load: true`. Removeu-se a permissão `packages: write`; os tags `latest` e SHA são apenas locais ao runner. Nenhuma imagem foi enviada.
- `ci-appendix-ml.yml` é acionado apenas por `workflow_dispatch`; não tem dependência nem `needs` com workflows do principal. `run_course_lab.py` marca ML01–ML07 como BLOCKED quando o lab/lock revisado ainda não existe, sem `skip` ou falso sucesso.
- `tools/run_course_lab.py` lê somente a matriz operacional `ambientes.json`; valida diretório, `pyproject.toml` e lock; registra comando, `cwd`, Python, uv, HEAD e estado limpo/sujo; verifica o lock; faz bootstrap travado e executa checks com rede desligada. Qualquer pytest com resultado `skipped` falha. M03 separa os testes locais dos de PostgreSQL.
- Refs de actions são SHA completos verificados em releases oficiais: checkout v4.4.0, setup-uv v10.1.0 e build-push-action v6.19.2. Todos os workflows concedem `contents: read`; checkout usa `persist-credentials: false`. Não há `continue-on-error`, segredo, upload ou publicação.

## Fontes e versão

Consultadas em 26/09/2026:

- GitHub Actions: [proteger workflows e fixar actions em SHA completo](https://docs.github.com/en/code-security/tutorials/secure-your-organization/protect-against-threats) e [sintaxe de workflows/permissões](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax). As permissões listadas limitam o token aos escopos declarados.
- Repositórios oficiais/release pages: [actions/checkout v4.4.0](https://github.com/actions/checkout/releases/tag/v4.4.0), [astral-sh/setup-uv v10.1.0](https://github.com/astral-sh/setup-uv/releases/tag/v10.1.0) e [docker/build-push-action v6.19.2](https://github.com/docker/build-push-action/releases/tag/v6.19.2). A ação Docker documenta `push` como parâmetro de entrada; o build é configurado sem push e com load local.

## Evidência executada

Ambiente local: macOS arm64, CPython 3.14.7, uv 0.12.7, HEAD `b35d5cb19b4fc3c7346d4674576a774cb194676e`, working tree sujo por alterações preexistentes e editoriais desta execução.

| Caso | Comando e `cwd` | Resultado |
|---|---|---|
| Positivo M03 offline | `UV_CACHE_DIR=/private/tmp/uv-course-01a0de37 python3.14 tools/run_course_lab.py --unit M03-fastapi-postgres-docker-ci --mode offline` · raiz | lock check, lint, format e mypy passaram (29 arquivos); `pytest -q -m 'not postgres'` → **52 passed, 6 deselected**, 163 avisos conhecidos de depreciação pytest-asyncio/Python 3.16. A suíte inclui os aceites estáticos do workflow e release. |
| Pré-requisito ausente | `python3.14 tools/run_course_lab.py --unit M03-fastapi-postgres-docker-ci --mode integration` · raiz | exit 1 antes de pytest: `BLOCKED: required executable is unavailable: docker`. Nenhum teste de PostgreSQL foi contado como aprovado. |
| Apêndice ainda sem lab | `python3.14 tools/run_course_lab.py --unit ML01 --mode offline` · raiz | exit 1 explícito `BLOCKED`: lab ML opcional não existe no checkout; nenhum mock/skip. |
| Matrix core | `UV_CACHE_DIR=/private/tmp/uv-course-01a0de37 python3.14 tools/run_course_lab.py --unit M06-evals-observabilidade --mode offline` · raiz | lock e lint passaram; o fluxo parou em `ruff format --check` com três arquivos M06 já fora do write set desta tarefa: `src/eval_lab/gate.py`, `src/eval_lab/runner.py` e `tests/test_gate.py`. Resultado vermelho preservado; nenhum arquivo M06 foi reformatado. |
| YAML e estaticidade do workflow | `ruby -e 'require "yaml"; ... YAML.load_file(...)'` · raiz; busca por `continue-on-error`, `push: true`, `packages: write` e refs mutáveis em `.github/workflows/` | três YAMLs carregados; nenhum padrão proibido encontrado; nenhuma ref de action sem SHA completo. |
| Estrutura do curso/backlog | `python3 tools/check_course.py`; `python3 tools/validate_backlog.py` · raiz | 115 documentos/0 erros estruturais ou de links; 699 tarefas/0 erros. |
| Whitespace | `git diff --check` focal · raiz | exit 0. |

**Controle de integração omitida:** a workflow do M03 faz o job de build depender simultaneamente de quality e PostgreSQL; o job PostgreSQL exige Docker antes do runner e executa `pytest -m postgres`, com skips tratados como BLOCKED/falha. O local não conseguiu comprovar o caso positivo PostgreSQL por falta do executável Docker. O job de build só é imagem local depois dos gates; não é uma release nem publicação.

## Rubrica editorial (0 ausente, 1 parcial, 2 suficiente)

| Critério | Nota | Evidência e limite |
|---|---:|---|
| Contexto/pré-requisitos | 2 | Job distinto documenta Docker obrigatório para M03 integração e Python 3.14/uv para labs. |
| Mecanismo | 2 | Matriz usa comandos do ambiente; M03 separa laboratório offline, integração PostgreSQL e build local. |
| Exemplo trabalhado | 2 | M03 executou toda a cadeia local sem PostgreSQL; testes de contrato workflow passaram. |
| Decisão/limites | 2 | Principal automático; ML manual sem dependência; build local sem push; falta de Docker resulta BLOCKED. |
| Falha/diagnóstico | 2 | Runner falha com pré-requisito ausente e converte skips em falha; reproduziu bloqueio Docker. |
| Transferência | 1 | CI completa só após executar os workflows no GitHub; integração real está bloqueada no host atual. |
| Fontes/evidência | 2 | Documentação/release oficial e comandos/versões/revisão registrados; nenhum claim de CI remota. |
| Navegabilidade | 1 | YAML carregado e estrutura verificada; execução do evento e branch protection não observadas. |

Os checks do CI registrarão comandos, versão de Python/uv e revisão Git nos logs; nenhum artefato binário/de release é enviado. Não inspecionei configuração externa de branch protection, então a independência estrutural do workflow manual ML está verificada, mas regras de proteção do repositório precisam ser confirmadas no host GitHub antes de afirmar política de merge. Nenhum gate/AT promovido. `PROGRESSO.md` preservado. Esta entrega aguarda revisão independente.


## Revisão independente — RUN `01a0de8b-ffd8-72d2-800e-ffb966485ed6`

**Resultado:** AJUSTES_NECESSARIOS. As permissões, SHA das actions, independência do workflow opcional e pré-requisito explícito de Docker para integração PostgreSQL conferem com os arquivos. O runner local falha fechado para skips e para Docker ausente.

**Achado corrigido nesta revisão:** o job offline de qualidade do workflow executava `pytest` diretamente e aceitava resultado verde com testes ignorados, ao contrário do runner local. O passo agora captura e exibe a saída, preserva código de falha do pytest e reprova resumo com teste `skipped`.

Validação pós-correção, cwd `modulos/M03-fastapi-postgres-docker-ci/lab`: `UV_CACHE_DIR=/private/tmp/uv-course-01a0de8b UV_PYTHON_INSTALL_DIR=/private/tmp/uv-python-course-01a0de8b uv run --locked --offline pytest -q -m 'not postgres'` → 52 passed, 6 deselected; suíte não contém skip; 163 avisos pytest-asyncio relativos a remoção de API no Python 3.16. Ruby `YAML.load_file` carregou `.github/workflows/ci-m03.yml`; `git diff --check` do workflow passou. A primeira execução sem cache redirecionado foi bloqueada pela permissão do sandbox sobre `~/.cache/uv`; não alterou o checkout, e a repetição usou cache em `/private/tmp`.

Esta correção torna o RUN atual autor desta alteração; não é autorevisão. A entrega volta a AGUARDA_REVISAO para revisão em outra execução. Integração PostgreSQL em GitHub Actions e branch protection não foram observadas; Docker está indisponível neste host. Nenhum AT/gate promovido; sem deploy/publicação.

## Revisão independente — RUN `01a0dea7-003e-7262-8bbd-4ed3faf5d5e2`

**Resultado:** REVISADO. Inspecionei os três workflows e `tools/run_course_lab.py`. O workflow core não depende do appendix; o workflow manual ML não tem `needs` para principal. M03 quality é bloqueador do job PostgreSQL, e o build local em `main` depende dos dois; não há push, credenciais persistidas ou permissões de escrita. A ausência de Docker produz BLOCKED/falha antes dos testes PostgreSQL. O script local confere diretório/lock, imprime revisão/ambiente e recusa resultado pytest com skip.

Reproduções desta revisão: em `modulos/M03-fastapi-postgres-docker-ci/lab`, CPython 3.14.7, `./.venv/bin/python -m pytest -q -m 'not postgres'` → **52 passed, 6 deselected**, 163 avisos conhecidos pytest-asyncio/Python 3.16. Os três workflows foram carregados por `YAML.load_file`. `python3 tools/run_course_lab.py --unit M03-fastapi-postgres-docker-ci --mode integration` → exit 1, `BLOCKED: required executable is unavailable: docker`. Injetei saída controlada `1 skipped, 4 passed` no runner local e ele terminou com `BLOCKED: pytest reported 1 skipped tests`; o caso não vira sucesso silencioso. Os controles estáticos confirmam `needs: [quality, postgres]`, isolamento do ML e ausência de `continue-on-error`/`packages: write`.

Limites mantidos: não executei workflow em GitHub nem inspecionei branch protection; o Docker indisponível impede reproduzir a integração PostgreSQL neste host. Isso permanece bloqueio da evidência de integração, não aprovação por skip. A revisão valida a implementação do cartão sem promover gate/AT. `PROGRESSO.md` e artefatos de usuário foram preservados; não houve publicação/deploy.
