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
| T2 | Atualizar guia de estudo, README, currículo e decisão/status editorial para refletir a trilha curada como entrada atual. | Ordem e escopo idênticos ao manifesto; fontes com leitura essencial/aprofundamento; atividades opcionais; nenhum pagamento obrigatório; acervo e v4 descritos como referências separadas. | CONCLUÍDO nesta sessão |
| T3 | Executar testes locais e verificações amplas, verificar links externos, smoke test acessível quando permitido, corrigir regressões e registrar fechamento. | Testes do portal/progresso; `build_course_portal.py --check`; `check_course.py`; `validate_backlog.py`; `git diff --check`; inspeção de diff/staging; limitações visuais documentadas. | CONCLUÍDO nesta sessão |

## Registro de sessões e progresso

### T1 — CONCLUÍDO

- Sessão Codex: `01a0de99-b1f3-76b3-986b-b4c4b25df5a2` (`Planejar versão rápida do curso`).
- Alterações em curso: `portal/study-route-source.json`, `portal/study-route-manifest.json`, `tools/build_course_portal.py`, `portal/index.template.html`, `portal/portal.js`, `portal/progress.js`, `portal/portal.css`, `index.html` e testes correspondentes.
- Resultado: manifesto canônico contém dez etapas ordenadas, leituras essenciais/aprofundamentos, atribuições, escopo por fonte, referências opcionais e data de curadoria. Portal gerado incorpora o manifesto, prioriza a trilha e deixa o acervo local secundário. O estado `studyRoute` é independente dos 152 blocos; importação mantém `externalRoute` antigo como histórico e não converte marcações. Um link OWASP que não abriu foi substituído pela página oficial do Top 10 2026.
- Evidência executada: `python3 tools/test_course_portal.py` (7 testes), `node tools/test_portal_progress.js` (assertions passaram), `node --check portal/portal.js`, `node --check portal/progress.js`, `python3 tools/build_course_portal.py --check` e `git diff --check` passaram.
- Pendente para T2/T3: alinhar guia/README/currículo com o manifesto; rodar verificações amplas; smoke test visual/teclado conforme permitido pelo ambiente.
- Checkpoint Git: `c21d9b9` (`Build curated study route in course portal`), após baseline `531004d`.
- Segurança de dados: arquivos `.DS_Store` existentes são locais e permanecem fora do escopo/staging. `PROGRESSO.md` não deve ser alterado. Automação editorial v4 permanece pausada; nenhum gate será promovido.

### T2 — CONCLUÍDO

- Sessão Codex: `01a0dfd1-2b6e-7d62-b4eb-873a3f6e2799`, iniciada no checkpoint `2cde14e` (`Record curated route T1 checkpoint`).
- Arquivos: `docs/ROTEIRO-ESTUDO-GRATUITO.md`, `README.md`, `CURRICULO.md`, `docs/STATUS-IMPLEMENTACAO-CURSO.md` e este plano.
- Resultado: os quatro documentos usam as dez etapas do manifesto na mesma ordem; o guia traz sínteses originais, leituras essenciais, aprofundamentos e atividades opcionais. Codex/OpenCode têm prática direta; Claude Code/Cursor são comparados por documentação. Pagamento, API comercial, assinatura e certificado não são requisitos. Os módulos locais permanecem como acervo secundário; M11 e ML01–ML07 são opcionais. Checklist pessoal, gates v4 e automação editorial permanecem separados, sem promoção.
- Evidência focal: verificação programática contra `portal/study-route-source.json` confirmou 10 etapas, ordem, títulos, URLs, papéis `essential`/`deepening` e atividades opcionais; busca por contagens/estados obsoletos não encontrou ocorrências; `python3 tools/check_course.py` nos cinco documentos retornou 0 erros estruturais/de links e 0 referências legadas; `git diff --check` passou.
- Limites: T2 não executa testes do portal, validações amplas, inspeção visual, smoke test, checagem externa de links nem qualquer gate; esses itens pertencem ao T3.
- Checkpoint Git: `9db5413` (`Document curated study route`), após o checkpoint T1 `2cde14e`.

### T3 — CONCLUÍDO

- Sessão/task Codex: `01a0dfd8-8478-7160-aad2-b6fa2fc1bb4d`, iniciada no checkpoint `4c0f330` (`Record curated route T2 checkpoint`).
- Resultado: manifesto, portal e progresso foram validados em conjunto sem regressão encontrada. A fonte estruturada e o manifesto gerado são idênticos, preservam 10 etapas, 19 unidades e 152 blocos, e o progresso da trilha continua separado do acervo e do roteiro legado. Nenhum arquivo de módulo, lab, gate v4, automação ou `PROGRESSO.md` foi alterado.
- Links externos: 36 entradas e 34 URLs únicas do manifesto coincidem com `portal/study-route-source.json`, `portal/study-route-manifest.json`, o guia e o portal incorporado. A URL oficial `https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/` está propagada sem divergência. Como toda a lista possui curadoria registrada em `26/09/2026`, não houve navegação adicional para revalidar links já registrados.
- Evidência executada: `python3 tools/test_course_portal.py` (7 testes), `node tools/test_portal_progress.js`, `python3 tools/build_course_portal.py --check`, `python3 tools/check_course.py` (121 documentos, 0 erros; 14 referências/relógios legados apenas para revisão contextual), `python3 tools/validate_backlog.py` (699 tarefas, 0 erros), `git diff --check`, `node --check portal/portal.js` e `node --check portal/progress.js` passaram. A comparação programática de URLs passou; a verificação estática confirmou manifesto incorporado sem `fetch`, skip link e foco principal, controles semânticos, proteção dos links externos, foco visível, breakpoints que cobrem 390 px e movimento reduzido.
- Limite visual: a tentativa direta de abrir `file:///Users/denisson/Documents/Codigo/Estudos/Claude/tutor-ia-opencode/index.html` no navegador do ambiente foi bloqueada pela política de segurança de URLs. Conforme o escopo do cartão, não foi usado servidor local, CDP, outro navegador ou ferramenta alternativa para contornar o bloqueio. Portanto, teclado real, desktop, 390 px, overflow e renderização `file://` não foram certificados nesta sessão; os testes automatizados e estáticos acima são substitutos explícitos, não equivalentes à observação visual.
- Inspeção: staging vazio antes do fechamento; diff T1–T3 sem whitespace inválido; nenhum padrão semelhante a segredo nas linhas adicionadas; somente os dois `.DS_Store` locais permanecem não rastreados e fora do staging. Não houve correção funcional porque nenhuma regressão da trilha/portal foi encontrada.
- Checkpoint Git: commit de fechamento `Close curated study route validation`; hash registrado pelo commit documental imediatamente seguinte.
- Próximo cartão: nenhum neste plano; a Prévia Editorial v1 permanece separada da certificação v4 e não promove gates.

## Protocolo de retomada

1. Confirmar branch e estado do Git; não descartar mudanças locais nem incluir `.DS_Store`.
2. Ler este plano e o status atual. Inspecionar apenas o escopo do cartão ativo.
3. Executar um cartão por sessão. Não começar dependentes antes do aceite registrado.
4. Ao encerrar a sessão, registrar arquivos, comandos/testes, resultado, bloqueios e checkpoint Git. Deixar explícito o próximo cartão elegível.
5. Se a sessão terminar antes do aceite, manter o cartão `EM ANDAMENTO`, anotar exatamente o último passo e retomar o mesmo cartão antes de abrir outro.
