# Plano de implementação — Trilha Curada

**Objetivo:** tornar a trilha curada de dez etapas a entrada principal do portal, mantendo os 19 módulos, 152 blocos e progresso legado disponíveis e intactos.

**Branch:** `codex/course-preview-v1`

**Baseline preservada:** `531004d` (`Add curated study route to course portal`)

**Modo de trabalho:** um cartão por sessão Codex; concluir, validar, registrar e criar checkpoint antes de abrir o próximo. Não executar cartões em paralelo.

## Mapa de dependências

```text
T1 — Manifesto, percurso e progresso no portal
 ├── T2 — Documentação e currículo coerentes com o novo percurso
 └── T3 — Validação integrada, smoke test e fechamento
      (T3 aguarda T1 e T2)
```

T2 pode começar após T1, mas T3 só fecha quando ambos estiverem concluídos. Uma sessão trabalha em apenas um cartão. Ao concluir, registra aqui o resultado, evidências, commit/checkpoint e limites; então a próxima sessão deve ler este documento e `docs/STATUS-IMPLEMENTACAO-CURSO.md` antes de agir.

## Cartões

| ID | Escopo | Aceite | Estado |
|---|---|---|---|
| T1 | Fonte estruturada com dez etapas; manifesto incorporado ao portal; trilha como percurso principal; progresso curado independente do acervo; migração conservadora do roteiro antigo. | 10 etapas na ordem aprovada; Codex/OpenCode com prática; Claude Code/Cursor comparados; M11/ML opcionais; acesso direto sem `fetch`; progresso novo separado e import/export compatível. | CONCLUÍDO nesta sessão |
| T2 | Atualizar guia de estudo, README, currículo e decisão/status editorial para refletir a trilha curada como entrada atual. | Ordem e escopo idênticos ao manifesto; fontes com leitura essencial/aprofundamento; atividades opcionais; nenhum pagamento obrigatório; acervo e v4 descritos como referências separadas. | PRONTO PARA SESSÃO ISOLADA |
| T3 | Executar testes locais e verificações amplas, verificar links externos, smoke test acessível quando permitido, corrigir regressões e registrar fechamento. | Testes do portal/progresso; `build_course_portal.py --check`; `check_course.py`; `validate_backlog.py`; `git diff --check`; inspeção de diff/staging; limitações visuais documentadas. | AGUARDA T1 + T2 |

## Registro de sessões e progresso

### T1 — CONCLUÍDO

- Sessão atual: continuação do pedido de implementação no task existente. O ID do task atual será registrado após consulta ao índice de tasks do Codex.
- Alterações em curso: `portal/study-route-source.json`, `portal/study-route-manifest.json`, `tools/build_course_portal.py`, `portal/index.template.html`, `portal/portal.js`, `portal/progress.js`, `portal/portal.css`, `index.html` e testes correspondentes.
- Resultado: manifesto canônico contém dez etapas ordenadas, leituras essenciais/aprofundamentos, atribuições, escopo por fonte, referências opcionais e data de curadoria. Portal gerado incorpora o manifesto, prioriza a trilha e deixa o acervo local secundário. O estado `studyRoute` é independente dos 152 blocos; importação mantém `externalRoute` antigo como histórico e não converte marcações. Um link OWASP que não abriu foi substituído pela página oficial do Top 10 2026.
- Evidência executada: `python3 tools/test_course_portal.py` (7 testes), `node tools/test_portal_progress.js` (assertions passaram), `node --check portal/portal.js`, `node --check portal/progress.js`, `python3 tools/build_course_portal.py --check` e `git diff --check` passaram.
- Pendente para T2/T3: alinhar guia/README/currículo com o manifesto; rodar verificações amplas; smoke test visual/teclado conforme permitido pelo ambiente.
- Checkpoint Git: commit T1 a registrar após o commit deste cartão.
- Segurança de dados: arquivos `.DS_Store` existentes são locais e permanecem fora do escopo/staging. `PROGRESSO.md` não deve ser alterado. Automação editorial v4 permanece pausada; nenhum gate será promovido.

### T2 — AGUARDA INÍCIO DA PRÓXIMA SESSÃO

- Sessão/task Codex: será criada após o checkpoint de T1; executar apenas documentação e alinhamento editorial listados no cartão.
- Resultado/evidência/checkpoint: a preencher ao concluir.

### T3 — AGUARDA

- Sessão/task Codex: a registrar ao iniciar.
- Resultado/evidência/checkpoint: a preencher ao concluir.

## Protocolo de retomada

1. Confirmar branch e estado do Git; não descartar mudanças locais nem incluir `.DS_Store`.
2. Ler este plano e o status atual. Inspecionar apenas o escopo do cartão ativo.
3. Executar um cartão por sessão. Não começar dependentes antes do aceite registrado.
4. Ao encerrar a sessão, registrar arquivos, comandos/testes, resultado, bloqueios e checkpoint Git. Deixar explícito o próximo cartão elegível.
5. Se a sessão terminar antes do aceite, manter o cartão `EM ANDAMENTO`, anotar exatamente o último passo e retomar o mesmo cartão antes de abrir outro.
