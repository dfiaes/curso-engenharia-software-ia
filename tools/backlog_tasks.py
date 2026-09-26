"""Emit one bounded course task. Planning never certifies execution or gates.

The catalog is data, not a status database. Use --task ID --prompt for a short
handoff or --task ID --bundle for a self-contained packet of mandatory readings.
The optional ML appendix never blocks the main course release.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import TypedDict, cast

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "docs/planejamento-v4/catalogo.json"
SHARED = "docs/especificacoes/FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md"
READINGS = (
    "AGENTS.md",
    "CLAUDE.md",
    "docs/POLITICA-FONTES-E-AGNOSTICISMO.md",
    "docs/STATUS-IMPLEMENTACAO-CURSO.md",
    "docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md",
    SHARED,
)


class Requirement(TypedDict):
    id: str
    requirement: str
    blocks: list[str]


class Block(TypedDict):
    number: int
    title: str
    brief: str
    acceptance_ids: list[str]
    scenario_details: list[str]
    teaching_notes: str
    minimum_experiment: str
    supplementary_acceptance: str


class Module(TypedDict):
    id: str
    title: str
    folder: str
    spec: str
    trace: str
    html: str
    lab: str
    prerequisites: list[str]
    new: bool
    lab_design: str
    sources: list[str]
    requirements: list[Requirement]
    unassigned: list[str]
    blocks: list[Block]
    notes: str
    track: str


# Static shape for repository-owned planning data; validate_backlog checks its semantics.
_module_rows = cast(
    list[Module], json.loads(CATALOG.read_text(encoding="utf-8"))["modules"]
)
MODULES: dict[str, Module] = {m["id"]: m for m in _module_rows}


@dataclass(frozen=True)
class Task:
    id: str
    kind: str
    owner: str
    depends_on: tuple[str, ...]
    topic: str
    inputs: tuple[str, ...]
    outputs: tuple[str, ...]
    acceptance: tuple[str, ...]
    commands: tuple[str, ...]
    release_blocking: bool = True
    track: str = "core"
    steps: tuple[str, ...] = ()
    context: str = ""
    limits: tuple[str, ...] = ()
    sources: tuple[str, ...] = ()
    evidence: str = ""
    scenario_ids: tuple[str, ...] = ()
    cwd: str = "."


COMMON_LIMITS = (
    "Respeitar o escopo deste cartão; avanço entre cartões segue o protocolo de automação. Preservar mudanças existentes; não editar PROGRESSO.md; não publicar/deployar.",
    "Reutilizar artefato correto. Não reescrever módulo inteiro, criar projeto por bloco ou adicionar infraestrutura sem necessidade.",
    "Fonte é ponto de partida: consultar original, registrar claim/seção/versão/data real; sem rede, marcar revalidação pendente.",
    "Não inventar execução, resultado, aluno, entrevista ou benchmark. BLOCKED não é PASS. Trilha opcional não bloqueia o principal.",
    "A prática guiada contém solução e diagnóstico; avaliação só no checkpoint final e sem bloquear navegação.",
    "Se escopo não couber em uma intervenção, propor subcortes por conceito mantendo dependências; não reduzir profundidade.",
    "Executor não promove gates. Entrega AGUARDA_REVISAO, com evidência e limitações, para o orquestrador.",
)


def lab_commands(m: Module) -> tuple[str, ...]:
    extra = (
        " --extra dev --extra mcp"
        if m["id"] == "M00"
        else (" --extra dev" if m["id"] == "M01" else " --group dev")
    )
    return (
        f"cwd={m['lab']}: uv sync --locked --offline{extra}",
        f"cwd={m['lab']}: uv run --locked --offline ruff check .",
        f"cwd={m['lab']}: uv run --locked --offline ruff format --check .",
        f"cwd={m['lab']}: uv run --locked --offline mypy",
        f"cwd={m['lab']}: uv run --locked --offline pytest -q",
        "Os comandos só ficam canônicos após S validar pyproject/lock e arquivos de entrada do mypy. Dependência ausente: bootstrap separado ou BLOCKED, nunca relaxar o gate.",
    )


def foundation_tasks() -> list[Task]:
    # Each row is an independently reviewable fix, with concrete negative cases.
    rows = [
        (
            "FIX-01",
            (),
            "M06: validar evidência de entrada",
            "modulos/M06-evals-observabilidade/lab",
            "src/eval_lab/gate.py e tests/test_gate.py; adicionar arquivo de schema somente se necessário.",
            "Relatório vazio/sem por_categoria; campo errado; NaN/inf; taxa fora de 0..100; categoria obrigatória ausente; amostra zero.",
            "Ler contrato atual de Resultado/runner e consumidores. Definir schema explícito com versão, contagens por categoria, identificação de dataset/SUT e taxas derivadas. Não quebrar CLI sem atualizar seu produtor e fixture. Implementar validação separada antes da decisão.",
            "Todo caso inválido produz erro acionável e CLI não-zero; nenhum default transforma ausência em zero aceitável; relatório válido continua funcionando.",
        ),
        (
            "FIX-02",
            ("FIX-01",),
            "M06: gate fechado por categoria e regressão",
            "modulos/M06-evals-observabilidade/lab",
            "src/eval_lab/gate.py, runner/produtor correspondente e testes focais.",
            "Atual vazio contra baseline injection=100/vazamento=100; categoria removida; baseline incompatível; queda no limite; segurança abaixo do piso.",
            "Iterar conjunto obrigatório configurado, não apenas chaves recebidas. Comparar dataset, versão de métrica e denominadores. Definir tolerância, piso e amostra no contrato antes do experimento; amostra insuficiente vira INCONCLUSIVO bloqueador de promoção, não reprovação do aluno.",
            "Missing/FAIL/INCONCLUSIVO não aprovam. Teste de regressão reproduz ([],[]) antigo e o elimina; caso válido aprova por cálculo, não por passed fornecido.",
        ),
        (
            "FIX-03",
            (),
            "M13: PRR valida evidência substantiva",
            "modulos/M13-capstone/lab",
            "src/capstone_lab/prr.py, tests/test_prr.py, contrato do manifesto em lab/docs e evidência de teste própria.",
            "Diretório vazio; arquivo vazio; JSON inválido; requisito faltante; status FAIL/BLOCKED; digest de outra revisão; hash inválido; caminho que escapa da raiz.",
            "Definir manifesto tipado por requisito com command/cwd/returncode, resultado, artifact hash, revisão, ambiente, cenário, escopo da prova e limitações. Validar arquivo/conteúdo e correspondência com requisito. Hash prova integridade, não verdade: associar comando e resultado revisados. Dados históricos ficam preservados e não convertidos automaticamente.",
            "PRR antigo reproduz GO com diretórios vazios; implementação nova retorna NO-GO e motivos por requisito. Fixture válida passa; relatório inválido jamais levanta sucesso por exists().",
        ),
        (
            "FIX-04",
            ("FIX-03",),
            "M13: game day exige recuperação observada",
            "modulos/M13-capstone/lab",
            "src/capstone_lab/prr.py, tests/test_prr.py e contrato do callback de recuperação; não construir cluster.",
            "Callback recovered=False, callback lança erro, timeline de cinco eventos sem resultado, evento fora de ordem, PRR incompleto.",
            "Introduzir resultado de experimento com detecção/ação/recuperação e evidências. Usar duração medida quando publicada; relógio simulado deve estar rotulado. Decisão exige critérios satisfeitos, não comprimento da timeline. Manter simulador didático claramente separado da integração futura.",
            "Cinco eventos + recovered=False dão NO-GO; execução válida e PRR válido dão GO no escopo local declarado. Piloto e produção não são aprovados por este teste.",
        ),
        (
            "FIX-05",
            ("FIX-02",),
            "M06: corrigir inferência estatística no bloco 1",
            "modulos/M06-evals-observabilidade",
            "M06.html (fundamentos de avaliação/estatística), RASTREABILIDADE.md e spec M06; não antecipar apêndice obrigatório.",
            "50 e 200 casos sem poder/confiança; não-significância confundida com equivalência; diferenças em amostras não pareadas.",
            "Substituir regras numéricas universais. Explicar proporção, erro padrão, intervalo Wilson, efeito, pareamento, poder e inconclusivo com conta pequena. Exemplo 45/50 e 180/200 tem intervalo calculado; não tirar diferença detectável apenas da largura do intervalo. Introduzir matemática necessária dentro do bloco e link opcional ML01 apenas quando existir.",
            "Símbolos definidos, cálculo verificável, pressupostos e interpretação correta; não tratar teste unitário como inútil; checkpoint testa decisão sob incerteza.",
        ),
        (
            "FIX-06",
            ("FIX-05",),
            "M06: calibração humana e juiz no bloco 3",
            "modulos/M06-evals-observabilidade",
            "M06.html (graders/calibração/fechamento), lab/tests/test_judge.py se necessário e trace/spec.",
            "Juiz sempre-sim em classe majoritária; rótulo roteirizado apresentado como humano; 85% tratado como regra universal.",
            "Separar concordância, matriz por classe, erro amostral e calibração probabilística. Justificar limiar pelo custo de erros. Distinguir rótulo humano real de fixture demonstrativa; separar ajuste de rubrica e conjunto final. Dar exemplo completo de dois juízes que empatam no agregado mas erram classes distintas.",
            "Não declarar coleta humana inexistente; explicar limite do juiz determinístico; permitir incerteza e abstenção em vez de um percentual mágico.",
        ),
        (
            "OPS-01",
            (),
            "Reconciliar cenário, bloco, prova e estado",
            ".",
            "docs/planejamento-v4/catalogo.json, specs/trace correspondentes e docs/MATRIZ-RASTREABILIDADE.md; preservar IDs.",
            "AT inexistente; ID esparso tratado como faixa contínua; prova local apresentada como integração; tabela cuja soma diverge.",
            "Conferir por script os IDs extraídos contra as tabelas de aceitação reais; separar divergências para o S da unidade, sem reescrever todos os módulos nesta tarefa. Conservar identidade histórica; anexar disposition conservar/corrigir/complementar e natureza da prova. Registrar revisão dos critérios quantitativos enviesados em S de M07/M08/M11. Não declarar gates a partir de quantidade de arquivos/testes.",
            "Todos os ATs existentes têm owner de bloco e destino; nenhum ID foi fabricado para preencher lacuna numérica; lacuna continua explícita.",
        ),
        (
            "OPS-02",
            ("OPS-01",),
            "Fonte por afirmação e semântica correta",
            ".",
            "docs/planejamento-v4/fontes.json (saída nova), specs afetadas; não atualizar todos os HTMLs nesta tarefa.",
            "Tokens mínimos de cache confundidos com janela/saída; link de prompt caching usado para contextual retrieval; versão sem consulta.",
            "Definir registro de claims e preencher amostra focal M05/M06; cada S completa somente sua unidade. Campos: arquivo/seção, texto exato, unidade, contexto, URL primária, data de consulta/verificação e risco. Separar norma, paper, adapter e guidance. Criar lista focal de correções por módulo; validar fonte antes de marcar atual.",
            "Nenhuma data de leitura inventada; fonte sustenta a afirmação específica; sem rede permanece REVALIDAR, com impacto declarado.",
        ),
        (
            "OPS-03",
            ("OPS-01",),
            "Ambiente mínimo e comandos canônicos",
            ".",
            "docs/planejamento-v4/ambientes.json (saída nova), READMEs dos labs somente para comandos incorretos.",
            "M00/M01 extras ausentes; mypy sem arquivos; wheel sem Python 3.14; novo lab ausente; Docker não disponível.",
            "Ler pyproject/lock por lab principal e resolver comandos cwd/extra/group reais. Compatibilidade/instalação ML fica no S opcional de cada unidade e não bloqueia esta tarefa principal. Verificar Python/uv/CPU e caches; registrar versões/limites. Registrar procedimento de verificação para ML opcional, sem exigir que seja executado aqui; não instalar GPU nem baixar modelos. Distinguir bootstrap com rede de execução offline; manter dependência obrigatória indisponível BLOCKED.",
            "Matriz por unidade com cwd, sync, lint/format/type/test/build aplicável, pré-requisitos e estado observado; exemplos de comandos não se tornam saída executada.",
        ),
        (
            "OPS-04",
            ("OPS-01",),
            "QA estrutural com limites honestos",
            ".",
            "tools/check_course.py, tools/test_check_course.py e docs de QA ativas.",
            "Checker verde usado como contraste/teclado/impressão certificados; âncora faltante; diagrama sem alternativa.",
            "Manter contrato do checker explícito. Adicionar somente verificações estruturais determinísticas úteis, com falso positivo/negativo. Definir roteiro manual browser para contraste, foco, reflow/390px, zoom e impressão. Resultado manual não é inferido de CSS existente.",
            "Relatório separa estrutural automatizado e observação visual; recursos indisponíveis não geram certificação G6.",
        ),
        (
            "OPS-05",
            ("OPS-03", "OPS-04"),
            "CI equivalente ao gate local",
            ".",
            ".github/workflows/ e script de execução focal em tools/; não executar deploy.",
            "Falha escondida com continue-on-error; integração omitida aprovada; logs sem ambiente; workflow opcional bloqueia principal.",
            "Implementar jobs pequenos para checker e labs com comandos canônicos. Separar core e appendix, matriz offline e integração local; detectar pré-requisito antes. Actions pinadas e permissões mínimas. Artefatos têm comando/versão/revisão; não publicar segredos.",
            "Falha em ML opcional não bloqueia release principal; falha obrigatória core bloqueia; workflow testado e equivalente local documentado.",
        ),
        (
            "DID-01",
            (),
            "Ponte de entrada sem bloqueio de estudo",
            ".",
            "modulos/apoio/entrada.html (novo) e links em M00/M01/CURRICULO.md; não criar módulo avaliativo.",
            "JSON, argv, função, dict, path e terminal usados sem explicação antes de M02.",
            "Ensinar leitura de arquivo/comando, retorno/erro, variável/função/coleção, JSON, Git snapshot e ambiente por um exemplo curto completo. Vocabulário no ponto de uso; pausas por âncora. Vincular termos de M00/M01 à ponte sem substituir a explicação inline necessária.",
            "Leitor entende o exemplo sem outra stack e sem instalar serviço; material é consulta opcional, nunca pré-teste, cronômetro ou ritual.",
        ),
        (
            "DID-02",
            ("OPS-01",),
            "Pontes matemáticas internas ao principal",
            ".",
            "docs/planejamento-v4/pontes-principal.md (contrato de inserção); M05/M06/M11 S recebem referência.",
            "M05/M06/M11 exigirem ML01/ML05 opcionais para compreensão.",
            "Mapear definição/probabilidade/distribuição/vetor/gradiente no ponto de uso. Determinar seção principal dona e exemplo pequeno. Indicar reutilização por link profundo sem depender de HTML ML ainda inexistente; não duplicar trilha inteira.",
            "Cada pré-requisito indispensável tem explicação acessível no principal; apêndice é aprofundamento e não predecessor bloqueador.",
        ),
    ]
    result = []
    for identifier, deps, title, cwd, write_set, negatives, procedure, accept in rows:
        module = (
            "M06"
            if identifier in {"FIX-01", "FIX-02", "FIX-05", "FIX-06"}
            else ("M13" if identifier in {"FIX-03", "FIX-04"} else None)
        )
        inputs = (
            READINGS
            + ((MODULES[module]["spec"], MODULES[module]["trace"]) if module else ())
            + ("docs/auditorias/STATUS-DIDATICA-PROFUNDIDADE-2026-09-21.md",)
        )
        if identifier.startswith("FIX"):
            # Exact code/HTML entry point is already in write_set; include the folder for discovery only.
            inputs += (cwd,)
        result.append(
            Task(
                identifier,
                "repair" if identifier.startswith("FIX") else "governance",
                "GPT-6-Luna-high",
                deps,
                title,
                inputs,
                (write_set,),
                (
                    accept,
                    "Caso positivo, borda e controles negativos descritos têm evidência; revisão independente requerida.",
                ),
                (
                    (
                        "uv run --locked --offline pytest -q",
                        "uv run --locked --offline ruff check .",
                        "uv run --locked --offline mypy",
                    )
                    if cwd.endswith("/lab")
                    else (
                        "python3 tools/check_course.py",
                        "python3 tools/validate_backlog.py",
                    )
                ),
                steps=(
                    "Registrar baseline focal antes da mudança.",
                    procedure,
                    "Executar controles negativos: " + negatives,
                    "Rever diff e entregar evidência/limites sem promover gates.",
                ),
                context=negatives,
                limits=COMMON_LIMITS,
                evidence=f"docs/planejamento-v4/evidencias/{identifier}.md",
                cwd=cwd,
            )
        )
    return result


def build_tasks() -> list[Task]:
    tasks = foundation_tasks()
    for item, m in MODULES.items():
        core = m["track"] == "core"
        spec, trace, html, lab = m["spec"], m["trace"], m["html"], m["lab"]
        requirements = tuple(a["id"] for a in m["requirements"])
        prereq = tuple(f"{p}-E" for p in m["prerequisites"])
        scope_deps: tuple[str, ...] = ("OPS-01", "OPS-02", "OPS-03", "DID-02")
        if item == "M06":
            scope_deps += ("FIX-06",)
        if item == "M13":
            scope_deps += ("FIX-04",)
        tasks.append(
            Task(
                f"{item}-S",
                "scope",
                "GPT-6-Luna-high",
                scope_deps,
                f"{item}: reconciliar escopo e laboratório mínimo",
                READINGS + (spec,) + ((trace,) if not m["new"] else ()),
                (
                    spec,
                    trace,
                    f"{lab}/README.md",
                    "docs/planejamento-v4/catalogo.json (somente a unidade "
                    + item
                    + ")",
                ),
                (
                    "Cada bloco tem competência, pré-requisitos, exemplo/falha, fontes e AT real; mapa inclui todos os IDs, sem aprovação automática.",
                    "Separar demonstração local/integração real/externo opcional antes da execução; simples não significa evidência falsa.",
                    "Resolver claims enviesados nas specs e rastrear alteração; não exigir ganho estatístico predeterminado.",
                    "README declara comandos exatos e cwd, mypy files/strict, extras, cópia/cleanup, diagnóstico e retomada; ainda não declara execução.",
                ),
                ("python3 tools/validate_backlog.py", "python3 tools/check_course.py"),
                core,
                m["track"],
                (
                    "Ler spec e trace atuais; classificar cada trecho como conservar/corrigir/complementar.",
                    "Conferir o mapa de ATs herdado no catálogo contra a fonte; corrigir divergência mantendo IDs.",
                    "Desenhar um único laboratório incremental: " + m["lab_design"],
                    "Validar os comandos de ambiente com OPS-03; escolher o menor componente real que prova o escopo.",
                    "Registrar fontes por claim e distinguir material novo de baseline histórica; entregar para revisão G0.",
                ),
                m["notes"],
                COMMON_LIMITS,
                tuple(m["sources"]),
                f"docs/planejamento-v4/evidencias/{item}-S.md",
                requirements,
            )
        )
        previous = (f"{item}-S", *prereq, "DID-01")
        for b in m["blocks"]:
            base = f"{item}-B{b['number']:02}"
            details = (
                b["brief"]
                + "\n\nCuidados: "
                + b["teaching_notes"]
                + "\n\nExperimento mínimo: "
                + b["minimum_experiment"]
                + "\n\nCritérios herdados/candidatos (S deve reconciliar antes de executar):\n"
                + "\n".join(b["scenario_details"])
            )
            ids = tuple(b["acceptance_ids"])
            common_accept = (
                "Problema, definição, mecanismo, exemplo trabalhado, decisão/limite e falha/diagnóstico explícitos.",
                b["supplementary_acceptance"],
                *b["scenario_details"],
            )
            inputs = READINGS + (spec, trace, html, f"{lab}/README.md")
            tasks.append(
                Task(
                    base + "-C",
                    "content",
                    "GPT-6-Luna-high",
                    previous,
                    b["title"],
                    inputs,
                    (html, spec, trace),
                    common_accept,
                    (f"python3 tools/check_course.py {html}",),
                    core,
                    m["track"],
                    (
                        "Abrir apenas o bloco alvo e suas dependências; reutilizar conteúdo que já atende ao contrato.",
                        "Enumerar conceitos do briefing. Para cada um: explicar problema e definição antes de nomear biblioteca; introduzir pré-requisitos localmente.",
                        "Desenvolver mecanismo em passos causais com entrada/estado/saída; em matemática definir símbolos, unidades e fazer conta pequena.",
                        "Resolver o exemplo mínimo, explicar cada passagem e comparar uma alternativa; rotular código ainda não executado como conceitual.",
                        "Explicar a falha/limite dos cenários; fontes junto às afirmações. Não publicar resultado do L antes de executá-lo.",
                        "Revisar como leitor iniciante e registrar lacunas restantes para L/D; nenhuma prática manual fora do laboratório final.",
                    ),
                    details,
                    COMMON_LIMITS,
                    tuple(m["sources"]),
                    f"docs/planejamento-v4/evidencias/{base}-C.md",
                    ids,
                )
            )
            tasks.append(
                Task(
                    base + "-L",
                    "lab",
                    "GPT-6-Luna-high",
                    (base + "-C",),
                    b["title"] + " — experimento mínimo",
                    inputs,
                    (lab, html, trace),
                    (
                        "Executar caso positivo, borda e falha relevante; controle negativo demonstra que o oráculo consegue reprovar.",
                        "Comandos e outputs têm versão/ambiente; dados ilustrativos e resultados reais separados; pipeline não força conclusão.",
                        "Roteiro final reproduz referência, informa estado inicial, arquivo, motivo, resultado, diagnóstico, encerramento e retomada.",
                        *common_accept,
                    ),
                    lab_commands(m),
                    core,
                    m["track"],
                    (
                        "Reusar laboratório; localizar função/teste equivalente antes de criar arquivo. Confirmar pyproject/lock e comandos aprovados em S.",
                        "Implementar somente o menor experimento descrito no briefing; sem serviço novo se função/fixture bastar.",
                        "Injetar falha e executar oráculo positivo/negativo; se propriedade depende de componente real, não trocar por fake para aprovar.",
                        "Executar gates focais e suíte afetada; armazenar saída real. Runtime canônico indisponível: BLOCKED com comando/causa.",
                        "Atualizar somente a etapa correspondente do laboratório final e ligar exemplo conceitual ao arquivo testado.",
                        "Verificar cópia temporária/cleanup e retomada; registrar limites e natureza da evidência.",
                    ),
                    details,
                    COMMON_LIMITS,
                    tuple(m["sources"]),
                    f"docs/planejamento-v4/evidencias/{base}-L.md",
                    ids,
                    lab,
                )
            )
            tasks.append(
                Task(
                    base + "-D",
                    "assessment",
                    "GPT-6-Luna-high",
                    (base + "-L",),
                    b["title"] + " — diagnóstico e transferência",
                    inputs,
                    (html, trace, f"{m['folder']}/RUBRICA.md"),
                    (
                        "Um cenário de transferência altera restrição/entrada; rubrica explica alternativas aceitáveis e erros críticos.",
                        "Diagnóstico liga sintoma a hipótese, evidência e correção; não lista apenas mensagens genéricas.",
                        "Rubrica editorial sem zeros centrais; mecanismo/exemplo/decisão/diagnóstico suficientes. Evidência citada por requisito, não contagem.",
                        "Avaliação adicionada ao checkpoint final único; guia permanece inteiramente resolvido.",
                        *common_accept,
                    ),
                    (f"python3 tools/check_course.py {html}",),
                    core,
                    m["track"],
                    (
                        "Confrontar texto C e execução L; resolver afirmações/saídas divergentes.",
                        "Escrever tabela sintoma → hipótese → como distinguir → correção → limite.",
                        "Adicionar cenário de checkpoint final que muda contexto; escrever gabarito/rubrica em RUBRICA.md para tutoria.",
                        "Aplicar rubrica da especificação geral citando trecho e teste para cada dimensão.",
                        "Registrar cobertura AT por evidência e pendências; leitor não precisa concluir checkpoint para continuar.",
                    ),
                    details,
                    COMMON_LIMITS,
                    tuple(m["sources"]),
                    f"docs/planejamento-v4/evidencias/{base}-D.md",
                    ids,
                )
            )
            previous = (base + "-D",)
        tasks.append(
            Task(
                f"{item}-R",
                "review",
                "GPT-6-Luna-high",
                previous,
                f"{item}: revisão técnica e didática independente",
                READINGS + (spec, trace, html, f"{m['folder']}/RUBRICA.md"),
                (trace,),
                (
                    "Revisor cita defeitos por localização/impacto; não aprova só porque testes passaram.",
                    "Todas as competências centrais atingem N4; produção N5 no escopo real; referências opcionais não são pré-requisitos ocultos.",
                    "Exemplos, avaliações e ATs cobertos; reler claims quantitativos e distinção fake/real; nenhum P1 aberto.",
                ),
                (f"python3 tools/check_course.py {html}",),
                core,
                m["track"],
                (
                    "Usar contexto novo e revisor distinto da autoria; ler texto como iniciante, depois como responsável técnico.",
                    "Conferir cada AT contra teste/evidência e cada questão contra explicação prévia; executar controle negativo focal quando a prova for fraca.",
                    "Registrar APROVAR_PARA_GATES ou DEVOLVER com IDs específicos; o orquestrador decide promoção.",
                ),
                m["notes"],
                COMMON_LIMITS,
                tuple(m["sources"]),
                f"docs/planejamento-v4/evidencias/{item}-R.md",
                requirements,
            )
        )
        tasks.append(
            Task(
                f"{item}-E",
                "editorial",
                "GPT-6-Luna-high",
                (f"{item}-R", "OPS-04"),
                f"{item}: QA e prontidão explícita",
                READINGS + (spec, trace, html),
                (html, trace),
                (
                    "Desktop/390px, teclado, foco, contraste, zoom, SVG alternativo e impressão inspecionados e registrados.",
                    "Âncoras/links válidos; prontidão visível; acessibilidade não inferida de CSS; bloqueio visual permanece pendente.",
                ),
                (f"python3 tools/check_course.py {html}",),
                core,
                m["track"],
                (
                    "Servir localmente e abrir a página; não exigir file://.",
                    "Percorrer sumário/lab/checkpoint/retomada com teclado; verificar conteúdo a 390px e zoom.",
                    "Inspecionar impressão completa, tabelas/código/diagramas; corrigir recortes e revalidar somente o afetado.",
                    "Consolidar evidência e submeter G0–G6 ao orquestrador sem sobrescrever baseline histórica.",
                ),
                m["notes"],
                COMMON_LIMITS,
                (),
                f"docs/planejamento-v4/evidencias/{item}-E.md",
                requirements,
            )
        )
    core_end = tuple(f"{i}-E" for i, m in MODULES.items() if m["track"] == "core")
    foundations = tuple(t.id for t in foundation_tasks())
    release = [
        (
            "REL-01",
            (*core_end, *foundations),
            "Cobertura principal",
            "Conferir 19 unidades, 152 blocos e cada AT real; tabela de gates reflete edição atual, provas e limitações.",
        ),
        (
            "REL-02",
            ("REL-01", "OPS-05"),
            "Execução principal",
            "Executar gates em ambiente limpo conforme matriz; integrar jornada mínima real do M13; não elevar simulador a produção. Separar opcionais.",
        ),
        (
            "REL-03",
            ("REL-02",),
            "QA principal",
            "Rever navegação e apresentação global; realizar piloto didático consentido quando possível. Sem participante, registrar pendência, nunca inventar aprendizado.",
        ),
        (
            "REL-04",
            ("REL-03",),
            "Fontes e claims principal",
            "Revalidar afirmações de alto risco; verificar semântica/unidade e fonte, números versus amostras e hash da revisão.",
        ),
        (
            "REL-05",
            ("REL-04",),
            "Revisão integrada principal",
            "Dois revisores leves independentes verificam artefatos atuais e evidências; nenhum P1 obrigatório aberto. Falha no apêndice não bloqueia principal.",
        ),
        (
            "REL-06",
            ("REL-05",),
            "Revisão terminal principal",
            "GPT-6 Luna em execução independente revisa somente o principal fechado; achados reabrem tarefas; não publicar automaticamente. ML opcional não é pré-condição.",
        ),
        (
            "ML-REL-01",
            tuple(f"{i}-E" for i, m in MODULES.items() if m["track"] == "appendix"),
            "Integração apêndice ML",
            "Conferir 48 blocos, cada cenário ML, splits/fixtures, treino/validação e serving/rollback. Evidência própria; sem alterar prontidão principal.",
        ),
        (
            "ML-REL-02",
            ("ML-REL-01",),
            "Revisão apêndice ML",
            "Revisão independente de didática, fontes, código e transferência do projeto pequeno; certificar apêndice separadamente, sem bloquear aluno do principal.",
        ),
    ]
    for identifier, deps, title, accept in release:
        appendix = identifier.startswith("ML-")
        tasks.append(
            Task(
                identifier,
                "terminal-review" if identifier == "REL-06" else "release",
                "GPT-6-Luna-high",
                deps,
                title,
                READINGS + ("docs/MATRIZ-RASTREABILIDADE.md",),
                (
                    "docs/STATUS-IMPLEMENTACAO-CURSO.md",
                    "docs/MATRIZ-RASTREABILIDADE.md",
                ),
                (
                    accept,
                    "Usar evidência atual e aprovação do orquestrador; planejamento não prova execução.",
                ),
                ("python3 tools/validate_backlog.py", "python3 tools/check_course.py"),
                not appendix,
                "appendix" if appendix else "core",
                (
                    "Ler evidências dos predecessores; confirmar revisão e resultado, não mera existência.",
                    accept,
                    "Registrar parecer, falhas e limitações; preservar PROGRESSO.md.",
                ),
                title,
                COMMON_LIMITS,
                (),
                f"docs/planejamento-v4/evidencias/{identifier}.md",
            )
        )
    return tasks


def html_excerpt(content: str, task_id: str) -> str:
    """Keep block packets focal; module reviews intentionally retain the whole HTML."""
    block = re.search(r"-B(\d{2})-([CLD])$", task_id)
    if not block:
        return content
    headings = list(
        re.finditer(r"<h2\b[^>]*>(.*?)</h2>", content, re.DOTALL | re.IGNORECASE)
    )
    selected: list[str] = []
    found_block = False
    for position, heading in enumerate(headings):
        title = re.sub(r"<[^>]+>", "", heading[1]).lower()
        is_block = bool(re.search(rf"\bbloco\s+0*{int(block[1])}\b", title))
        found_block |= is_block
        supporting = (block[2] == "L" and "laboratório" in title) or (
            block[2] == "D"
            and any(term in title for term in ("diagnóstico", "checkpoint"))
        )
        if is_block or supporting:
            stop = (
                headings[position + 1].start()
                if position + 1 < len(headings)
                else len(content)
            )
            line = content.count("\n", 0, heading.start()) + 1
            selected.append(
                f"<!-- Recorte do arquivo original a partir da linha {line}. -->\n"
                + content[heading.start() : stop]
            )
    if not found_block:
        return content
    return (
        "<!-- Recorte focal; estrutura/CSS e outros blocos não incluídos. Preservar o arquivo original. -->\n"
        + "\n".join(selected)
    )


def prompt(task: Task, bundle: bool = False) -> str:
    lines = [
        f"# Tarefa {task.id} — {task.topic}",
        "",
        "Execute este cartão com escopo focal. No modo contínuo, avance somente conforme o protocolo do backlog e dependências revisadas.",
        f"Trilha: {task.track}. Executor: {task.owner}. Dependências: {', '.join(task.depends_on) or 'nenhuma'}.",
        "Dependências são aceites revisados, não arquivos existentes. Consulte o STATUS antes de iniciar.",
        "",
        "## Contexto e briefing",
        task.context,
        "",
        "## Leituras obrigatórias",
        *["- " + p for p in task.inputs],
        "",
        "## Write set autorizado",
        *["- " + p for p in task.outputs],
        "Pode também criar o relatório de evidência indicado abaixo. Fora disso, registrar necessidade antes de ampliar escopo.",
        "",
        "## Passos",
        *[f"{i}. {s}" for i, s in enumerate(task.steps, 1)],
        "",
        "## Critérios de aceite",
        *["- " + a for a in task.acceptance],
        "",
        f"## Verificação (cwd padrão: {task.cwd})",
        *["- " + c for c in task.commands],
        "",
        "## Fontes iniciais (consulta ainda necessária)",
        *["- " + s for s in task.sources],
        "",
        "## Limites",
        *["- " + s for s in task.limits],
        "",
        "## Entrega",
        f"Relatório em `{task.evidence}`: estado AGUARDA_REVISAO/BLOQUEADO, arquivos, ATs, comandos/cwd, ambiente, saída real, resultado e limites; rubrica da spec geral. Não promover gate.",
        "Automação exclusiva GPT-6 Luna high, inclusive revisão terminal. Registrar configuração do agendador como origem, sem inventar introspecção do modelo. Revisar em execução distinta da autoria. Bloqueio real fica registrado; avançar somente em trabalho independente elegível. Não compactar teoria para economizar esforço.",
    ]
    if bundle:
        lines += [
            "",
            "## Leituras incorporadas — snapshot do repositório atual",
            "Arquivos ausentes são saídas planejadas ou bloqueios, nunca autorização para inventar histórico.",
        ]
        for relative in dict.fromkeys(task.inputs):
            p = ROOT / relative
            if p.is_file():
                content = p.read_text(encoding="utf-8")
                if p.suffix == ".html":
                    content = html_excerpt(content, task.id)
                lines += [
                    "",
                    f"### Documento: {relative}",
                    "",
                    content,
                ]
            else:
                lines += [
                    "",
                    f"### {relative}: "
                    + (
                        "diretório; inspecionar somente arquivos do write set"
                        if p.is_dir()
                        else "ainda inexistente; criar apenas se autorizado pelo cartão"
                    ),
                ]
    return "\n".join(lines) + "\n"


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--task")
    p.add_argument("--json", action="store_true")
    p.add_argument("--prompt", action="store_true")
    p.add_argument("--bundle", action="store_true")
    p.add_argument("--track", choices=("core", "appendix"))
    args = p.parse_args()
    tasks = build_tasks()
    if (args.prompt or args.bundle) and not args.task:
        p.error("--prompt/--bundle requires --task")
    if args.task:
        task = next((t for t in tasks if t.id == args.task), None)
        if task is None:
            p.error("unknown task: " + args.task)
        print(
            prompt(task, args.bundle)
            if args.prompt or args.bundle
            else json.dumps(asdict(task), ensure_ascii=False, indent=2)
        )
    elif args.json:
        print(
            json.dumps(
                [asdict(t) for t in tasks if not args.track or t.track == args.track],
                ensure_ascii=False,
                indent=2,
            )
        )
    else:
        selected = [t for t in tasks if not args.track or t.track == args.track]
        print(
            f"{len(selected)} tasks; 19 core units / 152 blocks; 7 optional ML units / 48 blocks. Use --task ID --prompt or --bundle."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
