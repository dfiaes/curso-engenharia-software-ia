# DID-01 — ponte de entrada opcional

**Estado:** REVISADO  
**Sessão de autoria:** 01a0d671-e469-7ca1-80a1-ef1ab571ec87  
**Sessão de revisão:** 01a0d688-c810-7050-9280-d87bcaaf28e8  
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador  
**Data:** 25/09/2026  
**ATs/gates:** nenhum AT ou gate promovido.

## Objetivo e baseline

M00 e M01 apresentam código Python antes do ensino aprofundado da linguagem em M02. A ponte precisava contextualizar vocabulário comum sem virar pré-requisito, avaliação ou rito de estudo. Baseline focal: não existia `modulos/apoio/entrada.html` nem link para uma consulta transversal em M00, M01 ou no percurso principal do `CURRICULO.md`.

## Alterações

- `modulos/apoio/entrada.html`: página de consulta com âncoras para terminal/argv/retorno, programa completo, variáveis/funções/listas/dicionários/Path, JSON, ambiente, Git/snapshots e diagnóstico. O exemplo lê um JSON com biblioteca padrão, valida estrutura/campos, trata erro sem traceback e devolve códigos distintos.
- `modulos/M00-ferramental/M00.html`: link próximo à orientação inicial de M00.
- `modulos/M01-workflow-ia-driven/M01.html`: link adjacente à explicação inline de Python anterior ao M02.
- `CURRICULO.md`: apresenta a ponte como consulta opcional e declara que não é unidade avaliativa.

A página não instala serviço ou biblioteca, não cria checkpoint, não solicita commit e não registra estudo. M00/M01 continuam responsáveis por explicar mecanismos próprios e por definir sintaxe específica no ponto de uso. A natureza da prova do exemplo é experimento local da biblioteca padrão; não é integração externa.

## Execução e evidência

CWD: raiz do projeto. Ambiente: CPython 3.14.7 da `.venv` local existente; macOS. O verificador extraiu o bloco `<pre><code>` do HTML sem alterar sua fonte, escreveu o programa e o JSON em diretório temporário, e executou:

```text
positivo: exit=0
stdout='Projeto: Cartografo\n- API\n- avaliacao\n'
stderr=''

JSON inválido: exit=2
stderr começa com 'erro: não foi possível ler ... JSONDecodeError ...'
Traceback=False

argv incompleto: exit=2
stderr='uso: py -3.14 .\\ler_resumo.py .\\relatorio.json'
Traceback=False
```

O exemplo positivo confirma o resultado anunciado. Os controles negativos confirmam diagnósticos nas fronteiras de sintaxe JSON e quantidade de argumentos. Outros trechos de terminal da página são explicativos e não são apresentados como saídas medidas.

Verificações editoriais após incluir a evidência:

```text
python3 tools/check_course.py
Checked 103 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.

python3 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
Planning validation only: no source, lab, learning outcome or release certified.
```

## Fontes e limites

Referências primárias consultadas em 25/09/2026:

- [Python 3.14 `sys.argv`](https://docs.python.org/3.14/library/sys.html#sys.argv), argumentos do processo;
- [Python 3.14 `json`](https://docs.python.org/3.14/library/json.html), conversão e `JSONDecodeError`;
- [Python 3.14 `pathlib`](https://docs.python.org/3.14/library/pathlib.html#reading-and-writing-files), caminho e leitura de texto;
- [Python 3.14 `os.environ`](https://docs.python.org/3.14/library/os.html#os.environ), mapeamento do ambiente do processo;
- documentação oficial de [Git `status`](https://git-scm.com/docs/git-status) e [Git `diff`](https://git-scm.com/docs/git-diff).

Não foi feita QA visual em browser, 390 px ou impressão. A página usa landmarks semânticos, foco visível, CSS responsivo e regra de impressão, mas o checker estrutural não substitui essa observação. A execução do exemplo é local e temporária; não houve teste com participante nem alegação de compreensão medida.

## Rubrica e próximo passo

Contexto/pré-requisitos = 2; mecanismo e exemplo completo = 2 para a leitura/parsing do exemplo; decisão/limites = 2 para explicar sintaxe JSON, validação e ambiente; falha/diagnóstico = 2 para JSON malformado e argv incompleto; transferência = referência e relações causais, sem piloto de aluno; fontes/evidência = 2 para os conceitos descritos e execução reproduzida; navegabilidade = estrutura/links verificados, QA visual pendente. A revisão independente conferiu o HTML, os links, os controles negativos e o limite entre exemplo local e integração. `PROGRESSO.md` permaneceu intocado.

## Revisão independente — 25/09/2026

**Resultado:** REVISADO. RUN `01a0d688-c810-7050-9280-d87bcaaf28e8`; `automation.toml` confirma `gpt-6-luna / high`, como configuração do agendador, sem alegação sobre introspecção do runtime.

Li o HTML e conferi os links em M00, M01 e no currículo. O programa completo explica argumentos, funções, tipos dinâmicos do JSON, validação, erros, código de saída e caminhos; a ponte se declara opcional e não cria avaliação ou condição de acesso. Executei o bloco de programa extraído do HTML em diretório temporário com CPython local: exemplo positivo saiu com código 0 e o resumo anunciado; JSON inválido e argv incompleto saíram com código 2 e sem traceback. `check_course.py` e `validate_backlog.py` também passaram nesta execução, sem erros estruturais/de link ou de backlog.

Referências primárias conferidas em 25/09/2026: documentação oficial Python 3.14 para [`sys.argv`](https://docs.python.org/3.14/library/sys.html#sys.argv), [`json`](https://docs.python.org/3.14/library/json.html), [`pathlib`](https://docs.python.org/3.14/library/pathlib.html#reading-and-writing-files) e [`os.environ`](https://docs.python.org/3.14/library/os.html#os.environ), e documentação oficial do Git para [`status`](https://git-scm.com/docs/git-status) e [`diff`](https://git-scm.com/docs/git-diff). As explicações correspondem às operações usadas. Não encontrei achado pendente no escopo da ponte.

Limites preservados: sem QA visual em browser/390 px/impressão e sem leitura por participante; checker e execução do exemplo não medem compreensão nem aprovam G6. Nenhum AT ou gate foi promovido. `PROGRESSO.md` permaneceu intocado.
