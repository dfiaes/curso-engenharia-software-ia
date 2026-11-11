/* M13 · B1: Release contract, escopo e orçamento de evidência. Fonte: M13.html#h-b1. Exemplos rotulados como exemplo não vêm do laboratório. */
(function () {
  TrilhaAula.registrar({
 "id": "m13-b1",
 "titulo": "Release contract, escopo e orçamento de evidência",
 "minutos": 35,
 "resumo": "Congele claims, método de medição e orçamento antes de medir; meta só muda com edição datada e motivo.",
 "objetivo": "Explicar por que cada claim precisa de método antes do resultado e reconhecer relaxamento silencioso de meta.",
 "abas": [
  {
   "rotulo": "Entender",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<h3>Release começa antes do código</h3><p>Sem definir <strong>quem sofre o problema</strong>, <strong>o que será medido</strong> e <strong>quanto pode custar</strong>, qualquer número depois do teste vira publicidade: a flecha é desenhada onde caiu. O <strong>release contract</strong> é um documento congelado que transforma intenção em hipótese testável. O <strong>risk register</strong> transforma os \"e se\" em linhas com dono, severidade e estado.</p><p>O invariante é um só: <strong>nenhuma meta é relaxada em silêncio</strong>. Mudar a meta exige edição datada e motivo.</p>"
    },
    {
     "tipo": "texto",
     "html": "<h3>Decisão e trade-off</h3><p>Congelar cedo demais bloqueia aprendizado; congelar tarde demais deixa mover o alvo. A decisão do Cartógrafo: congelar persona, três jornadas, claims, orçamento e go/no-go no início de cada épico, e revisitar só com edição registrada. É o que as PRRs de SRE fazem em lançamentos (SRC-M13-11), sem peso institucional.</p><p>Artefatos do bloco: <code>lab/docs/release-contract.md</code> e <code>lab/docs/risk-register.md</code>. Depende de M01 (workflow de evidência) e M04 (design docs). Evidência em <code>evidence/m13/B01/</code>.</p>"
    },
    {
     "tipo": "takeaway",
     "html": "Uma claim sem <mark>método de medição</mark> antes do resultado é publicidade; meta só muda por <mark>edição datada e motivada</mark>."
    }
   ]
  },
  {
   "rotulo": "Ver funcionando",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<h3>A tabela de claims</h3><p>O contrato traz a tabela de claims (excerto verbatim):</p>"
    },
    {
     "tipo": "texto",
     "largo": true,
     "html": "<table><thead><tr><th>#</th><th>Claim planejada</th><th>Método de medição</th><th>Fonte da evidência</th></tr></thead><tbody><tr><td>C2</td><td>Ingestão não duplica snapshot em cancel/retry/crash</td><td>testes de idempotência + hash do snapshot</td><td>B03</td></tr><tr><td>C3</td><td>2 linguagens parseadas com 100% do corpus contratual</td><td>corpus dourado + divergências medidas</td><td>B04</td></tr></tbody></table>"
    },
    {
     "tipo": "rode",
     "id": "m13b1-rode",
     "titulo": "Rode o oráculo do contrato",
     "enunciado": "O oráculo automatizado garante que nenhuma claim fique sem método.",
     "prefixo": "$",
     "entrada": "uv run pytest tests/test_release_contract.py -v",
     "unidade": "ms",
     "terminalTitulo": "lab",
     "etapas": [
      {
       "id": "cd",
       "nome": "Pasta",
       "descricao": "Entrar no laboratório",
       "tom": "dns",
       "ms": 5,
       "linhas": [
        {
         "kind": "cmd",
         "text": "cd modulos/M13-capstone/lab"
        }
       ]
      },
      {
       "id": "py",
       "nome": "pytest",
       "descricao": "Três testes do contrato",
       "tom": "request",
       "ms": 30,
       "linhas": [
        {
         "kind": "cmd",
         "text": "uv run pytest tests/test_release_contract.py -v"
        },
        {
         "kind": "out",
         "text": "tests/test_release_contract.py::test_contract_has_frozen_sections PASSED"
        },
        {
         "kind": "out",
         "text": "tests/test_release_contract.py::test_every_claim_has_measurement_method PASSED"
        },
        {
         "kind": "out",
         "text": "tests/test_release_contract.py::test_risk_register_tracks_blockers_honestly PASSED"
        },
        {
         "kind": "hint",
         "text": "saída completa em evidence/m13/B01/pytest-release-contract.txt"
        }
       ]
      }
     ],
     "prever": {
      "pergunta": "Se alguém apagar a coluna de método da claim C3, qual teste do oráculo deve falhar?",
      "opcoes": [
       {
        "id": "a",
        "texto": "test_contract_has_frozen_sections",
        "correta": false,
        "porque": "esse confere as seções congeladas do documento, não cada claim."
       },
       {
        "id": "b",
        "texto": "test_every_claim_has_measurement_method",
        "correta": true,
        "porque": "é o teste que exige método em toda claim; o B1 falha até corrigir o doc."
       },
       {
        "id": "c",
        "texto": "test_risk_register_tracks_blockers_honestly",
        "correta": false,
        "porque": "esse cuida do register: risco real removido volta como BLOCKED."
       }
      ]
     },
     "tutorDepois": "O contrato é verificado por teste, não por boa vontade."
    },
    {
     "tipo": "takeaway",
     "html": "O contrato tem <mark>oráculo automatizado</mark>: sem método, o teste falha."
    }
   ]
  },
  {
   "rotulo": "Praticar",
   "blocos": [
    {
     "tipo": "ordene",
     "id": "m13b1-ord",
     "titulo": "Ordene a vida de uma claim",
     "enunciado": "Ponha os passos na ordem em que o contrato os exige.",
     "itens": [
      {
       "id": "med",
       "texto": "Executar e medir contra o método já registrado"
      },
      {
       "id": "claim",
       "texto": "Escrever a claim e o método de medição"
      },
      {
       "id": "frz",
       "texto": "Congelar persona, jornadas, claims, orçamento e go/no-go"
      },
      {
       "id": "edit",
       "texto": "Se a meta precisar mudar: edição datada, com motivo"
      },
      {
       "id": "evid",
       "texto": "Citar o arquivo de evidência da claim"
      }
     ],
     "solucao": [
      "claim",
      "frz",
      "med",
      "evid",
      "edit"
     ],
     "obrigatorio": true,
     "tutorDepois": "O método vem antes da medição; a mudança de meta vem por último e deixa rastro."
    },
    {
     "tipo": "cenario",
     "id": "m13b1-cen",
     "titulo": "A meta de recall caiu",
     "enunciado": "Depois do teste, o recall ficou abaixo da meta. Decida como tratar o contrato.",
     "inicio": "ini",
     "nos": {
      "ini": {
       "texto": "O recall medido ficou abaixo da meta congelada. O ambiente é limitado e o prazo aperta. O que você faz?",
       "opcoes": [
        {
         "texto": "Reduzir a meta no documento, porque o contexto mudou.",
         "vai": "f-sil",
         "tom": "ruim",
         "consequencia": "sem data nem motivo, é relaxamento silencioso."
        },
        {
         "texto": "Manter a meta, registrar o resultado e abrir risco no register.",
         "vai": "reg",
         "tom": "ok",
         "consequencia": "o resultado vira dado, e o risco ganha dono."
        }
       ]
      },
      "reg": {
       "texto": "Ainda quer mudar a meta para o próximo épico. Como?",
       "opcoes": [
        {
         "texto": "Editar com data e motivo, preservando a meta anterior no histórico.",
         "vai": "f-bom",
         "tom": "ok",
         "consequencia": "a mudança é auditável."
        },
        {
         "texto": "Editar sem registro, já que a próxima rodada vai passar.",
         "vai": "f-sil",
         "tom": "ruim",
         "consequencia": "o alvo se moveu para onde a flecha caiu."
        }
       ]
      }
     },
     "finais": {
      "f-sil": {
       "texto": "Relaxamento silencioso: NO-GO. A claim volta a hipótese sem sustentação.",
       "bom": false
      },
      "f-bom": {
       "texto": "Meta mantida no épico, mudança datada e motivada no próximo. O contrato segue verdadeiro.",
       "bom": true
      }
     }
    },
    {
     "tipo": "python",
     "id": "m13b1-py",
     "titulo": "Valide o contrato em código",
     "obrigatorio": false,
     "enunciado": "Complete <code>valida_contrato(claims, edicoes)</code>. Cada claim precisa de <code>metodo</code> e <code>fonte</code> não vazios; cada edição de meta precisa de <code>data</code> e <code>motivo</code>. Devolva as mensagens exatas dos testes.",
     "codigo": "def valida_contrato(claims, edicoes):\n    \"\"\"Devolve a lista de violacoes do release contract.\"\"\"\n    violacoes = []\n    # 1. claim sem metodo ou sem fonte -> \"<id>: sem metodo\" / \"<id>: sem fonte\"\n    # 2. edicao de meta sem data ou sem motivo -> \"<meta>: relaxamento silencioso\"\n    return violacoes\n\n\nclaims = [{\"id\": \"C2\", \"metodo\": \"testes de idempotencia + hash\", \"fonte\": \"B03\"}]\nprint(valida_contrato(claims, []))\n",
     "testes": "OK = [{\"id\": \"C2\", \"metodo\": \"testes + hash\", \"fonte\": \"B03\"}, {\"id\": \"C3\", \"metodo\": \"corpus dourado\", \"fonte\": \"B04\"}]\n\n\ndef test_contrato_valido():\n    assert valida_contrato(OK, []) == []\n\n\ndef test_claim_sem_metodo():\n    ruim = OK + [{\"id\": \"C9\", \"metodo\": \"\", \"fonte\": \"B05\"}]\n    assert valida_contrato(ruim, []) == [\"C9: sem metodo\"]\n\n\ndef test_claim_sem_fonte():\n    assert valida_contrato([{\"id\": \"C8\", \"metodo\": \"x\", \"fonte\": \"\"}], []) == [\"C8: sem fonte\"]\n\n\ndef test_meta_editada_sem_data_e_motivo():\n    ed = [{\"meta\": \"recall\", \"data\": \"\", \"motivo\": \"ambiente limitado\"}]\n    assert valida_contrato(OK, ed) == [\"recall: relaxamento silencioso\"]\n\n\ndef test_edicao_datada_e_motivada_passa():\n    ed = [{\"meta\": \"recall\", \"data\": \"2026-11-10\", \"motivo\": \"corpus ampliado\"}]\n    assert valida_contrato(OK, ed) == []\n",
     "dica": "Percorra <code>claims</code> e <code>edicoes</code> em dois laços; use <code>.get(campo, \"\").strip()</code> para tratar vazio.",
     "solucao": "def valida_contrato(claims, edicoes):\n    violacoes = []\n    for c in claims:\n        if not c.get(\"metodo\", \"\").strip():\n            violacoes.append(c[\"id\"] + \": sem metodo\")\n        if not c.get(\"fonte\", \"\").strip():\n            violacoes.append(c[\"id\"] + \": sem fonte\")\n    for e in edicoes:\n        if not e.get(\"data\") or not e.get(\"motivo\"):\n            violacoes.append(e[\"meta\"] + \": relaxamento silencioso\")\n    return violacoes\n",
     "tutorDepois": "Sem método, sem fonte ou sem data e motivo, o contrato reprova; é a mesma regra do teste do laboratório (exemplo didático, não é o código dele)."
    },
    {
     "tipo": "takeaway",
     "html": "Meça com o método <mark>já registrado</mark>; mude a meta só deixando <mark>data e motivo</mark>."
    }
   ]
  },
  {
   "rotulo": "Conferir",
   "blocos": [
    {
     "tipo": "escolha",
     "id": "m13b1-e1",
     "titulo": "Confira: meta editada",
     "pergunta": "Depois do teste, a meta de recall foi reduzida no documento sem data nem motivo, \"porque o ambiente é limitado\". Como o contrato trata isso?",
     "opcoes": [
      {
       "id": "a",
       "texto": "Ajuste razoável: o contexto mudou.",
       "correta": false,
       "porque": "o contrato não aceita mudança sem registro."
      },
      {
       "id": "b",
       "texto": "Relaxamento silencioso: NO-GO. Mudança de meta exige edição datada e motivo.",
       "correta": true,
       "porque": "é o invariante do bloco."
      },
      {
       "id": "c",
       "texto": "Aceitável se o teste passar de novo.",
       "correta": false,
       "porque": "passar depois de mexer na meta não prova nada."
      }
     ],
     "tutorDepois": "Sem edição datada, a claim vira publicidade."
    },
    {
     "tipo": "escolha",
     "id": "m13b1-e2",
     "titulo": "Confira: risco removido",
     "pergunta": "Um risco real sumiu do register depois de um incidente de medição. O que o contrato manda fazer?",
     "opcoes": [
      {
       "id": "a",
       "texto": "Deixar sumido: o register só lista riscos abertos.",
       "correta": false,
       "porque": "o teste de register exige honestidade sobre bloqueios."
      },
      {
       "id": "b",
       "texto": "Re-adicionar com estado BLOCKED e a causa.",
       "correta": true,
       "porque": "é o diagnóstico do bloco."
      },
      {
       "id": "c",
       "texto": "Trocar por um risco mais leve.",
       "correta": false,
       "porque": "isso esconde o risco real."
      }
     ],
     "tutorDepois": "Risco real não some: volta com estado e causa."
    },
    {
     "tipo": "takeaway",
     "html": "<mark>Claim sem método</mark>, meta sem data e evidência sem arquivo não passam."
    }
   ]
  }
 ],
 "revisao": [
  {
   "id": "r1",
   "pergunta": "Por que medir a claim com método definido antes de observar o resultado?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Para o relatório ficar mais curto.",
     "correta": false,
     "porque": "não é o motivo."
    },
    {
     "id": "b",
     "texto": "Para a claim não virar publicidade (alvo desenhado depois da flecha).",
     "correta": true,
     "porque": "o método fixa o alvo antes."
    },
    {
     "id": "c",
     "texto": "Para dispensar testes.",
     "correta": false,
     "porque": "o oráculo continua necessário."
    }
   ]
  },
  {
   "id": "r2",
   "pergunta": "Meta editada sem data nem motivo é:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Relaxamento silencioso, tratado como NO-GO.",
     "correta": true,
     "porque": "é o invariante do bloco."
    },
    {
     "id": "b",
     "texto": "Ajuste legítimo de contexto.",
     "correta": false,
     "porque": "falta o registro."
    },
    {
     "id": "c",
     "texto": "Irrelevante se o CI estiver verde.",
     "correta": false,
     "porque": "CI não valida a edição da meta."
    }
   ]
  },
  {
   "id": "r3",
   "pergunta": "Evidência citada sem arquivo é:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Quase pronta.",
     "correta": false,
     "porque": "não existe meio-termo."
    },
    {
     "id": "b",
     "texto": "Claim inválida.",
     "correta": true,
     "porque": "sem arquivo não há evidência."
    },
    {
     "id": "c",
     "texto": "Válida se o autor garantir.",
     "correta": false,
     "porque": "garantia verbal não é evidência."
    }
   ]
  },
  {
   "id": "r4",
   "pergunta": "Quando congelar persona, jornadas, claims, orçamento e go/no-go?",
   "opcoes": [
    {
     "id": "a",
     "texto": "No início de cada épico, revisitando só com edição registrada.",
     "correta": true,
     "porque": "é a decisão do Cartógrafo."
    },
    {
     "id": "b",
     "texto": "Só no fim do projeto.",
     "correta": false,
     "porque": "seria mover o alvo."
    },
    {
     "id": "c",
     "texto": "Nunca: congelar bloqueia aprendizado.",
     "correta": false,
     "porque": "há trade-off, mas a decisão é congelar cedo com revisão registrada."
    }
   ]
  }
 ]
});
})();
