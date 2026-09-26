# Backlog operacional — principal e apêndice opcional

**Revisão:** 21/09/2026 · **Estado:** planejamento detalhado, não evidência de execução.
**Fila e estado:** somente [STATUS](STATUS-IMPLEMENTACAO-CURSO.md). **Contrato:** [especificação de aprofundamento](especificacoes/FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md).

Este catálogo substitui as antigas tabelas de épicos e a expansão genérica de 422 tarefas. A versão anterior foi preservada no [arquivo histórico](historico/2026-09-21/snapshots/BACKLOG-OPERACIONAL-V4.md). IDs C/L/D existentes são conservados onde possível; como alguns temas antigos divergiam da spec, consultar o título/briefing atual, nunca presumir que um ID herdou aprovação histórica.

## Como entregar uma tarefa a um modelo menor

```text
python3 tools/backlog_tasks.py --task FIX-01 --prompt
python3 tools/backlog_tasks.py --task M06-B01-C --prompt
python3 tools/backlog_tasks.py --task ML03-B05-L --bundle
python3 tools/backlog_tasks.py --json --track core
python3 tools/backlog_tasks.py --json --track appendix
python3 tools/validate_backlog.py
```

No Windows, `python` pode substituir `python3` para as ferramentas de manutenção. Os labs continuam Python 3.14 com uv. `--prompt` entrega instruções, caminhos, briefing, critérios, passos, controles negativos e comandos; `--bundle` incorpora as leituras existentes sem exigir memória desta conversa. Para C/L/D, o HTML é recortado pelo bloco e pelas seções de laboratório/diagnóstico necessárias; revisões integrais recebem o documento inteiro. O bundle ainda pode ser longo: usar a tarefa focal, nunca despejar todo o catálogo no contexto. Nenhum desses comandos executa labs, distribui tarefas ou promove gates.

Fonte editável dos briefings: `docs/planejamento-v4/catalogo.json`. Fonte dos procedimentos/expansão: `tools/backlog_tasks.py`. Specs locais continuam autoridade técnica; S resolve divergências e atualiza o briefing quando necessário. Um relatório de tarefa vive em `docs/planejamento-v4/evidencias/ID.md` somente depois de execução. Não pré-criar evidências verdes.

## Tamanho e divisões

- Principal: 19 unidades, 152 blocos; correções urgentes, governança, autoria/revisão e REL-01–06.
- Apêndice ML: sete unidades, 48 blocos; execução e aceites separados, ML-REL-01/02.
- Cada bloco tem C, L e D. Cada unidade tem S, R e E. São cortes de trabalho do autor, não sessões do aluno.
- O número materializado é mostrado pelo gerador; não equivale a esforço restante. Em material correto, tarefa valida/reutiliza e não exige reescrita.

| Etapa | Entrega delimitada | Condição de fechamento |
|---|---|---|
| S | reconciliar spec, fontes, ATs e desenho do lab mínimo | revisão G0, sem aprovar material |
| C | um bloco de explicação e exemplo trabalhado | mecanismo, pré-requisitos, decisão e limite claros |
| L | experimento mínimo daquele bloco no lab do módulo | execução real, positivo/negativo, diagnóstico e roteiro final |
| D | diagnóstico, variante e rubrica | contribui para checkpoint final único, com transferência |
| R | revisão técnica/didática independente do módulo | evidência por requisito e nenhum P1 aberto |
| E | QA visual e prontidão da edição | teclado, 390px, impressão, fontes, navegação; revisão do orquestrador |

Desde 24/09/2026, autoria, revisão e fechamento usam exclusivamente GPT-6 Luna high. A automação avança sem nova confirmação por cartão. Revisão continua independente da autoria; falhas são corrigidas e novamente revisadas. As regras anteriores de troca para Sol/Astra e parada obrigatória após cada cartão foram substituídas pelo usuário. Não reduzir profundidade para aumentar velocidade.

## Correções e fundações explícitas

| IDs | Trabalho concreto |
|---|---|
| FIX-01/02 | schema e gate M06: vazio, missing, NaN, categoria ausente e regressão |
| FIX-03/04 | manifesto PRR e recuperação M13: arquivo vazio/errado, bloqueio e falso GO |
| FIX-05/06 | estatística e juiz no M06: inferência e concordância corretas, sem apêndice obrigatório |
| OPS-01 | reconciliar cada cenário real e sua prova, sem inventar ATs em intervalos esparsos |
| OPS-02 | fonte por claim, sem confundir preço, janela, saída e cache |
| OPS-03 | runtime/locks/CPU, comandos por lab, bootstrap separado de execução offline |
| OPS-04 | checagem estrutural e QA manual distintos |
| OPS-05 | CI equivalente ao gate local, principal e opcional separados |
| DID-01 | ponte consultável de entrada para programação/terminal/Git |
| DID-02 | matemática mínima ensinada dentro de M05/M06/M11; ML opcional |

