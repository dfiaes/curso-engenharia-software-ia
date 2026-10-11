# M03 — especificação de escopo e evidência

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.0 · **Data-base:** 21/08/2026 · **Estado:** G0 aprovado; G1 em produção

## 1. Decisão curricular

O M03 transforma os contratos e o runtime local do M02 em uma aplicação HTTP operável. O produto didático é um encurtador de links, `link-shortener`. Ele possui uma fronteira HTTP, dados persistentes em PostgreSQL, migrações, testes de integração, imagem de container e pipeline de qualidade. A escolha do produto é deliberadamente pequena: a infraestrutura fica visível sem esconder a decisão de engenharia atrás de regras de negócio extensas.

Python 3.14 é a linguagem canônica. FastAPI, SQLAlchemy, Alembic, Docker Compose, Testcontainers e GitHub Actions são adapters do laboratório. HTTP, OpenAPI, transação, constraint, plano de consulta, imagem imutável, health check e gate de qualidade são os conhecimentos transferíveis.

O laboratório obrigatório roda de forma local. Exige Docker Engine/Compose para a parte PostgreSQL real; a ausência desse ambiente é bloqueio explícito, não é substituída por SQLite, mock ou teste marcado como `skip`. Conta externa, domínio, credencial de cloud e deploy público são uma trilha opcional após o laboratório. Eles não condicionam a aprovação do módulo.

## 2. Resultado, limites e integração

| Aspecto | Definição |
|---|---|
| Carga | oito blocos de duas horas, total de 16 h |
| Entrada | M02: projeto Python, Pydantic, typing, `asyncio`, teste, casos negativos e gates locais |
| Saída | serviço HTTP local com banco real, migrações, container, suíte de integração e pipeline versionado |
| Peça do capstone | convenções para backend `cartografo`; a integração no repositório do capstone só ocorre depois de uma spec própria |
| Não cobre | autenticação/tenant/billing (M12), IA/provider (M05–M09), durabilidade distribuída (M10/LT02), SRE integral (M06/M12), benchmark de inferência (M11) |
| Evidência mínima | comandos, versões e saída executada; nenhum tempo, p95 ou tamanho de imagem é publicado como número universal |

## 3. Arquitetura do laboratório

```text
cliente ASGI/local HTTP
          │
          ▼
 FastAPI adapter ──► aplicação ──► repositório SQLAlchemy ──► PostgreSQL
          │                    │
          │                    └── contratos Pydantic/OpenAPI
          ▼
 health / Problem Details / correlation id

Compose: api + db                  Testcontainers: PostgreSQL descartável
CI: formatação → lint → tipos → testes → build de imagem
```

O repositório de referência ficará em `modulos/M03-fastapi-postgres-docker-ci/lab/`. O roteiro `Laboratório guiado M03`, no final do HTML, criará uma cópia marcada em diretório temporário pertencente ao laboratório. A cópia não modifica `capstone/`, o checkout do curso ou arquivos pessoais.

## 4. Blocos, competências e evidência

| Bloco | Competências observáveis | Evidência planejada |
|---|---|---|
| B01 · fronteira HTTP | distinguir transporte, contrato e regra; usar rota, schema, dependência com `yield`, lifecycle e middleware; escolher status e erro | API ASGI com `POST /links`, `GET /links/{slug}`, correlation id e erro estruturado |
| B02 · sessão e migração | delimitar unidade de trabalho; configurar `AsyncSession`; revisar migration e rollback | migration versionada, `upgrade`/`downgrade` em PostgreSQL limpo |
| B03 · dados e concorrência | escolher índice pelo predicado; ler plano; separar JSONB de coluna estável; provar e corrigir lost update | `EXPLAIN` armazenado como evidência variável; teste concorrente e update atômico |
| B04 · fronteiras internas | separar HTTP, aplicação, domínio e persistência; transformar arquitetura em regra executável | import contract e mutante que é rejeitado |
| B05 · imagem e composição | explicar camada, build multi-stage, usuário não-root, segredo, volume, DNS interno e health check | Dockerfile/Compose inspecionados; serviço `db` saudável antes de `api` |
| B06 · integração honesta | escolher unitário versus integração; isolar estado; usar client ASGI e PostgreSQL descartável | Testcontainers, casos de constraint, migration e concorrência reais |
| B07 · CI e release | converter gates locais em workflow; separar qualidade, imagem e release; manter config e segredo fora da imagem | workflow testado estaticamente e script local equivalente; contrato de release sem credencial real |
| B08 · operação local | correlacionar request, health, timeout, falha do banco e rollback; defender limites | execução final local, diagnóstico e checkpoint; deploy público apenas opcional |

