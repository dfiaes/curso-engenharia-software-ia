# CLAUDE.md — Regras do repositório do curso

## O que é

Curso de Engenharia de Software e IA em Python, em português, que leva uma pessoa do nível **júnior** ao nível de **especialista e líder técnico** em sistemas com IA. A sequência oficial está em [`CURRICULO.md`](CURRICULO.md): cinco fases (0 a 4), cada uma com módulos HTML autossuficientes e laboratórios executáveis.

O aluno principal é um dev sênior que usa o curso também para **revisar fundamentos** que se perdem na rotina. Por isso o curso começa de verdade no básico, mas cada módulo abre com um **diagnóstico rápido** que permite pular o que já está firme.

## Público e didática

- Presumir que o leitor ainda não conhece o assunto do módulo. Pré-requisitos ficam explícitos e apontam para o módulo que os ensina.
- Não esconder vocabulário técnico para parecer simples: definir no primeiro uso, manter o termo profissional, voltar ao exemplo que o torna observável.
- Para cada conceito: situação/falha reconhecível → definição e modelo mental → mecanismo → decisão e limites → exemplo completo ou contraste → diagnóstico.
- Material denso e autossuficiente para estudo independente. Sem perguntas socráticas no meio da leitura; a avaliação fica no checkpoint do fim do módulo.
- **Regra de ouro:** se o aluno precisar sair do material para entender um termo, o material falhou.
- Voz de autor experiente, frases que alternam decisão curta e explicação desenvolvida. Sem conectivos de enchimento ("além disso", "vale ressaltar"), sem adjetivos grandiosos, sem introduções de aquecimento.
- **Ressalvas com parcimônia.** Limites técnicos reais (o que um mecanismo não garante) ficam; avisos editoriais repetidos ("não certifica", "não bloqueia", "não prova") saem.
- Python é a linguagem canônica. Comparação com outra stack (Java, C#, JavaScript) só em caixa curta opcional, quando ajuda a transferir um conceito.

## Estrutura de um módulo

Arquivo único `modulos/<CÓDIGO>-<slug>/<CÓDIGO>.html`, com o mesmo CSS e componentes do M04 (`.box`, `.box.warn`, `.box.ok`, `.box.fund`, `.box.net`, `.toc`, `.step`, `.check`). Ordem:

1. `<h1>` com código e título; linha `.meta` com fase, carga estimada e pré-requisitos.
2. Caixa "O que muda ao final deste módulo" e **Diagnóstico rápido** (5–8 perguntas; quem acerta tudo pode pular para o checkpoint).
3. Roteiro (`.toc`) com âncoras reais.
4. Blocos: `<h2 id="b01">Bloco 1 · Título</h2>` … (o portal detecta "Bloco N" no `h2`; o `id` é obrigatório).
5. `<h2 id="lab-guiado">Laboratório guiado <CÓDIGO></h2>`: passos com objetivo, comando exato, resultado esperado e diagnóstico.
6. `<h2>Tabela de Diagnóstico</h2>` (sintoma → causa → conserto).
7. `<h2>Checkpoint <CÓDIGO></h2>`: perguntas por cenário com rubrica "Basta / Reprova".
8. `<h2>Fontes e versões</h2>` e caixa de conclusão curta.
9. `<script src="../../portal/course-bridge.js" data-unit="<CÓDIGO>"></script>` antes de `</body>`.

## Laboratórios

- Referência versionada em `modulos/<CÓDIGO>-<slug>/lab/` (estrutura do lab do M04: `pyproject.toml`, `src/`, `tests/`, `create_working_copy.py`, `README.md`, `uv.lock`).
- O roteiro cria uma cópia de trabalho temporária; o aluno nunca edita a referência.
- Python 3.14 com `uv`, `pytest`, `ruff`, `mypy --strict`. Pydantic v2 nas fronteiras; FastAPI para HTTP; SQLAlchemy 2 + Alembic e PostgreSQL a partir do M03 (SQLite permitido nos fundamentos, com as diferenças explicadas).
- Prática obrigatória sem conta paga, credencial ou rede. Integrações reais (nuvem, APIs de LLM) são trilha opcional; o caminho principal usa fake ou servidor local fiel ao contrato.
- Comandos canônicos para macOS/Linux (zsh/bash); alternativa PowerShell quando diferir.
- Saída de terminal publicada vem de execução real ou é rotulada como exemplo variável. Testes cobrem caminho feliz, borda, falha injetada e um controle negativo.
- Para não poluir o repositório, rode os labs com `UV_PROJECT_ENVIRONMENT` fora da pasta do curso ou apague a `.venv` depois.

## Fontes

Especificação, RFC/PEP, documentação oficial e paper original primeiro; texto de praticante como complemento rotulado. Nenhum fornecedor define sozinho o padrão. Separar invariante, padrão aberto e adapter atual. Versões, preços e recursos de produto são de alto risco: registrar a data de verificação. Detalhes em [`docs/POLITICA-FONTES-E-AGNOSTICISMO.md`](docs/POLITICA-FONTES-E-AGNOSTICISMO.md) e [`docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md`](docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md).

## Estado editorial

Um único arquivo, [`STATUS.md`](STATUS.md), com uma linha por módulo: `pronto`, `revisar` ou `rascunho`. Um módulo só vira `pronto` depois de revisão humana com o lab executado. `PROGRESSO.md` registra apenas estudo real do aluno; trabalho editorial não o altera.

## Convenções

- Commits, PRs e READMEs de lab em inglês, imperativo e escopo curto (`F03: add heap exercise`). Material didático e conversa em português.
- Segredos em `.env` (nunca commitados), `.env.example` atualizado, sem caminho absoluto de máquina no código.
- `python3 tools/build_course_portal.py` regenera o portal a partir de `portal/course-source.json` e dos `h2` dos módulos; `python3 tools/check_course.py` verifica links e âncoras.

## Tutoria (como o aluno pede ajuda)

- `Explique Y` → explicação direta, com contexto suficiente.
- `Revise meu código` → revisão de tech lead: correção, idiomatismo Python, testabilidade, segurança, custo. Apontar o que está bom e dizer quando está medíocre.
- `Estou travado` → ajuda no nível pedido (pista, direção, esqueleto ou código).
- `Checkpoint <CÓDIGO>` → avaliação sem consulta, uma pergunta por vez; reprovar é permitido.
- `Voltei` → resumo de 5 linhas de onde parou.
- `Revisão em espiral` → 10 perguntas dos 3 últimos módulos + refatoração de código antigo.
- `Variação difícil` → versão mais dura de um exercício.