Os cartões FIX incluem reproduções, arquivos de entrada, casos negativos e resultados de aceite. Não considerar a existência deste plano como correção das falhas.

## Cobertura por unidade

| Unidade | Blocos | Cartões | Experimento deliberadamente pequeno |
|---|---:|---|---|
| M00 | 5 | `M00-S`, `B01..B05-C/L/D`, `M00-R/E` | contrato e policy local |
| M01 | 5 | `M01-S`, `B01..B05-C/L/D`, `M01-R/E` | runner de workflow e sandbox Git |
| M02 | 8 | `M02-S`, `B01..B08-C/L/D`, `M02-R/E` | csv-cleaner existente |
| M02A | 15 | `M02A-S`, `B01..B15-C/L/D`, `M02A-R/E` | work-intake existente |
| M03 | 8 | `M03-S`, `B01..B08-C/L/D`, `M03-R/E` | link-shortener + um PostgreSQL |
| M04 | 4 | `M04-S`, `B01..B04-C/L/D`, `M04-R/E` | design_guard + poucos documentos |
| M05 | 7 | `M05-S`, `B01..B07-C/L/D`, `M05-R/E` | gateway local + dois adapters fake |
| M06 | 6 | `M06-S`, `B01..B06-C/L/D`, `M06-R/E` | runner de evals + dataset curto |
| M07 | 8 | `M07-S`, `B01..B08-C/L/D`, `M07-R/E` | corpus curto + busca local |
| M08 | 8 | `M08-S`, `B01..B08-C/L/D`, `M08-R/E` | investigador com duas ou três tools |
| M09 | 7 | `M09-S`, `B01..B07-C/L/D`, `M09-R/E` | cliente/servidor local e subset declarado |
| M10 | 10 | `M10-S`, `B01..B10-C/L/D`, `M10-R/E` | workflow em arquivo e grafo pequeno |
| M11 | 8 | `M11-S`, `B01..B08-C/L/D`, `M11-R/E` | treino CPU minúsculo + contas de serving |
| M12 | 9 | `M12-S`, `B01..B09-C/L/D`, `M12-R/E` | API pequena e PostgreSQL com dois tenants |
| M13 | 20 | `M13-S`, `B01..B20-C/L/D`, `M13-R/E` | uma jornada API → job → consulta → evidência |
| LT01 | 6 | `LT01-S`, `B01..B06-C/L/D`, `LT01-R/E` | um processo servidor e um cliente |
| LT02 | 6 | `LT02-S`, `B01..B06-C/L/D`, `LT02-R/E` | dois workers e broker/PostgreSQL local |
| LT03 | 6 | `LT03-S`, `B01..B06-C/L/D`, `LT03-R/E` | um workload em sandbox local |
| LT04 | 6 | `LT04-S`, `B01..B06-C/L/D`, `LT04-R/E` | um artefato e dossiê pequeno |
| ML01 (opcional) | 6 | `ML01-S`, `B01..B06-C/L/D`, `ML01-R/E` | Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados. |
| ML02 (opcional) | 6 | `ML02-S`, `B01..B06-C/L/D`, `ML02-R/E` | Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados. |
| ML03 (opcional) | 8 | `ML03-S`, `B01..B08-C/L/D`, `ML03-R/E` | Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados. |
| ML04 (opcional) | 6 | `ML04-S`, `B01..B06-C/L/D`, `ML04-R/E` | Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados. |
| ML05 (opcional) | 8 | `ML05-S`, `B01..B08-C/L/D`, `ML05-R/E` | Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados. |
| ML06 (opcional) | 8 | `ML06-S`, `B01..B08-C/L/D`, `ML06-R/E` | Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados. |
| ML07 (opcional) | 6 | `ML07-S`, `B01..B06-C/L/D`, `ML07-R/E` | Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados. |

## Dependências e critérios corrigidos

O DAG materializado preserva dependências curriculares e serializa blocos que alteram o mesmo HTML. Correções urgentes não dependem do curso inteiro. Release principal alcança todas as tarefas bloqueadoras core; nenhuma tarefa ML aparece como ancestral de REL-06. ML depende de fundamentos do principal quando necessário, nunca o inverso. Blocos continuam acessíveis para estudo independentemente desse fluxo editorial.

