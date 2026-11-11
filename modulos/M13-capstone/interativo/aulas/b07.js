/* M13 · B7: Grafo de código com proveniência e update incremental. Fonte: M13.html#h-b7. Exemplos rotulados como exemplo não vêm do laboratório. */
(function () {
  TrilhaAula.registrar({
 "id": "m13-b7",
 "titulo": "Grafo de código com proveniência e update incremental",
 "minutos": 40,
 "resumo": "Toda aresta carrega source, path e line; fato e inferência nunca se misturam; reprocessar um arquivo substitui só as suas arestas.",
 "objetivo": "Explicar proveniência total, a separação extracted/inferred e o update incremental por path.",
 "abas": [
  {
   "rotulo": "Entender",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<h3>Busca textual não responde pergunta estrutural</h3><p>Busca textual responde \"onde aparece este nome\". Perguntas <strong>estruturais</strong> (quem chama <code>f</code>, o que este módulo importa, o que fica crítico se este símbolo mudar) exigem <strong>grafo</strong>. O invariante central é a <strong>proveniência total</strong>: toda aresta carrega <code>source</code> (<code>extracted</code> = fato do parser; <code>inferred</code> = inferência rotulada), <code>path</code> e <code>line</code>. <code>facts_vs_inferred</code> separa as contagens e <code>without_provenance</code> audita arestas órfãs.</p>"
    },
    {
     "tipo": "texto",
     "html": "<h3>Update incremental</h3><p>Reprocessar um arquivo substitui as suas arestas: <code>add_file</code> remove as do mesmo <code>path</code> antes de inserir, sem duplicar nem tocar o resto do grafo. É o mesmo espírito de idempotência da ingestão (B3), agora na estrutura derivada. O corpus dourado fixa respostas estruturais; <code>golden_diff</code> devolve divergências campo a campo. Depende de B4 e M10; artefato <code>lab/src/capstone_lab/graph.py</code>.</p>"
    },
    {
     "tipo": "takeaway",
     "html": "<mark>Proveniência</mark> em toda aresta; atualização é <mark>substituição por path</mark>."
    }
   ]
  },
  {
   "rotulo": "Ver funcionando",
   "blocos": [
    {
     "tipo": "rode",
     "id": "m13b7-rode",
     "titulo": "Os oráculos do grafo",
     "enunciado": "Nove testes, incluindo mutação do golden.",
     "prefixo": "$",
     "entrada": "uv run pytest tests/test_graph.py -v",
     "unidade": "ms",
     "terminalTitulo": "lab",
     "etapas": [
      {
       "id": "t",
       "nome": "pytest",
       "descricao": "9 testes",
       "tom": "request",
       "ms": 45,
       "linhas": [
        {
         "kind": "cmd",
         "text": "uv run pytest tests/test_graph.py -v"
        },
        {
         "kind": "out",
         "text": "test_structural_question_who_calls_helper PASSED"
        },
        {
         "kind": "out",
         "text": "test_every_edge_has_provenance PASSED"
        },
        {
         "kind": "out",
         "text": "test_facts_are_separated_from_inference PASSED"
        },
        {
         "kind": "out",
         "text": "test_incremental_update_replaces_only_changed_file PASSED"
        },
        {
         "kind": "out",
         "text": "test_graph_metrics_in_degree PASSED"
        },
        {
         "kind": "out",
         "text": "test_answers_match_golden_corpus PASSED"
        },
        {
         "kind": "out",
         "text": "test_golden_mutation_is_detected PASSED"
        },
        {
         "kind": "out",
         "text": "test_inferred_edge_requires_explicit_source_label PASSED"
        },
        {
         "kind": "out",
         "text": "test_empty_graph_has_no_callers PASSED"
        },
        {
         "kind": "out",
         "text": "9 passed"
        },
        {
         "kind": "hint",
         "text": "o teste de mutação prova que o oráculo não é decorativo; saída em evidence/m13/B07/pytest-graph.txt"
        }
       ]
      }
     ],
     "prever": {
      "pergunta": "Para que serve test_golden_mutation_is_detected?",
      "opcoes": [
       {
        "id": "a",
        "texto": "Provar que alterar o golden é detectado: o oráculo não é decorativo.",
        "correta": true,
        "porque": "golden_diff devolve divergências."
       },
       {
        "id": "b",
        "texto": "Medir desempenho do grafo.",
        "correta": false,
        "porque": "não mede tempo."
       },
       {
        "id": "c",
        "texto": "Gerar o golden.",
        "correta": false,
        "porque": "o teste só detecta."
       }
      ]
     },
     "tutorDepois": "Um oráculo precisa provar que enxerga a mudança."
    },
    {
     "tipo": "takeaway",
     "html": "O <mark>teste de mutação</mark> mostra que o golden realmente vigia o grafo."
    }
   ]
  },
  {
   "rotulo": "Praticar",
   "blocos": [
    {
     "tipo": "ordene",
     "id": "m13b7-ord",
     "titulo": "Ordene o update de um arquivo",
     "enunciado": "Reprocessar sem duplicar.",
     "itens": [
      {
       "id": "rot",
       "texto": "Registrar inferências com add_inferred, rotuladas"
      },
      {
       "id": "ins",
       "texto": "Inserir as arestas extracted com source, path e line"
      },
      {
       "id": "rem",
       "texto": "Remover as arestas já emitidas pelo mesmo path"
      },
      {
       "id": "gd",
       "texto": "Conferir com golden_diff"
      },
      {
       "id": "parse",
       "texto": "Receber o ParseResult do arquivo"
      }
     ],
     "solucao": [
      "parse",
      "rem",
      "ins",
      "rot",
      "gd"
     ],
     "obrigatorio": true,
     "tutorDepois": "Remover antes de inserir é o que impede duplicata."
    },
    {
     "tipo": "transcript",
     "id": "m13b7-tr",
     "titulo": "Ache a afirmação sem sustentação",
     "obrigatorio": false,
     "terminalTitulo": "sessão",
     "enunciado": "Uma afirmação mistura inferência com fato.",
     "linhas": [
      {
       "quem": "voce",
       "texto": "O grafo mostra quem chama helper?"
      },
      {
       "quem": "agente",
       "texto": "Sim: 2 arestas extracted, com path e line."
      },
      {
       "quem": "ferramenta",
       "texto": "$ graph.facts_vs_inferred()\\n{'extracted': 2, 'inferred': 1}"
      },
      {
       "quem": "agente",
       "texto": "Todas as 3 arestas são fato do parser."
      },
      {
       "quem": "agente",
       "texto": "Reporto 2 fatos e 1 inferência rotulada."
      }
     ],
     "erradas": [
      3
     ],
     "explicacao": {
      "3": "a contagem mostra 1 inferred; contá-la como fato é o defeito do bloco (rótulo ausente reprova)."
     }
    },
    {
     "tipo": "python",
     "id": "m13b7-py",
     "titulo": "Grafo com proveniência",
     "obrigatorio": false,
     "enunciado": "Complete <code>add_file</code> (substitui as arestas do mesmo <code>path</code>), <code>callers_of</code> (ordenado por path e line), <code>facts_vs_inferred</code> e <code>sem_proveniencia</code>.",
     "codigo": "class CodeGraph:\n    def __init__(self):\n        self.edges = []\n\n    def add_file(self, path, relacoes, source=\"extracted\"):\n        \"\"\"Update incremental: substitui as arestas do arquivo, sem duplicar.\n        relacoes: lista de (kind, alvo, linha).\"\"\"\n        pass\n\n    def add_inferred(self, src, dst, kind, path, line):\n        self.edges.append({\"src\": src, \"dst\": dst, \"kind\": kind, \"source\": \"inferred\", \"path\": path, \"line\": line})\n\n    def callers_of(self, nome):\n        return []\n\n    def facts_vs_inferred(self):\n        return {\"extracted\": 0, \"inferred\": 0}\n\n    def sem_proveniencia(self):\n        return []\n",
     "testes": "def _g():\n    g = CodeGraph()\n    g.add_file(\"a.py\", [(\"calls\", \"helper\", 3), (\"imports\", \"os\", 1)])\n    g.add_file(\"b.py\", [(\"calls\", \"helper\", 9)])\n    return g\n\n\ndef test_quem_chama_helper():\n    assert [(e[\"path\"], e[\"line\"]) for e in _g().callers_of(\"helper\")] == [(\"a.py\", 3), (\"b.py\", 9)]\n\n\ndef test_toda_aresta_tem_proveniencia():\n    assert _g().sem_proveniencia() == []\n\n\ndef test_fato_separado_de_inferencia():\n    g = _g()\n    g.add_inferred(\"a.py\", \"helper2\", \"calls\", \"a.py\", 5)\n    assert g.facts_vs_inferred() == {\"extracted\": 3, \"inferred\": 1}\n\n\ndef test_update_incremental_substitui_so_o_arquivo():\n    g = _g()\n    g.add_file(\"a.py\", [(\"calls\", \"helper\", 4)])\n    assert [(e[\"path\"], e[\"line\"]) for e in g.callers_of(\"helper\")] == [(\"a.py\", 4), (\"b.py\", 9)]\n    assert len(g.edges) == 2\n\n\ndef test_controle_negativo_grafo_vazio():\n    assert CodeGraph().callers_of(\"x\") == []\n\n\ndef test_aresta_sem_linha_e_detectada():\n    g = CodeGraph()\n    g.add_inferred(\"a\", \"b\", \"calls\", \"a.py\", 0)\n    assert len(g.sem_proveniencia()) == 1\n",
     "dica": "Em <code>add_file</code>, refaça <code>self.edges</code> sem as do <code>path</code> antes de inserir; <code>out[e[\"source\"]] += 1</code> conta fato e inferência.",
     "solucao": "class CodeGraph:\n    def __init__(self):\n        self.edges = []\n\n    def add_file(self, path, relacoes, source=\"extracted\"):\n        self.edges = [e for e in self.edges if e[\"path\"] != path]\n        for kind, alvo, linha in relacoes:\n            self.edges.append({\"src\": path, \"dst\": alvo, \"kind\": kind, \"source\": source, \"path\": path, \"line\": linha})\n\n    def add_inferred(self, src, dst, kind, path, line):\n        self.edges.append({\"src\": src, \"dst\": dst, \"kind\": kind, \"source\": \"inferred\", \"path\": path, \"line\": line})\n\n    def callers_of(self, nome):\n        achados = [e for e in self.edges if e[\"kind\"] == \"calls\" and e[\"dst\"] == nome]\n        return sorted(achados, key=lambda e: (e[\"path\"], e[\"line\"]))\n\n    def facts_vs_inferred(self):\n        out = {\"extracted\": 0, \"inferred\": 0}\n        for e in self.edges:\n            out[e[\"source\"]] += 1\n        return out\n\n    def sem_proveniencia(self):\n        return [e for e in self.edges if not e[\"path\"] or e[\"line\"] <= 0 or not e[\"source\"]]\n",
     "tutorDepois": "Versão reduzida do graph.py: substituir por path mantém o grafo sem duplicata."
    },
    {
     "tipo": "takeaway",
     "html": "Fato e inferência contam <mark>separados</mark>; reprocessar não deixa <mark>duplicata</mark>."
    }
   ]
  },
  {
   "rotulo": "Conferir",
   "blocos": [
    {
     "tipo": "escolha",
     "id": "m13b7-e1",
     "titulo": "Confira: arestas duplicadas",
     "pergunta": "Após reprocessar um arquivo, o grafo tem arestas duplicadas. Qual o defeito?",
     "opcoes": [
      {
       "id": "a",
       "texto": "O parser ficou não determinístico.",
       "correta": false,
       "porque": "o sintoma é de update, não de parser."
      },
      {
       "id": "b",
       "texto": "O update é append-only: add_file deveria remover as arestas do mesmo path antes de inserir.",
       "correta": true,
       "porque": "update incremental é substituição por path."
      },
      {
       "id": "c",
       "texto": "Falta rotular as arestas como inferred.",
       "correta": false,
       "porque": "rótulo não causa duplicata."
      }
     ],
     "tutorDepois": "Mesmo espírito de idempotência do B3."
    },
    {
     "tipo": "escolha",
     "id": "m13b7-e2",
     "titulo": "Confira: o que exige grafo",
     "pergunta": "Qual pergunta exige o grafo e não é bem respondida por busca por similaridade?",
     "opcoes": [
      {
       "id": "a",
       "texto": "\"O que fica crítico se este símbolo mudar?\"",
       "correta": true,
       "porque": "pergunta estrutural."
      },
      {
       "id": "b",
       "texto": "\"Onde aparece este nome?\"",
       "correta": false,
       "porque": "a busca textual responde."
      },
      {
       "id": "c",
       "texto": "\"Qual arquivo é maior?\"",
       "correta": false,
       "porque": "não é estrutural."
      }
     ],
     "tutorDepois": "Estrutura pede aresta com origem."
    },
    {
     "tipo": "takeaway",
     "html": "Aresta sem <mark>proveniência</mark> ou inferência sem rótulo reprova o bloco."
    }
   ]
  }
 ],
 "revisao": [
  {
   "id": "r1",
   "pergunta": "O que uma pergunta estrutural exige que retrieval por similaridade não oferece?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Arestas explícitas (chamadas, imports) com origem.",
     "correta": true,
     "porque": "grafo."
    },
    {
     "id": "b",
     "texto": "Mais embeddings.",
     "correta": false,
     "porque": "não."
    },
    {
     "id": "c",
     "texto": "Snippet mais longo.",
     "correta": false,
     "porque": "não."
    }
   ]
  },
  {
   "id": "r2",
   "pergunta": "Por que separar extracted de inferred é invariante e não convenção?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Sem o rótulo, inferência é lida como fato; o bloco reprova.",
     "correta": true,
     "porque": "test_inferred_edge_requires_explicit_source_label."
    },
    {
     "id": "b",
     "texto": "Para economizar memória.",
     "correta": false,
     "porque": "não."
    },
    {
     "id": "c",
     "texto": "Porque o parser exige.",
     "correta": false,
     "porque": "não."
    }
   ]
  },
  {
   "id": "r3",
   "pergunta": "Como o update incremental preserva a idempotência?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Substitui as arestas do path em vez de acrescentar.",
     "correta": true,
     "porque": "sem duplicata."
    },
    {
     "id": "b",
     "texto": "Reconstrói o grafo todo.",
     "correta": false,
     "porque": "não é incremental."
    },
    {
     "id": "c",
     "texto": "Ignora arquivos repetidos.",
     "correta": false,
     "porque": "perderia atualização."
    }
   ]
  },
  {
   "id": "r4",
   "pergunta": "Golden alterado sem revisão:",
   "opcoes": [
    {
     "id": "a",
     "texto": "A mutação é detectada; exigir diff revisado.",
     "correta": true,
     "porque": "oráculo vivo."
    },
    {
     "id": "b",
     "texto": "Passa em silêncio.",
     "correta": false,
     "porque": "não passa."
    },
    {
     "id": "c",
     "texto": "Vira PASS.",
     "correta": false,
     "porque": "não."
    }
   ]
  }
 ]
});
})();
