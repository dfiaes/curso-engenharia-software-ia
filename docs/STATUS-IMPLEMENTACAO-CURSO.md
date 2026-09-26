# Status da implementação do curso

**Atualizado:** 26/09/2026 · **Curso principal:** 19 unidades / 152 blocos · **Apêndice ML opcional:** sete unidades / 48 blocos planejados.

Este é o único placar e fila operacional. Material existente não significa verificado. Planejamento editorial não altera estudo real em PROGRESSO.md. A release principal ainda não está pronta; leitura e navegação do estudante permanecem livres, com prontidão explícita.

## Prévia Editorial v1

O portal [`index.html`](../index.html) reúne as 19 unidades e os 152 blocos do principal para leitura e acompanhamento local. O rótulo `PRÉVIA_EDITORIAL` significa cobertura navegável, não `VERIFICADO`: laboratórios, checkpoints, integrações e G0–G6 continuam com os estados e bloqueios abaixo. Progresso salvo pelo portal pertence ao navegador do aluno e não altera este placar nem `PROGRESSO.md`.

## Decisões vigentes

- Conhecimento profundo e alta didática são prioridade; laboratório mínimo suficiente, sem complexidade ornamental.
- Python 3.14; sem pressupor outra stack; explicar termos e pré-requisitos no ponto de uso.
- Laboratório guiado final, retomável e resolvido; checkpoint separado e sem bloquear leitura.
- ML tabular, treinamento, validação e MLOps são apêndice opcional. Seus gates, dependências e atrasos nunca bloqueiam principal ou estudo.
- M05/M06/M11 explicam a matemática necessária no próprio percurso; não dependem de ML01–ML07.
- Escopo/tarefas no [backlog](BACKLOG-OPERACIONAL-V4.md) e na [especificação geral](especificacoes/FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md). Carregar apenas cartão e documentos em escopo.

## Execução contínua

**Automação:** PAUSADA

