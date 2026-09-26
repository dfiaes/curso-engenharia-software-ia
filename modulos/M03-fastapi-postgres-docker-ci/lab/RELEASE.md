# Contrato de release do link-shortener (lote B07)

## Gates (AT-025)

Todo push/PR que toque este módulo executa, com lock preservado
(`uv sync --frozen`): `ruff check`, `ruff format --check`, `mypy`
(strict, `src` + `tests`) e `pytest -q`. O script `scripts/check.sh`
reproduz os mesmos comandos localmente. Sem Docker, a suíte `postgres`
pula como BLOCKED.

## Imagem (AT-027)

Na `main`, a imagem é construída do `Dockerfile` do lab e endereçada por
`latest` + SHA do commit (`ghcr.io/<repo>:<sha>`). Rollback = redeployar
a SHA anterior.

## Banco (AT-028)

O schema nasce exclusivamente de `alembic upgrade head`, aplicado num
passo efêmero ANTES de promover a versão. `create_all` nunca cria schema
em produção (existe apenas como auxiliar de teste, com docstring
proibitiva). Migration destrutiva segue expandir/contrair em 2 releases;
todo `upgrade` tem `downgrade` testado.

## Segredos e PR (AT-026/029)

Nenhum caminho de deploy nem segredo de produção no contexto de pull
request. Configuração obrigatória ausente falha cedo (`RuntimeError` em
`serve`), sem revelar valores. `.env` nunca entra na imagem
(`.dockerignore` verificado por teste).

## Trilha opcional (AT-032)

Publicação externa (qualquer PaaS com container + Postgres) registra
aqui: ambiente, revisão, método de rollback ensaiado e limite do ensaio.
Ausência de publicação NÃO reprova o laboratório. Nenhuma publicação
registrada até o momento.