Cada competência deve atravessar N1–N4. B03, B05, B06 e B08 também exigem evidência operacional proporcional ao escopo. O módulo não promete N5 de produção apenas porque uma imagem foi publicada.

## 5. Cenários de aceitação

| ID | Oráculo e caso relevante | Bloco |
|---|---|---|
| M03-AT-001 | OpenAPI expõe contrato de criação e resposta sem vazar entidade de persistência | B01 |
| M03-AT-002 | payload inválido devolve erro HTTP com tipo, status e detalhe deliberados | B01 |
| M03-AT-003 | dependência de sessão faz rollback quando a aplicação levanta exceção | B01/B02 |
| M03-AT-004 | middleware preserva ou cria correlation id e não altera a semântica da resposta | B01 |
| M03-AT-005 | migration sobe em banco vazio e `downgrade` retorna ao estado anterior declarado | B02 |
| M03-AT-006 | constraint única vence uma corrida de inserção e a aplicação traduz o conflito | B02 |
| M03-AT-007 | uma `AsyncSession` não é compartilhada por tarefas concorrentes | B02 |
| M03-AT-008 | nenhum startup de produção usa `create_all`; o schema nasce de migration | B02 |
| M03-AT-009 | predicado crítico usa o índice escolhido segundo `EXPLAIN`; o plano é interpretado, não cronometrado como promessa | B03 |
| M03-AT-010 | incremento ler-somar-gravar perde atualização sob concorrência; update atômico preserva o total | B03 |
| M03-AT-011 | atributo variável é persistido em JSONB com consulta e índice adequados, sem chamar JSONB de substituto para schema relacional | B03 |
| M03-AT-012 | teste inicia com estado de banco isolado e não depende da ordem da suíte | B03/B06 |
| M03-AT-013 | import ilegal de framework na aplicação é recusado pelo guardrail | B04 |
| M03-AT-014 | router não importa repositório nem entidade SQLAlchemy diretamente | B04 |
| M03-AT-015 | override de dependência troca a infraestrutura em teste sem alterar a regra de aplicação | B04/B06 |
| M03-AT-016 | ADR registra o custo e a condição de revisão da fronteira escolhida | B04 |
| M03-AT-017 | imagem final executa como usuário não-root e não inclui ferramenta de build desnecessária | B05 |
| M03-AT-018 | contexto de build exclui `.env`, checkout e ambiente virtual conforme `.dockerignore` | B05 |
| M03-AT-019 | Compose só admite `api` depois do health check do banco; `localhost` não é usado como host interno | B05 |
| M03-AT-020 | volume e rede possuem função declarada; a limpeza só atinge recursos nomeados do laboratório | B05 |
| M03-AT-021 | Testcontainers sobe PostgreSQL descartável e executa migrations reais | B06 |
| M03-AT-022 | client ASGI cobre criação, consulta, inválido, inexistente e conflito contra o banco real | B06 |
| M03-AT-023 | relógio e gerador de slug são determinísticos no teste, não em produção | B06 |
| M03-AT-024 | indisponibilidade do banco produz timeout/erro observável e cleanup, sem tarefa ou sessão órfã | B06/B08 |
| M03-AT-025 | workflow reproduz formatação, lint, tipagem, testes e build com lock preservado | B07 |
| M03-AT-026 | pull request não recebe caminho de deploy nem segredo de produção | B07 |
| M03-AT-027 | imagem é endereçada por identificador imutável de revisão, separado de tag conveniente | B07 |
| M03-AT-028 | migration de release tem compatibilidade e rollback descritos; não roda em startup do servidor | B07 |
| M03-AT-029 | settings falham cedo quando configuração necessária não existe e não revelam segredo no diagnóstico | B07/B08 |
| M03-AT-030 | execução final local mostra health, criação, redirect e conflito com cabeçalho de correlação | B08 |
| M03-AT-031 | diagnóstico liga sintoma de conexão, plano, migration, imagem ou CI à hipótese e à correção verificável | B08 |
| M03-AT-032 | publicação externa opcional registra ambiente, revisão, método de rollback e limite do ensaio; sua ausência não reprova o laboratório | B08 |

## 6. Fontes e versões

