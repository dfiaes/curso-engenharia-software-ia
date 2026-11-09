/* M06 · Bloco 4: prompt é código (versionamento, registry e experimento). Fonte: M06.html#b04. A matriz do bloco é exemplo ilustrativo da fonte, não medição; a saída do rode do registry vem de execução real em CPython. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var PY_b04a = {
  codigo: [
    "import re",
    "",
    "",
    "def parse_prompt(texto):",
    "    \"\"\"Separa o front matter (entre os dois '---') do corpo. Sem front matter: ValueError.\"\"\"",
    "    return {}, texto",
    "",
    "",
    "def carregar(arquivos, id_prompt, versao=None):",
    "    \"\"\"arquivos: {'analista/v3.md': texto}. versao=None escolhe a MAIOR versão numérica.",
    "    Devolve dict com id, versao, texto, modelo_alvo (padrão 'raciocinio'), temperatura (padrão 0.0) e tag 'id@vN'.",
    "    Versão inexistente: KeyError.\"\"\"",
    "    return {}",
    "",
    "",
    "ARQ = {\"analista/v3.md\": \"---\\nid: analista\\nversao: 3\\n---\\nTexto\"}",
    "print(carregar(ARQ, \"analista\"))"
  ].join("\n"),
  testes: [
    "def arq(v, modelo=None, temp=None):",
    "    fm = f\"---\\nid: analista\\nversao: {v}\\n\"",
    "    if modelo:",
    "        fm += f\"modelo_alvo: {modelo}\\n\"",
    "    if temp is not None:",
    "        fm += f\"temperatura: {temp}\\n\"",
    "    return fm + f\"---\\ntexto da v{v}\\n\"",
    "",
    "",
    "ARQ = {\"analista/v1.md\": arq(1), \"analista/v3.md\": arq(3, \"rapido\", 0.2), \"analista/v10.md\": arq(10)}",
    "",
    "",
    "def test_tag_e_metadados():",
    "    p = carregar(ARQ, \"analista\", 3)",
    "    assert p[\"tag\"] == \"analista@v3\" and p[\"modelo_alvo\"] == \"rapido\" and p[\"temperatura\"] == 0.2",
    "    assert p[\"texto\"] == \"texto da v3\"",
    "",
    "",
    "def test_padroes_quando_o_front_matter_omite():",
    "    p = carregar(ARQ, \"analista\", 1)",
    "    assert p[\"modelo_alvo\"] == \"raciocinio\" and p[\"temperatura\"] == 0.0",
    "",
    "",
    "def test_maior_versao_e_numerica_nao_alfabetica():",
    "    assert carregar(ARQ, \"analista\")[\"versao\"] == 10",
    "",
    "",
    "def test_versao_inexistente_e_front_matter_ausente():",
    "    try:",
    "        carregar(ARQ, \"analista\", 2)",
    "    except KeyError:",
    "        pass",
    "    else:",
    "        assert False, \"v2 não existe: KeyError\"",
    "    try:",
    "        parse_prompt(\"sem front matter\")",
    "    except ValueError:",
    "        return",
    "    assert False, \"sem front matter: ValueError\""
  ].join("\n"),
  solucao: [
    "import re",
    "",
    "",
    "def parse_prompt(texto):",
    "    partes = texto.split(\"---\", 2)",
    "    if len(partes) < 3:",
    "        raise ValueError(\"front matter ausente\")",
    "    meta = dict(re.findall(r\"^(\\w+):\\s*(.+)$\", partes[1], flags=re.MULTILINE))",
    "    return meta, partes[2].strip()",
    "",
    "",
    "def carregar(arquivos, id_prompt, versao=None):",
    "    versoes = [int(m.group(1)) for k in arquivos if (m := re.fullmatch(rf\"{re.escape(id_prompt)}/v(\\d+)\\.md\", k))]",
    "    if versao is None:",
    "        if not versoes:",
    "            raise KeyError(id_prompt)",
    "        versao = max(versoes)",
    "    if versao not in versoes:",
    "        raise KeyError(f\"{id_prompt}@v{versao}\")",
    "    meta, corpo = parse_prompt(arquivos[f\"{id_prompt}/v{versao}.md\"])",
    "    return {",
    "        \"id\": id_prompt,",
    "        \"versao\": versao,",
    "        \"texto\": corpo,",
    "        \"modelo_alvo\": meta.get(\"modelo_alvo\", \"raciocinio\"),",
    "        \"temperatura\": float(meta.get(\"temperatura\", 0)),",
    "        \"tag\": f\"{id_prompt}@v{versao}\",",
    "    }"
  ].join("\n")
  };
  var PY_b04b = {
  codigo: [
    "def comparar(base, nova, tolerancia=0):",
    "    \"\"\"base e nova: {categoria: pontos}. Para cada categoria da base devolve 'melhora', 'igual' ou 'piora'.",
    "    Diferença dentro de ±tolerancia (em pontos) conta como 'igual'.\"\"\"",
    "    return {}",
    "",
    "",
    "def regressoes(resultado):",
    "    \"\"\"Lista ordenada das categorias que pioraram.\"\"\"",
    "    return []",
    "",
    "",
    "v2 = {\"golden\": 88, \"escopo\": 70, \"injection\": 80, \"borda\": 75}",
    "v3 = {\"golden\": 91, \"escopo\": 95, \"injection\": 80, \"borda\": 79}",
    "print(comparar(v2, v3))"
  ].join("\n"),
  testes: [
    "V2 = {\"golden\": 88, \"escopo\": 70, \"injection\": 80, \"borda\": 75}",
    "V3 = {\"golden\": 91, \"escopo\": 95, \"injection\": 80, \"borda\": 79}",
    "",
    "",
    "def test_matriz_do_bloco():",
    "    r = comparar(V2, V3)",
    "    assert r == {\"golden\": \"melhora\", \"escopo\": \"melhora\", \"injection\": \"igual\", \"borda\": \"melhora\"}",
    "    assert regressoes(r) == []",
    "",
    "",
    "def test_melhora_com_piora_em_outra_categoria_e_regressao():",
    "    r = comparar(V2, {\"golden\": 95, \"escopo\": 70, \"injection\": 60, \"borda\": 75})",
    "    assert r[\"golden\"] == \"melhora\" and r[\"injection\"] == \"piora\"",
    "    assert regressoes(r) == [\"injection\"]",
    "",
    "",
    "def test_tolerancia_absorve_ruido_pequeno():",
    "    r = comparar(V2, {\"golden\": 86, \"escopo\": 71, \"injection\": 80, \"borda\": 78}, tolerancia=3)",
    "    assert set(r.values()) == {\"igual\"}",
    "    assert comparar(V2, {\"golden\": 84, \"escopo\": 70, \"injection\": 80, \"borda\": 75}, tolerancia=3)[\"golden\"] == \"piora\"",
    "",
    "",
    "def test_categoria_ausente_falha_alto():",
    "    try:",
    "        comparar(V2, {\"golden\": 90})",
    "    except KeyError:",
    "        return",
    "    assert False, \"categoria ausente precisa levantar KeyError\""
  ].join("\n"),
  solucao: [
    "def comparar(base, nova, tolerancia=0):",
    "    saida = {}",
    "    for cat, antes in base.items():",
    "        if cat not in nova:",
    "            raise KeyError(f\"categoria ausente na nova: {cat}\")",
    "        d = nova[cat] - antes",
    "        saida[cat] = \"melhora\" if d > tolerancia else \"piora\" if d < -tolerancia else \"igual\"",
    "    return saida",
    "",
    "",
    "def regressoes(resultado):",
    "    return sorted(cat for cat, v in resultado.items() if v == \"piora\")"
  ].join("\n")
  };

  var etapasRegistry = function () {
    return [
      { id: 'arquivos', nome: 'Os arquivos', descricao: 'v1, v3 e v10 do analista', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python registry_demo.py'),
        L('info', 'prompts/analista/v1.md, v3.md e v10.md, cada um com front matter'),
        L('hint', 'v10 existe: repare no que "a maior versão" significa para texto e para número')] },
      { id: 'v3', nome: 'Versão explícita', descricao: 'carregar("analista", 3)', tom: 'tcp', ms: 1, linhas: [
        L('out', 'analista@v3 raciocinio 0.0'),
        L('hint', 'a tag id@vN vai em todo log, trace e resultado de eval')] },
      { id: 'ativa', nome: 'Versão ativa', descricao: 'carregar("analista")', tom: 'tls', ms: 1, linhas: [
        L('out', 'analista@v10 rapido 0.0'),
        L('hint', 'None escolheu a maior versão numérica: 10, não 3')] },
      { id: 'armadilha', nome: 'A armadilha', descricao: 'ordenar os nomes como texto', tom: 'request', ms: 1, linhas: [
        L('cmd', 'max(ARQ)'),
        L('out', 'analista/v3.md'),
        L('hint', 'como texto, "v3" vem depois de "v10": o registry converte para inteiro antes de comparar')] }
    ];
  };

  var codigoRegistry = [
    '# src/app/services/llm/prompts.py',
    '"""Registry: carrega prompt por id + versão, com cache e metadados."""',
    'from __future__ import annotations',
    'import re',
    'from dataclasses import dataclass',
    'from functools import lru_cache',
    'from pathlib import Path',
    '',
    'RAIZ = Path(__file__).parent / "prompts"',
    '',
    '@dataclass(frozen=True, slots=True)',
    'class Prompt:',
    '    id: str',
    '    versao: int',
    '    texto: str',
    '    modelo_alvo: str',
    '    temperatura: float',
    '',
    '    @property',
    '    def tag(self) -> str:',
    '        """Vai em todo log, trace e resultado de eval. Sem isso nada é comparável."""',
    '        return f"{self.id}@v{self.versao}"',
    '',
    '@lru_cache(maxsize=32)',
    'def carregar(id_prompt: str, versao: int | None = None) -> Prompt:',
    '    pasta = RAIZ / id_prompt',
    '    if versao is None:                                   # None = a maior versão',
    '        versoes = [int(p.stem[1:]) for p in pasta.glob("v*.md")]',
    '        versao = max(versoes)',
    '    bruto = (pasta / f"v{versao}.md").read_text(encoding="utf-8")',
    '    _, frente, corpo = bruto.split("---", 2)',
    '    meta = dict(',
    '        re.findall(r"^(\\w+):\\s*(.+)$", frente, flags=re.MULTILINE)',
    '    )',
    '    return Prompt(',
    '        id=id_prompt,',
    '        versao=versao,',
    '        texto=corpo.strip(),',
    '        modelo_alvo=meta.get("modelo_alvo", "raciocinio"),',
    '        temperatura=float(meta.get("temperatura", 0)),',
    '    )'].join('\n');

  var codigoExperimento = [
    '# evals/experimento.py',
    '"""Roda a suíte para cada combinação (prompt, alias) e emite a matriz."""',
    'from __future__ import annotations',
    'import asyncio',
    'import itertools',
    'from pathlib import Path',
    '',
    'from evals.runner import rodar_suite',
    'from app.services.llm.prompts import carregar',
    '',
    'PROMPTS = [carregar("analista", v) for v in (2, 3)]',
    'ALIASES = ["rapido", "raciocinio"]',
    '',
    'async def main() -> None:',
    '    linhas: list[dict[str, object]] = []',
    '    for prompt, alias in itertools.product(PROMPTS, ALIASES):',
    '        resultados = await rodar_suite(',
    '            Path("evals/datasets"), prompt=prompt, alias=alias',
    '        )',
    '        por_cat: dict[str, list[bool]] = {}',
    '        for r in resultados:',
    '            por_cat.setdefault(r.caso.categoria, []).append(r.passou)',
    '        linhas.append(',
    '            {',
    '                "config": f"{prompt.tag} @ {alias}",',
    '                **{cat: f"{100 * sum(v) / len(v):.0f}%" for cat, v in sorted(por_cat.items())},',
    '                "custo_total": f"${sum(r.custo_usd for r in resultados):.4f}",',
    '                "p95_ms": sorted(r.latencia_ms for r in resultados)[int(0.95 * len(resultados))],',
    '            }',
    '        )',
    '    cabecalho = list(linhas[0].keys())',
    '    print(" | ".join(cabecalho))',
    '    for linha in linhas:',
    '        print(" | ".join(str(linha[c]) for c in cabecalho))',
    '',
    'if __name__ == "__main__":',
    '    asyncio.run(main())'].join('\n');

  TrilhaAula.registrar({
    id: 'm06-b4',
    titulo: 'Prompt é código: versionamento, registry e experimento',
    minutos: 40,
    resumo: 'Sem versionar o prompt você não responde qual versão estava no ar, o que mudou nem se melhorou. Registry imutável com versão ativa por configuração, tag em todo resultado e experimento de uma variável por vez.',
    objetivo: 'Montar um registry de prompts com versões imutáveis e metadados, e ler uma matriz de prompt por modelo sem confundir ruído com efeito.',
    revisao: [
      { id: 'm06b4-tres', pergunta: 'Que três perguntas o versionamento de prompt permite responder?',
        opcoes: [
          opc('a', 'Qual versão estava no ar quando o cliente reclamou; o que mudou entre a v14 e a v15; e se a v15 é melhor de fato ou só parece', true, 'prompt em string literal é como SQL concatenado no controller: funciona até a hora de auditar.'),
          opc('b', 'Quanto custa cada token, qual o limite de contexto e qual a latência', false, 'são perguntas de custo e capacidade, não de rastreabilidade.'),
          opc('c', 'Quem escreveu o prompt, quando e em qual editor', false, 'autoria sem versão, baseline e resultado não permite comparar nada.')] },
      { id: 'm06b4-imutavel', pergunta: 'A v3 do prompt está em produção e você encontra uma melhoria. O que fazer?',
        opcoes: [
          opc('a', 'Criar a v4: editar a v3 faria traces, evals e reclamações que apontam para "v3" passarem a apontar para outra coisa', true, 'mesmo correção de digitação merece versão nova: o custo é um arquivo.'),
          opc('b', 'Editar a v3 diretamente', false, 'mata a série histórica.'),
          opc('c', 'Renomear a v3 para v3-final', false, 'quebra as referências à tag sem criar uma versão nova.')] },
      { id: 'm06b4-migration', pergunta: 'Qual é a analogia que organiza o registry de prompts?',
        opcoes: [
          opc('a', 'Como migration (arquivo versionado, numerado, imutável depois de aplicado) e como feature flag (versão ativa é configuração)', true, 'promover ou reverter sem deploy.'),
          opc('b', 'Como variável de ambiente que cada dev edita localmente', false, 'não há histórico nem auditoria.'),
          opc('c', 'Como cache que se invalida a cada chamada', false, 'cache não é versionamento.')] },
      { id: 'm06b4-variavel', pergunta: 'Quais são as três disciplinas do experimento controlado?',
        opcoes: [
          opc('a', 'Uma variável por rodada, baseline registrada em disco e custo como variável de resultado', true, 'mudar prompt, modelo e temperatura juntos e declarar vitória produz superstição, não conhecimento.'),
          opc('b', 'Mudar tudo de uma vez para ganhar tempo, comparar com a memória e ignorar custo', false, 'é o oposto de cada uma das três.'),
          opc('c', 'Rodar uma vez e escolher o mais barato', false, 'não há baseline nem leitura de incerteza.')] },
      { id: 'm06b4-matriz', pergunta: 'Na matriz, a v3 subiu fora de escopo de 45 para 85 e o modelo rápido custa cerca de 4× menos com 17 pontos a menos no golden path. Qual é a leitura madura?',
        opcoes: [
          opc('a', 'Hipótese de abstenção confirmada, injection inalterada, possível roteamento por tipo de arquivo, e diferenças de 2 a 3 pontos podem ser inconclusivas com poucos casos', true, 'melhora com piora em outra categoria seria regressão comportamental ao vivo.'),
          opc('b', 'A v3 é melhor em tudo e o rápido é inútil', false, 'injection não mudou e o rápido tem custo muito menor.'),
          opc('c', 'Escolher sempre o mais barato', false, 'qualidade sem custo é meia resposta, e custo sem qualidade também.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O fator 2 do 12-Factor Agents (M01, bloco 3) diz "own your prompts". Este bloco é a implementação. Sem versionamento você não responde três perguntas que vão aparecer: <em>qual versão estava no ar quando o cliente reclamou? o que exatamente mudou entre a v14 e a v15? a v15 é melhor mesmo, ou só parece?</em></p>' +
          '<h3>Prompt como migration e como flag</h3>' +
          '<p>Trate prompt como <strong>script de migration</strong>: arquivo versionado, numerado, imutável depois de aplicado, com histórico navegável. E como <strong>feature flag</strong>: a versão ativa é configuração, não código, então dá para promover ou reverter sem deploy. A combinação das duas ideias é o registry deste bloco, pela mesma razão que consulta crítica não nasce de string interpolada.</p>' },
        { tipo: 'abas', rotulo: 'Sem registry × com registry', itens: [
          { rotulo: 'Sem registry', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: 'def analisar(codigo):\n    prompt = f"Você é um analista... {codigo}"\n    return chamar(prompt)' },
            { tipo: 'texto', html: '<p>Como SQL concatenado no controller: funciona até a hora de auditar. Quem sabe qual versão estava no ar quando o cliente reclamou? O que mudou entre a v14 e a v15?</p>' }] },
          { rotulo: 'Com registry', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto: [
              'prompts/',
              '├── analista/',
              '│   ├── v1.md          # imutável depois de usado em produção',
              '│   ├── v2.md',
              '│   ├── v3.md          # ativa',
              '│   └── CHANGELOG.md   # o que mudou e POR QUÊ, com o número do eval',
              '└── juiz-justificativa/',
              '    ├── v1.md',
              '    └── v2.md'].join('\n') },
            { tipo: 'texto', html: '<p>Migration (versionado, imutável) e feature flag (a versão ativa é configuração): promover ou reverter sem deploy.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<p>Cada arquivo tem <strong>front matter</strong> com os metadados que tornam o resultado comparável.</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto: [
          '---',
          'id: analista',
          'versao: 3',
          'criado_em: 2026-08-14',
          'modelo_alvo: raciocinio          # alias do gateway (M05 b6), não nome de modelo',
          'temperatura: 0',
          'baseado_em: v2',
          'mudanca: "Adiciona instrução de abstenção explícita para arquivos sem lógica"',
          'eval_baseline: evals/resultados/2026-08-14-v3.json',
          '---',
          'You are a senior software archaeologist analyzing legacy code...'].join('\n') },
        { tipo: 'callout', tom: 'danger', titulo: 'A regra da imutabilidade e a exceção', html:
          '<p>Prompt já usado em produção <strong>não se edita</strong>: cria-se a versão seguinte. Se você edita a v3, todos os resultados de eval, traces e reclamações de cliente que apontam para "v3" passam a apontar para outra coisa, e a série histórica morre (a mesma razão do ADR, M04 bloco 3). A exceção honesta é a correção de digitação que não muda semântica, e mesmo aí prefira criar a versão nova: o custo é um arquivo.</p>' },
        { tipo: 'takeaway', html: 'Prompt é <mark>migration</mark> e <mark>flag</mark>: versões <mark>imutáveis</mark>, ativa por configuração.' }
      ] },

      { rotulo: 'Registry em ação', blocos: [
        { tipo: 'texto', html:
          '<p>O registry carrega um prompt por id e versão, com cache e metadados. A <code>tag</code> (<code>analista@v3</code>) vai em todo log, trace e resultado de eval: sem ela nada é comparável.</p>' },
        { tipo: 'abas', rotulo: 'Código do registry', itens: [
          { rotulo: 'prompts.py', blocos: [{ tipo: 'codigo', linguagem: 'python', texto: codigoRegistry }] },
          { rotulo: 'O que observar', blocos: [{ tipo: 'texto', html:
            '<ul><li>Dataclass <code>frozen</code>: o prompt carregado não muda em memória.</li>' +
            '<li><code>versao=None</code> escolhe a maior versão <em>numérica</em>, convertendo o nome do arquivo para inteiro.</li>' +
            '<li><code>modelo_alvo</code> é um alias do gateway (M05, bloco 6), não um nome de modelo.</li>' +
            '<li>Temperatura e modelo-alvo ficam no front matter: o resultado do eval carrega a configuração junto.</li></ul>' }] }
        ] },
        { tipo: 'rode', id: 'b4-rode', titulo: 'Qual é a maior versão?', enunciado: 'Saída real de um script em CPython que reproduz o registry com três arquivos em memória.',
          prefixo: '$', entrada: 'python registry_demo.py', unidade: 's', terminalTitulo: 'registry_demo.py', etapas: etapasRegistry(),
          prever: { pergunta: 'Existem v1, v3 e v10. O que <code>carregar("analista")</code>, sem versão, devolve?', opcoes: [
            { id: 'a', texto: 'A v3: "v3" é maior que "v10" quando comparados como texto.', correta: false, porque: 'esse é o erro: o registry compara inteiros, não nomes.' },
            { id: 'b', texto: 'A v10: o registry converte o número da versão para inteiro antes do <code>max</code>.', correta: true, porque: 'ordenar nomes de arquivo como texto elege a v3 e promove a versão errada em silêncio.' },
            { id: 'c', texto: 'A v1, a primeira criada.', correta: false, porque: 'None significa a maior versão, não a primeira.' }
          ] },
          tutorAntes: 'Aperte Enter e leia as quatro etapas.',
          tutorDepois: 'O máximo como texto (<code>analista/v3.md</code>) é o bug clássico: a versão ativa passaria a ser a errada sem nenhum erro.',
          callout: 'Você viu o registry escolher a versão certa e a armadilha de ordenar como texto.' },
        { tipo: 'texto', html:
          '<h3>O experimento: matriz de prompt por modelo</h3>' +
          '<p>Com registry e runner, comparar fica mecânico. Você quer uma matriz com <strong>acurácia por categoria, custo e latência</strong> lado a lado, porque a decisão nunca é só qualidade.</p>' },
        { tipo: 'abas', rotulo: 'A matriz', itens: [
          { rotulo: 'Código', blocos: [{ tipo: 'codigo', linguagem: 'python', texto: codigoExperimento }] },
          { rotulo: 'Saída do exemplo', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto: [
              'config                    | 01_golden | 02_fora_escopo | 03_injection | 06_bordas | custo_total | p95_ms',
              'analista@v2 @ rapido      |  72%      |      45%       |     60%      |    58%    |  $0.0210    |  1840',
              'analista@v2 @ raciocinio  |  88%      |      70%       |     80%      |    75%    |  $0.0890    |  3120',
              'analista@v3 @ rapido      |  74%      |      85%       |     60%      |    62%    |  $0.0215    |  1910',
              'analista@v3 @ raciocinio  |  91%      |      95%       |     80%      |    79%    |  $0.0910    |  3260'].join('\n') },
            { tipo: 'texto', html: '<p>É a tabela que o checkpoint pede que você apresente a um gestor não técnico. Os números são o exemplo ilustrativo do bloco, não uma medição reproduzível neste curso.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'A <mark>tag</mark> em todo resultado e a versão <mark>numérica</mark> mais alta fazem o registry <mark>rastreável</mark>.' }
      ] },

      { rotulo: 'Ler a matriz', blocos: [
        { tipo: 'texto', html:
          '<h3>Como se lê uma matriz dessas</h3>' +
          '<p>Este é o raciocínio esperado de um sênior.</p>' },
        { tipo: 'abas', rotulo: 'Leitura da matriz', itens: [
          { rotulo: 'Hipótese confirmada', blocos: [{ tipo: 'texto', html:
            '<p>A v3 melhorou muito <strong>fora de escopo</strong> (45 para 85 e 70 para 95). Era exatamente a mudança pretendida (abstenção): confirmado.</p>' }] },
          { rotulo: 'O que não mexeu', blocos: [{ tipo: 'texto', html:
            '<p>A v3 <strong>não</strong> mexeu em injection (60 e 80 nos dois): a defesa continua fraca e é o próximo trabalho. Agora você <em>sabe</em>, em vez de supor.</p>' }] },
          { rotulo: 'Custo e roteamento', blocos: [{ tipo: 'texto', html:
            '<p>O modelo rápido custa cerca de 4 vezes menos e é 1,7 vez mais veloz, com 17 pontos a menos no golden path. Decisão possível: <strong>rotear por tipo de arquivo</strong> (triviais no rápido, com lógica no de raciocínio) e medir de novo.</p>' }] },
          { rotulo: 'O que a tabela não diz', blocos: [{ tipo: 'texto', html:
            '<p>Se as diferenças de 2 a 3 pontos são estáveis ou relevantes. Com 15 casos por categoria a estimativa é incerta; sem contagens exatas, desenho e critério prévio, não conclua diferença nem equivalência. Compare versões sobre os mesmos casos e reporte <strong>inconclusivo</strong> se os dados não resolverem a decisão (bloco 1).</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Experimento controlado: mude uma variável por vez</h3>' +
          '<p>Parece óbvio e é violado o tempo todo: mudar prompt <em>e</em> modelo <em>e</em> temperatura na mesma iteração e concluir que "ficou melhor" não produz conhecimento, produz superstição.</p>' +
          '<ul><li><strong>Uma variável por rodada.</strong> A matriz isola: as linhas variam o prompt, as colunas variam o modelo.</li>' +
          '<li><strong>Baseline registrada.</strong> Todo experimento compara contra um resultado salvo em disco, com data e configuração. "Melhorou" sem baseline é opinião.</li>' +
          '<li><strong>Custo é variável de resultado.</strong> Qualidade sem custo é meia resposta; em IA a diferença de custo entre duas configurações equivalentes chega a 5 vezes (M05).</li></ul>' +
          '<p>É o método científico básico aplicado a engenharia, e a mesma disciplina do teste de performance: não se muda a query e o índice ao mesmo tempo e se declara vitória.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O percurso no laboratório', html:
          '<p>Extrair o prompt para o registry (refatoração honesta: mesma taxa, tag aparecendo); escrever a v2 com <strong>hipótese prévia</strong> ("espero subir X sem perder Y"); imprimir e salvar a tabela e comparar com a hipótese (melhora com piora em outra categoria é <strong>regressão comportamental ao vivo</strong>); e promover por configuração com <code>CHANGELOG</code> numerado (trade-off com custo vira ADR). O roteiro executável está no Laboratório guiado do módulo, depois do bloco 6; a matriz 2×2 contra provedores reais é trilha opcional, com conta e crédito.</p>' },
        { tipo: 'takeaway', html: '<mark>Uma variável</mark> por rodada, <mark>baseline</mark> em disco e <mark>custo</mark> na tabela; hipótese escrita <mark>antes</mark> do resultado.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'complete', id: 'b4-complete-front', titulo: 'Monte o front matter da v3', linguagem: 'yaml',
          enunciado: 'Escolha, em cada lacuna, o valor que torna o resultado de eval comparável e rastreável.',
          partes: [
            '---\nid: analista\nversao: 3\nmodelo_alvo: ', { lacuna: 'modelo', opcoes: ['raciocinio', 'um nome de modelo com data', 'o melhor disponível'], correta: 'raciocinio' },
            '\ntemperatura: 0\nbaseado_em: ', { lacuna: 'base', opcoes: ['v2', 'main', 'v4'], correta: 'v2' },
            '\nmudanca: "', { lacuna: 'mud', opcoes: ['Adiciona instrução de abstenção explícita para arquivos sem lógica', 'Melhorias gerais', 'Ajustes'], correta: 'Adiciona instrução de abstenção explícita para arquivos sem lógica' },
            '"\neval_baseline: ', { lacuna: 'base2', opcoes: ['evals/resultados/2026-08-14-v3.json', 'ver conversa do time', 'nenhum, ficou bom'], correta: 'evals/resultados/2026-08-14-v3.json' },
            '\n---\n'
          ],
          explicacao: 'O <code>modelo_alvo</code> é um alias do gateway, não um nome de modelo, para que a troca de modelo seja configuração. <code>baseado_em</code> liga a v3 à v2 que ela deriva; a <code>mudanca</code> diz o que e por quê; e <code>eval_baseline</code> aponta o resultado salvo em disco contra o qual a v3 foi comparada.',
          callout: 'Front matter montado: alias, origem, mudança e baseline rastreáveis.' },
        { tipo: 'python', id: 'b4-python-registry', titulo: 'Escreva o registry', obrigatorio: false,
          enunciado: 'Implemente <code>parse_prompt(texto)</code> (front matter entre os dois <code>---</code>; sem front matter levanta <code>ValueError</code>) e <code>carregar(arquivos, id_prompt, versao=None)</code> sobre um dicionário <code>{"analista/v3.md": texto}</code>: maior versão <em>numérica</em> quando <code>versao</code> é <code>None</code>, padrões <code>raciocinio</code> e <code>0.0</code>, <code>tag</code> <code>id@vN</code> e <code>KeyError</code> para versão inexistente.',
          codigo: PY_b04a.codigo, testes: PY_b04a.testes,
          dica: 'Extraia as versões com <code>re.fullmatch(rf"{id_prompt}/v(\\d+)\\.md", nome)</code> e converta para <code>int</code> antes do <code>max</code>. O front matter sai de <code>texto.split("---", 2)</code>; cada linha <code>chave: valor</code> casa com <code>re.findall(r"^(\\w+):\\s*(.+)$", frente, re.MULTILINE)</code>.',
          solucao: PY_b04a.solucao,
          tutorDepois: 'O teste da v10 é o que separa o registry correto do que ordena nomes como texto.',
          callout: 'O registry passou nos testes, com a versão numérica e as bordas tratadas.' },
        { tipo: 'python', id: 'b4-python-comparar', titulo: 'Compare duas versões por categoria', obrigatorio: false,
          enunciado: 'Implemente <code>comparar(base, nova, tolerancia=0)</code>, que devolve <code>melhora</code>, <code>igual</code> ou <code>piora</code> por categoria (diferença dentro de ±tolerância conta como <code>igual</code>; categoria ausente na nova levanta <code>KeyError</code>), e <code>regressoes(resultado)</code>, a lista ordenada das categorias que pioraram.',
          codigo: PY_b04b.codigo, testes: PY_b04b.testes,
          dica: 'Calcule <code>d = nova[cat] - antes</code>: <code>melhora</code> se <code>d &gt; tolerancia</code>, <code>piora</code> se <code>d &lt; -tolerancia</code>, senão <code>igual</code>. Uma média global não entra aqui: a comparação é categoria a categoria.',
          solucao: PY_b04b.solucao,
          tutorDepois: 'Melhora em uma categoria com piora em outra aparece em <code>regressoes</code>: é a regressão comportamental que a média esconderia. A tolerância não substitui a regra de decisão do bloco 1.',
          callout: 'A comparação por categoria aponta regressões que a média esconderia.' },
        { tipo: 'cenario', id: 'b4-cenario', titulo: 'A v3 está no ar e você achou uma melhoria', obrigatorio: false,
          enunciado: 'Um revisor aponta uma melhoria no texto da v3, que já está em produção. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A mudança parece pequena e segura. O que você faz?', opcoes: [
              { texto: 'Editar o arquivo v3.md: é rápido e só mexe numa frase.', vai: 'f-edit', tom: 'ruim', consequencia: 'traces, evals e reclamações que apontam para "v3" passam a apontar para outro texto; a série histórica morre.' },
              { texto: 'Criar a v4, com <code>baseado_em: v3</code> e a hipótese escrita no CHANGELOG antes de rodar.', vai: 'v4', tom: 'ok', consequencia: 'a v3 permanece comparável e a v4 nasce com hipótese.' }
            ] },
            v4: { texto: 'A matriz mostra a v4 melhor em fora de escopo e 4 pontos pior em injection. O que concluir?', opcoes: [
              { texto: 'Promover: a média global subiu.', vai: 'f-media', tom: 'ruim', consequencia: 'a média esconde a cauda; a defesa contra injection enfraqueceu sem ninguém ver.' },
              { texto: 'Tratar como regressão comportamental em injection, checar se 4 pontos são estáveis com os mesmos casos e decidir com o trade-off registrado (ADR se envolver custo).', vai: 'f-bom', tom: 'ok', consequencia: 'a decisão fica documentada e a regressão não passa em silêncio.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'A v3 ficou intacta, a v4 foi avaliada contra a baseline por categoria e a decisão sobre injection ficou registrada.' },
            'f-edit': { bom: false, texto: 'A v3 virou outra coisa; nenhuma comparação com ela é confiável e a auditoria perdeu o ponto de referência.' },
            'f-media': { bom: false, texto: 'A média subiu e a defesa contra injection piorou; a regressão só apareceu em produção.' }
          },
          callout: 'Você criou a versão nova e leu a matriz por categoria, sem se apoiar na média.' },
        { tipo: 'escreva', id: 'b4-escreva', titulo: 'A hipótese antes do resultado', obrigatorio: false,
          enunciado: 'Você vai criar a v2 do prompt do analista para reduzir achados em arquivos triviais. Escreva a hipótese que registraria no CHANGELOG antes de rodar a matriz.',
          placeholder: 'Espero que a v2 suba… sem piorar… porque…',
          rubrica: [
            'Diz <strong>qual categoria</strong> deve subir (por exemplo, fora de escopo) e o que a mudança de prompt faz para isso.',
            'Diz o que <strong>não pode piorar</strong> (golden path, injection) e que vai comparar por categoria, não pela média.',
            'Declara que a hipótese é escrita <strong>antes</strong> de ver o resultado e compara contra a baseline salva.'
          ],
          modelo: '<p>Espero que a v2 suba o acerto em <code>fora_escopo</code> sem reduzir golden path nem injection, porque a nova instrução de abstenção manda devolver <code>achados: []</code> em arquivos sem lógica. Vou rodar a matriz contra a baseline da v1 salva em disco, mudando só o prompt, e comparar categoria por categoria. Se golden path ou injection caírem, trato como regressão comportamental, mesmo que a média suba.</p>' },
        { tipo: 'escolha', id: 'b4-escolha-editar', titulo: 'Confira: editar a v3',
          pergunta: 'A v3 já está em produção e há uma melhoria. Qual é a conduta correta?',
          opcoes: [
            { id: 'a', texto: 'Editar a v3 diretamente.', correta: false, porque: 'o que apontava para "v3" passa a apontar para outra coisa.' },
            { id: 'b', texto: 'Criar a v4: prompt já usado não se edita, e a versão ativa é configuração, o que permite rollback sem deploy.', correta: true, porque: 'mesmo correção de digitação merece versão nova; o custo é um arquivo.' },
            { id: 'c', texto: 'Renomear a v3 para v3-final.', correta: false, porque: 'quebra as referências sem criar uma versão nova.' },
            { id: 'd', texto: 'Manter o prompt em string literal para facilitar.', correta: false, porque: 'impede auditar qual versão estava no ar.' }
          ], tutorDepois: 'Imutável depois de usado.' },
        { tipo: 'escolha', id: 'b4-escolha-matriz', titulo: 'Confira: a leitura da matriz',
          pergunta: 'A v3 subiu fora de escopo de 45 para 85 e o modelo rápido custa cerca de 4× menos, com 17 pontos a menos no golden path. Qual é a leitura madura?',
          opcoes: [
            { id: 'a', texto: 'A v3 é melhor em tudo e o rápido é inútil.', correta: false, porque: 'injection não mudou e o rápido custa muito menos.' },
            { id: 'b', texto: 'Trocar prompt, modelo e temperatura juntos e declarar vitória.', correta: false, porque: 'sem uma variável por vez não há conhecimento.' },
            { id: 'c', texto: 'Confirmar a hipótese de abstenção, reconhecer que injection não mudou, avaliar rotear por tipo de arquivo e lembrar que diferenças de 2 a 3 pontos com poucos casos podem ser inconclusivas.', correta: true, porque: 'hipótese escrita antes, baseline registrada e custo como variável de resultado.' },
            { id: 'd', texto: 'Escolher sempre o mais barato.', correta: false, porque: 'qualidade e custo se leem juntos.' }
          ], tutorDepois: 'Decisão com custo, qualidade e incerteza na mesma tabela.' },
        { tipo: 'takeaway', html: 'Prompt <mark>já usado não se edita</mark>; compare por <mark>categoria</mark>, com uma variável por vez e <mark>baseline</mark> salva.' }
      ] }
    ]
  });
})();