Autorizada em 24/09/2026, exclusivamente GPT-6 Luna high, com execuções separadas para autoria e revisão. O agendamento **Concluir curso com GPT-6 Luna**, ID `concluir-curso-com-gpt-6-luna`, está pausado durante a construção da Prévia Editorial v1 para impedir escritores concorrentes. O protocolo permanece no [backlog](BACKLOG-OPERACIONAL-V4.md#execução-contínua-com-gpt-6-luna) para eventual retomada explícita da certificação v4.

FIX-01, OPS-01 e DID-01 foram REVISADOS pelo RUN `01a0d688-c810-7050-9280-d87bcaaf28e8`. FIX-01 passou 41 testes, Ruff e mypy; OPS-01 reconciliou 613 IDs/owners, 11 critérios e as contagens da matriz; DID-01 passou exemplo positivo e dois controles negativos, com QA visual e validação com leitor ainda pendentes. FIX-03 foi corrigido pelo RUN `01a0d6a8-d38d-78b1-bd51-e9b122837b56` e REVISADO independentemente pelo RUN `01a0d6ad-6777-73f0-8ebd-0122a237fe6d`; 145 testes, Ruff e mypy passaram. O manifesto de produção continua ausente/revisão pendente, então M13 permanece NO-GO. FIX-04 foi revisado e investigado pelo RUN `01a0d6c4-4b1a-7482-9c37-d3608215101e`; está BLOQUEADO: `rollback()` restaura dados/schema, mas deixa `ClusterState.released` na tag revertida. Reproduzido em memória; 147 testes existentes passam, mas não cobrem o ponteiro. Corrigir exige `deploy.py` e `test_deploy.py`, fora do write set explícito; nenhum arquivo de código foi alterado neste ciclo. Nenhum gate foi promovido. O callback foi mantido removido; callbacks antigos que reportariam recuperação falsa ou lançariam erro são rejeitados pela API. FIX-05 teve autoria inicial no RUN `01a0d6ad-6777-73f0-8ebd-0122a237fe6d`; a revisão do RUN `01a0d6c4-4b1a-7482-9c37-d3608215101e` pediu conta de poder, borda e rubrica e o mesmo RUN adicionou esses itens. O RUN `01a0d6d2-06df-7fa1-a6e2-0c11bf34be2e` distinguiu valores sem correção e corrigidos (238/316 e 258/336). O RUN `01a0dd74-b016-7c80-af17-c3fb2528c094` alinhou a notação à fonte: `n′` sem correção e `n = n′ + 1/δ` corrigido. Esta revisão atribuiu com precisão a recomendação de continuidade a Fleiss, Levin e Paik conforme o NIST/SEMATECH. FIX-05 foi REVISADO independentemente pelo RUN `01a0de29-ee55-7dd2-a199-a2126b1c1b10`; nenhuma mudança nos gates. FIX-02 foi REVISADO pelo RUN anterior, com 46 testes, Ruff e mypy aprovados. OPS-02 foi implementado pelo RUN `01a0d696-83dc-77b0-89b8-cf0e6394992f` e REVISADO independentemente pelo RUN `01a0d6ad-6777-73f0-8ebd-0122a237fe6d`; validação estrutural e backlog passaram, sem certificação dos HTMLs. OPS-03 teve autoria inicial no RUN `01a0d6ad-6777-73f0-8ebd-0122a237fe6d`; após revisão com ajustes pelo RUN `01a0d6c4-4b1a-7482-9c37-d3608215101e`, foi REVISADO independentemente pelo RUN `01a0d6d2-06df-7fa1-a6e2-0c11bf34be2e`. Checks estruturais e backlog passaram; JSON e os 19 locks foram verificados, e controles de extra, mypy, interpretador e Docker foram reproduzidos. Relatório registra rubrica e limites. Nenhum AT/gate promovido. Docker ausente segue bloqueando as integrações correspondentes; a execução negativa de wheel com Python 3.9 não chegou a testar compatibilidade por falta de Hatchling. OPS-04 foi REVISADO independentemente pelo RUN `01a0de29-ee55-7dd2-a199-a2126b1c1b10` após correção estrutural do RUN `01a0de17-9e64-7661-93f3-dba46b3a29d7`; 13 testes focais passam e G6 continua pendente. FIX-05 permanece REVISADO após correção editorial pelo RUN `01a0de17-9e64-7661-93f3-dba46b3a29d7`; sem promoção de AT/gate. DID-02 está REVISADO pelo RUN `01a0de17-9e64-7661-93f3-dba46b3a29d7` após autoria `01a0dc04-f306-7f91-b0a4-1c24dcda5426`; checker estrutural e backlog passaram, sem execução de lab ou promoção de gate. DID-01 ainda requer QA visual e validação com leitor. A automação registra configuração do agendador e ID real, sem alegar introspecção do runtime.

## Estado reconciliado sem promoção de gates

| Unidades | Estado utilizável para decisão | Pendência principal |
|---|---|---|
| M00/M01 | material e labs existentes; aprovação técnica histórica | revisão da edição atual e G6 |
| M02 | 38 ATs verificados no baseline histórico | revalidar edição/apresentação; não confundir histórico com QA atual |
| M02A | material/lab existentes, evidência local parcial | confirmar todos os ATs, compatibilidade e alcance real das provas |
| M03–M10 | material e labs existentes, revisão técnica/didática pendente | profundidade, fontes, ATs e integração conforme spec; M06 FIX-05 REVISADO; FIX-06 AGUARDA_REVISAO |
| M11 | material/lab CPU existentes, gates parciais | revisar claims quantitativos e separar live opcional; G6 |
| M12 | integração/produção não certificadas | PostgreSQL, segurança ponta a ponta, operação e G6 |
| M13 | mecanismos locais; correção PRR FIX-03 revisada; NO-GO de release | manifesto de produção revisado, integração real, CAP-* e piloto |
| LT01–LT04 | material/labs existentes, garantias parciais | componentes reais e revisão do alcance das provas |
| ML01–ML07 | ESPECIFICADOS PARA REVISÃO; não produzidos | apêndice opcional com execução/aceites próprios |

REL-02 histórico registra 1.092 testes aprovados e nove skips. Não é execução desta revisão nem prova de completude. O diagnóstico atual reproduziu falso GO do PRR e aprovação de eval sem categorias obrigatórias. [Achados e limites](auditorias/STATUS-DIDATICA-PROFUNDIDADE-2026-09-21.md).

## Unidade ativa e fila única

**Unidade ativa: M02-S — AGUARDA_REVISAO.** O RUN `01a0dea7-003e-7262-8bbd-4ed3faf5d5e2` reconciliou a especificação, rastreabilidade e README do M02: 38 ATs e 43 competências coincidem, o catálogo foi preservado, e as instruções operacionais agora declaram cwd, sync/grupo `dev`, gates, cópia/retomada/limpeza sem alegar execução nova. `check_course.py`: 1 documento/0 erros; `validate_backlog.py`: 699/0. Nenhum AT/gate foi promovido; baseline técnica de agosto permanece histórica e G6 segue em revalidação. M00-B01-L e FIX-06, corrigidos pelo RUN atual, aguardam revisão independente. OPS-05 foi REVISADO pelo mesmo RUN; M03 offline passou 52 testes/6 deselected, skip simulado foi bloqueado e Docker ausente mantém integração PostgreSQL BLOCKED. M00-S e M01-S foram REVISADOS pelo RUN `01a0de37-aaa8-72e0-9b2a-11c0acc4e297`; FIX-05 e OPS-04 permanecem REVISADOS pelo RUN `01a0de29-ee55-7dd2-a199-a2126b1c1b10`. A seleção de M02-S veio de `course_flow.py next`.

**OPS-05 — REVISADO** pelo RUN `01a0dea7-003e-7262-8bbd-4ed3faf5d5e2`: suite M03 offline 52 passed/6 deselected; YAMLs carregados; controle simulado de skip bloqueado; integração PostgreSQL local segue BLOCKED porque Docker não está instalado. Nenhum gate/AT promovido.

1. FIX-01 → FIX-02: entrada e decisão do gate M06; FIX-03 → FIX-04: evidência e recuperação M13. Revisar cada cartão antes de encerrar.
2. FIX-05 → FIX-06: estatística e calibração do M06.
3. OPS-01–05 e DID-01/02, conforme DAG: rastreabilidade, fontes, ambiente, QA, CI e pontes internas.
4. Executar S/C/L/D/R/E do principal seguindo dependências do catálogo; conservar o que já estiver correto e revisar por bloco. Integração local real obrigatória continua bloqueadora até executada.
5. REL-01–06 fecham somente o principal.

**Fila opcional separada:** ML01 → ML02 → ML03; ML04/ML05; ML06 após fundamentos e M03; ML07 após ML04/05/06; ML-REL-01/02. Só executar quando selecionada como tarefa; não intercepta a fila principal nem bloqueia estudo.

FIX-01 está AGUARDA_REVISAO. FIX-05 está REVISADO pelo RUN `01a0de29-ee55-7dd2-a199-a2126b1c1b10`, após correção editorial pelo RUN `01a0de17-9e64-7661-93f3-dba46b3a29d7`; sem promoção de AT/gate. OPS-04 está REVISADO pelo RUN `01a0de29-ee55-7dd2-a199-a2126b1c1b10`, após correção estrutural pelo RUN `01a0de17-9e64-7661-93f3-dba46b3a29d7`; G6 continua pendente. A autoria e os pareceres anteriores permanecem nos relatórios focais. DID-02 está REVISADO pela execução independente `01a0de17-9e64-7661-93f3-dba46b3a29d7` após autoria `01a0dc04-f306-7f91-b0a4-1c24dcda5426`; ver relatório focal para evidências e limites. Os demais cartões novos permanecem PLANEJADOS, exceto os trabalhos documentais já registrados. Existência de HTML, testes antigos ou título parecido não conclui tarefa. Atualizar a linha/registro focal com ID, estado, revisão e evidência quando houver execução real.

## Bloqueios e regra de fechamento

- P1 atuais em M06/M13, correções conceituais e inconsistências de evidência: corrigir e revalidar.
- Infraestrutura: disponibilidade de Docker/PostgreSQL deve ser medida no ambiente da execução; registros antigos de ausência não provam ausência atual.
- Fontes de alto risco: revalidar claim correto e versão; não inventar data.
- G6: checker estrutural não certifica foco/contraste/impressão; exigir observação.
- Piloto/feedback: depende de participante real consentido, não pode ser fabricado.

Somente evidência atual revisada altera G0–G6. Bloqueio opcional não bloqueia principal; bloqueio obrigatório não desaparece por skip/fake. Nenhuma release ou deploy foi autorizado por este plano.

## Organização e histórico

Foram movidos 21 relatórios/auditorias antigos e preservadas seis versões dos documentos consolidados. Decisões atuais estão acima; histórico não compõe o contexto padrão. [Arquivo e manifesto](historico/README.md). Evidências de labs, fixtures, ADRs e PROGRESSO.md foram preservados.