| ID | Fonte e uso | Tipo | Risco |
|---|---|---|---|
| SRC-M03-01 | [FastAPI dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/) — grafo de dependências e `Annotated` | documentação oficial | alto |
| SRC-M03-02 | [FastAPI dependencies with yield](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/) e [lifespan](https://fastapi.tiangolo.com/advanced/events/) — lifecycle e cleanup | documentação oficial | alto |
| SRC-M03-03 | [FastAPI async](https://fastapi.tiangolo.com/async/) — limites de `def`/`async def` | documentação oficial | alto |
| SRC-M03-04 | [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) — contrato HTTP documentável | padrão aberto | médio |
| SRC-M03-05 | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) e [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) — semântica HTTP e Problem Details | normativa | baixo |
| SRC-M03-06 | [SQLAlchemy asyncio](https://docs.sqlalchemy.org/en/21/orm/extensions/asyncio.html) e [Session basics](https://docs.sqlalchemy.org/en/20/orm/session_basics.html) — sessão e concorrência | documentação oficial | alto |
| SRC-M03-07 | [Alembic cookbook](https://alembic.sqlalchemy.org/en/latest/cookbook.html) — operação de migrations | documentação oficial | alto |
| SRC-M03-08 | [PostgreSQL MVCC](https://www.postgresql.org/docs/current/mvcc.html) e [transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) — isolamento e transação | documentação oficial | médio |
| SRC-M03-09 | [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) e [ANALYZE](https://www.postgresql.org/docs/current/sql-analyze.html) — plano e estatística | documentação oficial | médio |
| SRC-M03-10 | [PostgreSQL JSON types](https://www.postgresql.org/docs/current/datatype-json.html) — JSONB e índices | documentação oficial | médio |
| SRC-M03-11 | [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/) e [build context](https://docs.docker.com/build/building/context/) | documentação oficial | alto |
| SRC-M03-12 | [Docker Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/) — health/dependência | documentação oficial | alto |
| SRC-M03-13 | [Testcontainers for Python](https://testcontainers.com/guides/getting-started-with-testcontainers-for-python/) — adapter de teste real | documentação oficial | alto |
| SRC-M03-14 | [GitHub Actions workflow syntax](https://docs.github.com/actions/writing-workflows/workflow-syntax-for-github-actions) e [security hardening](https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) | documentação oficial | alto |
| SRC-M03-15 | [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology) — sinal industrial datado | industrial | alto |

As fontes foram consultadas em 21/08/2026. Toda documentação de framework, imagem, action, versão de banco e sinal de mercado deve ser revalidada em até 90 dias. O sinal industrial mostra respostas de uma amostra voluntária; não mede vagas, custo, segurança ou adequação ao domínio.

## 7. Panorama de prática vigente

A pesquisa Stack Overflow 2025 reporta crescimento de FastAPI, PostgreSQL entre os bancos mais usados pelos respondentes e salto de uso de Docker. Isso sustenta a decisão didática de expor a combinação API, banco relacional, container e CI em um mesmo produto. Não prova que essa combinação é correta para qualquer empresa ou projeto.

O núcleo estudado é HTTP/OpenAPI, transação, schema versionado, imagem reproduzível e gate de qualidade. FastAPI e SQLAlchemy materializam o adapter Python; Django, Flask, Litestar, asyncpg puro ou outro ORM são alternativas com custos diferentes. PostgreSQL é o banco canônico deste módulo; SQLite não substitui sua evidência de concorrência. Docker Compose ensina composição local, não é uma tese sobre orquestração de produção. GitHub Actions exemplifica CI versionado; a regra transferível é que o pipeline execute os mesmos oráculos em ambiente neutro.

## 8. Gates e decisão G0

| Gate | Estado | Critério |
|---|---|---|
| G0 · escopo | **APROVADO** | oito blocos, 32 cenários, fontes classificadas, laboratório local e fronteiras curriculares definidos |
| G1 · conteúdo | EM PRODUÇÃO | HTML legado requer reconstrução didática e fontes por bloco |
| G2 · execução | PENDENTE | `lab/`, cópia temporária, gates, PostgreSQL real e evidência ainda não existem |
| G3 · avaliação | PENDENTE | checkpoint será convertido para cenários, demonstração e rubrica |
| G4 · portabilidade | PENDENTE | invariantes/adapters e Windows/Linux/Docker exigem verificação |
| G5 · produção | PENDENTE | timeout, cleanup, segredo, health, concorrência e release precisam de oráculos |
| G6 · editorial | PENDENTE | HTML, fontes, links, 390 px, impressão e revisão visual aguardam reconstrução |

**Decisão de G0:** aprovada em 21/08/2026 pelo orquestrador. A aprovação define o trabalho; ela não certifica o HTML legado, código inexistente ou deploy externo.