Critérios legados de M07/M08/M11 que exigiam vitória de técnica, multiplicador fixo ou percentual universal são substituídos no briefing por comparar e explicar. A tarefa S registra a reconciliação na spec; o histórico não é apagado. A fonte técnica precisa sustentar o critério novo.

## Evidência, bloqueios e revisão

**Bloqueados impedem release** apenas quando pertencem ao escopo obrigatório daquela trilha; bloqueio ML não impede principal. `BLOCKED` não equivale a conclusão. Uma API externa opcional indisponível não vira bloqueio do núcleo; sua classificação é feita em S, antes de observar resultado. PostgreSQL, processo, protocolo ou container são reais quando a propriedade depende deles; não substituir por dict/mock para aprovar.

Lab simples é prioridade: uma função ou fixture quando suficiente; poucos componentes locais quando indispensáveis. Não eliminar conhecimento profundo, falha/diagnóstico ou invariantes para reduzir infraestrutura. S/R/E conferem a rubrica técnica/didática da especificação geral.

Relatório por tarefa: objetivo, diff, ATs, versão/ambiente, comandos/cwd e saída real, evidência, rubrica, limitações e AGUARDA_REVISAO/BLOQUEADO. O orquestrador atualiza status/gates; PROGRESSO.md registra somente estudo real.

REL-01 cobertura → REL-02 execução → REL-03 apresentação/compreensão → REL-04 fontes → REL-05 revisão integrada → REL-06 terminal. Apêndice: ML-REL-01 integração → ML-REL-02 revisão própria. Publicação/deploy não fazem parte deste planejamento.

## Execução contínua com GPT-6 Luna

**Autorização:** 24/09/2026. Executar e revisar os cartões automaticamente, sempre com `gpt-6-luna`. O usuário autorizou execuções separadas no projeto por ciclo. O modelo é fixado no agendador; escrever seu nome no prompt não muda o modelo. Usar high em todos os ciclos para manter uma configuração única para código, teoria, matemática e revisão. Nenhuma etapa exige Sol/Astra.

### Ciclo automático

1. Leia AGENTS.md, o status e este protocolo. Use o ID real da tarefa do aplicativo como RUN. Confira a configuração retornada pelo agendador quando disponível; registre sua origem, sem inventar introspecção. Adquira `python3 tools/course_flow.py acquire --run RUN`. Se PAUSADA, encerre. Se OCUPADO, não altere arquivos nem aguarde em loop.
2. Execute `python3 tools/course_flow.py next --run RUN`. Ele prioriza revisões, ajustes e cartões com dependências REVISADAS; principal antes do apêndice. Não despeje o catálogo completo no contexto. Antes de cada edição, confira novamente se a automação permanece ATIVA.
3. Carregue `python3 tools/backlog_tasks.py --task ID --bundle` apenas para o cartão selecionado. Reutilize leituras comuns já feitas nesta execução. Confira código, fontes e artefatos em escopo; preserve alterações preexistentes. Nenhum reset, limpeza geral, commit de todo o checkout ou reescrita integral por conveniência.
4. **IMPLEMENTAR:** conservar o que já atende ao aceite; corrigir/completar apenas lacunas. Rodar verificações focais, registrar comandos/saídas reais, ATs e rubrica. Entregar AGUARDA_REVISAO; registrar RUN em `Sessão de autoria` e retirar revisão anterior do cabeçalho corrente (mantê-la no histórico do relatório). Não revisar a própria entrega nesta execução.
5. **REVISAR:** ler artefatos e evidência, não apenas a conclusão do autor. Confirmar todos os aceites e cenários negativos, teoria, didática e limites. Uma entrega antiga sem ID pode receber autoria `sessao-anterior-nao-identificada`, com origem explicitada; isso não prova qual modelo a escreveu. Revisor registra seu RUN em `Sessão de revisão`. Sem achados pendentes: REVISADO. Com achados: AJUSTES_NECESSARIOS. Se o revisor alterar conteúdo/código para corrigir, torna-se autor dessa revisão e devolve AGUARDA_REVISAO para outra execução. REL-05 mantém dois pareceres independentes, em execuções distintas; o primeiro parecer deixa AGUARDA_REVISAO e registra sua própria sessão.
6. Atualize o relatório do cartão e a unidade ativa no status após cada ação. Use exatamente os campos abaixo no topo do relatório. Não promover gates por mera mudança de estado: gates exigem evidência completa e revisão. Rastreabilidade só muda quando o cartão e a evidência a sustentarem.
7. Consulte `next` novamente e continue sem pedir confirmação, até **seis ações ou aproximadamente 30 minutos por ciclo**. Esse limite é de contexto/retomada, não pausa do projeto nem prazo do aluno. Pare antes se o próximo trabalho não couber com qualidade; registre o ponto exato. Não iniciar dependente sem aceite revisado. Revisar várias entregas prévias e depois implementar cartões liberados é permitido; aprovar autoria da própria execução é proibido.
8. Em saída normal, libere `python3 tools/course_flow.py release --run RUN`. Outro ciclo continua automaticamente. Nunca roube mutex por idade: após interrupção, consulte o estado da tarefa proprietária no aplicativo; só libere usando seu ID se confirmou que terminou/foi interrompida. Um lock com proprietário desconhecido exige diagnóstico, não apagamento cego.

Cabeçalho de relatório (o restante preserva evidências e revisões anteriores):

```text
**Estado:** AGUARDA_REVISAO
**Sessão de autoria:** ID real da execução autora
**Sessão de revisão:** pendente
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
```

Antes de REVISADO, substitua `pendente` pelo ID real da execução revisora, distinto da autora. Não use identificadores inventados para simular independência. Uma revisão é julgamento técnico, não uma função do coordenador. O script só verifica dependências/estados/IDs; não comprova verdade da evidência nem qualidade pedagógica. Se reabrir um cartão já aprovado, reabrir também os descendentes cuja validade ficou comprometida antes de continuar.

### Velocidade sem perda didática

- Reutilizar ambientes e código corretos; medir lacunas antes de editar. Cartão já atendido exige evidência/revisão, não reimplementação ornamental.
- Uma execução pode tratar vários cartões elegíveis sequencialmente. Compartilhar descoberta de arquivos e verificação de fontes invariantes dentro do ciclo; manter relatório individual por cartão.
- Testes focais após mudanças; suíte do módulo após integração. Não repetir suíte global após cada parágrafo nem pular o que o cartão exige. Reutilização de resultados só com arquivos/ambiente inalterados e origem explícita.
- Manter um único escritor no checkout para evitar conflitos. Ferramentas de leitura e checks independentes podem executar em paralelo. Não criar subagentes ou outras tarefas fora dos ciclos autorizados como forma de multiplicar escritores.
- Profundidade permanece obrigatória: problema → definição → mecanismo → exemplo trabalhado → decisão/limite → falha/diagnóstico. Labs pequenos e suficientes, nunca saídas simuladas para fingir domínio.
- As primeiras amostras de código, explicação e laboratório seguem sendo avaliadas; continuar a fila não equivale a declarar o piloto aprovado.

### Bloqueios e parada

Erros comuns são tratados automaticamente. Após duas tentativas sem progresso no mesmo achado, registrar BLOQUEADO com causa, evidência e condição de retomada; continuar cartões independentes. Reavaliar somente quando houver nova evidência ou mudança ambiental. Não trocar de modelo nem reduzir critérios. Falta de permissão, cota, serviço ou participante real não pode ser contornada; informar quando impedir todo avanço. Computador/app precisam estar disponíveis para execução local.

O usuário pode escrever **“Pare a implementação automática do curso”** em qualquer sessão deste projeto. O agente deve primeiro executar `python3 tools/course_flow.py pause`, pausar o agendamento do aplicativo pelo ID registrado no status e solicitar interrupção da execução ativa pelo mecanismo disponível. O executor verifica PAUSADA entre ações/edições, salva retomada sem iniciar outro cartão e libera o mutex. Pausar agendamento não garante cancelar instantaneamente uma ferramenta que já está em execução.

Para retomar, o usuário escreve **“Retome a implementação automática do curso com Luna”**. Execute `python3 tools/course_flow.py resume` e reative a mesma automação, preservando nome, projeto, prompt, modelo e intervalo. Não criar duplicata. Não retomar sem pedido do usuário.

Quando todos os cartões estiverem revisados e os gates exigidos comprovados, registrar conclusão e pausar o agendamento para não consumir cota sem trabalho. Fechamento do principal não depende do apêndice; após principal revisado, o fluxo pode produzir ML01–ML07 e fechar o apêndice separadamente. Nenhuma publicação/deploy foi autorizada.

### Retomada manual de contingência

Se o agendamento não estiver disponível, selecione GPT-6 Luna high e envie: “Execute um ciclo do protocolo de execução contínua em docs/BACKLOG-OPERACIONAL-V4.md; respeite o controle ATIVA/PAUSADA, o mutex, as dependências e a revisão independente. Registre o ponto de retomada.” Isso executa um ciclo, mas não substitui um agendamento real.
