/* M13 · B6: Retrieval híbrido com ACL, citação e abstenção. Fonte: M13.html#h-b6. Exemplos rotulados como exemplo não vêm do laboratório. */
(function () {
  TrilhaAula.registrar({
 "id": "m13-b6",
 "titulo": "Retrieval híbrido com ACL, citação e abstenção",
 "minutos": 45,
 "resumo": "Filtre o tenant antes de pontuar, combine BM25 e cosseno tf, cite path e line e abstenha-se abaixo do limiar.",
 "objetivo": "Explicar as três invariantes da busca (ACL antes, citação, abstenção) e ler o score híbrido.",
 "abas": [
  {
   "rotulo": "Entender",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<h3>Dois modos de falha</h3><p>Busca que vaza dado de outro tenant ou inventa resposta quando o índice não cobre a pergunta destrói o produto. Três invariantes: <strong>ACL antes de recuperar</strong> (o filtro de tenant acontece antes de pontuar qualquer chunk), <strong>score híbrido</strong> e <strong>abstenção</strong>. Todo hit carrega <code>path</code> e <code>line</code> (<strong>citação</strong>); resposta sem fonte não existe.</p><p>Score híbrido = <code>alpha · BM25 + (1-alpha) · cosseno tf</code>: sinal lexical exato com similaridade distribuída, sem depender de embeddings externos. Abstenção: melhor score abaixo do limiar devolve lista vazia (\"não sei\"), nunca um palpite reranqueado.</p>"
    },
    {
     "tipo": "texto",
     "html": "<h3>Comparação ilustrativa (esboço, não é o código do laboratório)</h3><p>Errado: pontuar tudo e filtrar depois.</p>"
    },
    {
     "tipo": "codigo",
     "linguagem": "python",
     "texto": "hits = score(todos_os_chunks, query)   # chunk de outro tenant já entrou no ranking\nreturn [h for h in hits if h.tenant_id == tenant_id]"
    },
    {
     "tipo": "texto",
     "html": "<p>O espaço de busca contém dados alheios: estatísticas (IDF), empates e vazamentos por canal lateral. Esquecer o filtro uma vez vaza dado. Certo:</p>"
    },
    {
     "tipo": "codigo",
     "linguagem": "python",
     "texto": "space = [c for c in chunks if c.tenant_id == tenant_id]   # escopo primeiro\nhits = score(space, query)\nreturn hits if hits and hits[0].score >= LIMIAR else []   # abstenção"
    },
    {
     "tipo": "takeaway",
     "html": "<mark>Escopo primeiro</mark>, <mark>citação</mark> sempre, <mark>abstenção</mark> abaixo do limiar."
    }
   ]
  },
  {
   "rotulo": "Ver funcionando",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<p>O dataset <code>fixtures/retrieval/dataset_v1.json</code> é versionado e pré-registra limiares de <strong>Recall@k</strong> e <strong>MRR</strong>; <code>evaluate</code> mede e <code>meets_thresholds</code> devolve violações. Regressão de qualidade reprova <code>test_dataset_meets_preregistered_recall_and_mrr</code>. No código, BM25 usa <code>BM25_K1 = 1.5</code> e <code>BM25_B = 0.75</code>, e o índice filtra por <code>tenant_id</code> em <code>search</code> antes do scoring.</p>"
    },
    {
     "tipo": "rode",
     "id": "m13b6-rode",
     "titulo": "Os oráculos de retrieval",
     "enunciado": "Oito testes cobrem citação, ACL, abstenção, query vazia, métricas pré-registradas e alpha inválido.",
     "prefixo": "$",
     "entrada": "uv run pytest tests/test_retrieval.py -v",
     "unidade": "ms",
     "terminalTitulo": "lab",
     "etapas": [
      {
       "id": "t",
       "nome": "pytest",
       "descricao": "8 testes",
       "tom": "request",
       "ms": 45,
       "linhas": [
        {
         "kind": "cmd",
         "text": "uv run pytest tests/test_retrieval.py -v"
        },
        {
         "kind": "out",
         "text": "test_dataset_is_versioned_and_complete PASSED"
        },
        {
         "kind": "out",
         "text": "test_hybrid_search_finds_relevant_chunk_with_citation PASSED"
        },
        {
         "kind": "out",
         "text": "test_acl_filters_before_retrieval_zero_cross_tenant PASSED"
        },
        {
         "kind": "out",
         "text": "test_abstention_below_threshold_returns_nothing PASSED"
        },
        {
         "kind": "out",
         "text": "test_empty_query_returns_nothing PASSED"
        },
        {
         "kind": "out",
         "text": "test_dataset_meets_preregistered_recall_and_mrr PASSED"
        },
        {
         "kind": "out",
         "text": "test_regression_would_break_threshold PASSED"
        },
        {
         "kind": "out",
         "text": "test_invalid_alpha_is_rejected PASSED"
        },
        {
         "kind": "out",
         "text": "8 passed"
        },
        {
         "kind": "hint",
         "text": "saída em evidence/m13/B06/pytest-retrieval.txt"
        }
       ]
      }
     ],
     "prever": {
      "pergunta": "Qual teste protege contra a pergunta \"o índice não cobre isto, mas devolva algo\"?",
      "opcoes": [
       {
        "id": "a",
        "texto": "test_abstention_below_threshold_returns_nothing",
        "correta": true,
        "porque": "abaixo do limiar a resposta é lista vazia."
       },
       {
        "id": "b",
        "texto": "test_invalid_alpha_is_rejected",
        "correta": false,
        "porque": "valida o parâmetro alpha em [0,1]."
       },
       {
        "id": "c",
        "texto": "test_empty_query_returns_nothing",
        "correta": false,
        "porque": "trata a query vazia, outro caso."
       }
      ]
     },
     "tutorDepois": "Abster-se é resposta correta quando o índice não cobre a pergunta."
    },
    {
     "tipo": "takeaway",
     "html": "Qualidade tem <mark>oráculo</mark>: limiares de Recall@k e MRR pré-registrados."
    }
   ]
  },
  {
   "rotulo": "Praticar",
   "blocos": [
    {
     "tipo": "ordene",
     "id": "m13b6-ord",
     "titulo": "Ordene a busca",
     "enunciado": "Do texto da query aos hits.",
     "itens": [
      {
       "id": "abs",
       "texto": "Abster se o melhor score ficar abaixo do limiar"
      },
      {
       "id": "pont",
       "texto": "Pontuar o híbrido só no espaço do tenant"
      },
      {
       "id": "tok",
       "texto": "Tokenizar a query (vazia devolve [])"
      },
      {
       "id": "esc",
       "texto": "Filtrar os chunks por tenant_id"
      },
      {
       "id": "cit",
       "texto": "Devolver hits com path e line"
      }
     ],
     "solucao": [
      "tok",
      "esc",
      "pont",
      "abs",
      "cit"
     ],
     "obrigatorio": true,
     "tutorDepois": "Escopo antes do scoring; abstenção antes de devolver; citação em todo hit."
    },
    {
     "tipo": "cenario",
     "id": "m13b6-cen",
     "titulo": "O limiar foi relaxado",
     "enunciado": "A métrica caiu abaixo do limiar pré-registrado.",
     "inicio": "ini",
     "nos": {
      "ini": {
       "texto": "Recall@k ficou abaixo do limiar pré-registrado depois de uma mudança no tokenizer. O que fazer?",
       "opcoes": [
        {
         "texto": "Baixar o limiar até o teste passar.",
         "vai": "f-rasga",
         "tom": "ruim",
         "consequencia": "pré-registro rasgado: edição datada ou NO-GO."
        },
        {
         "texto": "Tratar como regressão: investigar a mudança e só editar o limiar com data e motivo.",
         "vai": "f-bom",
         "tom": "ok",
         "consequencia": "a claim de qualidade mantém método antes do número."
        }
       ]
      }
     },
     "finais": {
      "f-rasga": {
       "texto": "A qualidade passa a ser opinião: NO-GO.",
       "bom": false
      },
      "f-bom": {
       "texto": "Regressão tratada; limiar só muda por edição registrada.",
       "bom": true
      }
     }
    },
    {
     "tipo": "python",
     "id": "m13b6-py",
     "titulo": "Busca com ACL e abstenção",
     "obrigatorio": false,
     "enunciado": "Complete <code>buscar</code>: filtre o tenant antes, pontue pela fração de termos da query presentes, ordene, corte <code>top_k</code> e devolva <code>[]</code> abaixo do limiar. Cada hit leva <code>path</code> e <code>line</code>.",
     "codigo": "import re\n\n\ndef tokens(texto):\n    return re.findall(r\"[a-zà-ú0-9_]+\", texto.lower())\n\n\ndef buscar(chunks, tenant_id, query, limiar, top_k=3):\n    \"\"\"Hits {path, line, score}. ACL antes de pontuar; abstencao abaixo do limiar.\"\"\"\n    q = set(tokens(query))\n    if not q:\n        return []\n    # 1. espaco = so chunks do tenant (ANTES de pontuar)\n    # 2. score = fracao dos termos da query presentes no chunk\n    # 3. ordene por score desc, ignore score 0, corte top_k\n    # 4. se nao ha hit ou o melhor < limiar -> []\n    return []\n",
     "testes": "CH = [\n    {\"tenant_id\": \"A\", \"path\": \"a/auth.py\", \"line\": 10, \"text\": \"def login(user): valida token de acesso\"},\n    {\"tenant_id\": \"A\", \"path\": \"a/db.py\", \"line\": 3, \"text\": \"abre conexao com o banco\"},\n    {\"tenant_id\": \"B\", \"path\": \"b/auth.py\", \"line\": 7, \"text\": \"login token acesso segredo do tenant B\"},\n]\n\n\ndef test_acha_chunk_relevante_com_citacao():\n    h = buscar(CH, \"A\", \"login token\", limiar=0.5)\n    assert h[0][\"path\"] == \"a/auth.py\" and h[0][\"line\"] == 10\n\n\ndef test_zero_vazamento_entre_tenants():\n    h = buscar(CH, \"A\", \"segredo tenant\", limiar=0.0)\n    assert all(not x[\"path\"].startswith(\"b/\") for x in h)\n\n\ndef test_abstencao_abaixo_do_limiar():\n    assert buscar(CH, \"A\", \"kubernetes helm chart\", limiar=0.3) == []\n\n\ndef test_query_vazia():\n    assert buscar(CH, \"A\", \"   \", limiar=0.0) == []\n\n\ndef test_controle_negativo_limiar_baixo_devolve_hit():\n    assert buscar(CH, \"A\", \"banco\", limiar=0.1)[0][\"path\"] == \"a/db.py\"\n",
     "dica": "Comece com <code>espaco = [c for c in chunks if c[\"tenant_id\"] == tenant_id]</code>; o score é <code>len(q &amp; set(tokens(texto))) / len(q)</code>.",
     "solucao": "import re\n\n\ndef tokens(texto):\n    return re.findall(r\"[a-zà-ú0-9_]+\", texto.lower())\n\n\ndef buscar(chunks, tenant_id, query, limiar, top_k=3):\n    q = set(tokens(query))\n    if not q:\n        return []\n    espaco = [c for c in chunks if c[\"tenant_id\"] == tenant_id]\n    hits = []\n    for c in espaco:\n        score = len(q & set(tokens(c[\"text\"]))) / len(q)\n        if score > 0:\n            hits.append({\"path\": c[\"path\"], \"line\": c[\"line\"], \"score\": score})\n    hits.sort(key=lambda h: (-h[\"score\"], h[\"path\"], h[\"line\"]))\n    hits = hits[:top_k]\n    if not hits or hits[0][\"score\"] < limiar:\n        return []\n    return hits\n",
     "tutorDepois": "Versão reduzida (sem BM25): o ponto é a ordem escopo, score, limiar e citação."
    },
    {
     "tipo": "takeaway",
     "html": "<mark>ACL antes</mark> do scoring, <mark>lista vazia</mark> quando não sabe."
    }
   ]
  },
  {
   "rotulo": "Conferir",
   "blocos": [
    {
     "tipo": "escolha",
     "id": "m13b6-e1",
     "titulo": "Confira: onde filtrar",
     "pergunta": "Onde deve ocorrer o filtro de tenant na busca híbrida?",
     "opcoes": [
      {
       "id": "a",
       "texto": "Antes de pontuar: o chunk de outro tenant nunca entra no espaço de busca.",
       "correta": true,
       "porque": "ACL antes de recuperar."
      },
      {
       "id": "b",
       "texto": "Depois do ranking, descartando hits alheios.",
       "correta": false,
       "porque": "dado alheio influencia IDF e empates."
      },
      {
       "id": "c",
       "texto": "Só na camada de apresentação.",
       "correta": false,
       "porque": "depende de ninguém esquecer."
      }
     ],
     "tutorDepois": "Filtrar depois deixa dado alheio influenciar estatísticas."
    },
    {
     "tipo": "escolha",
     "id": "m13b6-e2",
     "titulo": "Confira: hit sem fonte",
     "pergunta": "Um hit voltou sem path:line. Como tratar?",
     "opcoes": [
      {
       "id": "a",
       "texto": "Citação dropada no caminho do retorno: violação, resposta sem fonte não existe.",
       "correta": true,
       "porque": "diagnóstico do bloco."
      },
      {
       "id": "b",
       "texto": "Aceitável se o score for alto.",
       "correta": false,
       "porque": "score não substitui fonte."
      },
      {
       "id": "c",
       "texto": "Preencher com o caminho do índice.",
       "correta": false,
       "porque": "inventa a fonte."
      }
     ],
     "tutorDepois": "Toda resposta tem fonte rastreável."
    },
    {
     "tipo": "takeaway",
     "html": "Sem <mark>Recall e MRR</mark> medidos, \"funcionou no meu teste\" é opinião."
    }
   ]
  }
 ],
 "revisao": [
  {
   "id": "r1",
   "pergunta": "Por que o escopo de tenant antes, e não depois, do scoring?",
   "opcoes": [
    {
     "id": "a",
     "texto": "O espaço de busca não contém dados alheios (IDF, empates, canal lateral).",
     "correta": true,
     "porque": "e não depende de ninguém lembrar o filtro."
    },
    {
     "id": "b",
     "texto": "Para economizar memória.",
     "correta": false,
     "porque": "não é o motivo."
    },
    {
     "id": "c",
     "texto": "Para o ranking ficar determinístico.",
     "correta": false,
     "porque": "não é o ponto."
    }
   ]
  },
  {
   "id": "r2",
   "pergunta": "Recall@k e MRR medem o quê, e por que pré-registrar os limiares?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Cobertura dos relevantes no top-k e posição do primeiro relevante; o limiar antes do número evita mover o alvo.",
     "correta": true,
     "porque": "método antes do resultado."
    },
    {
     "id": "b",
     "texto": "Velocidade e memória.",
     "correta": false,
     "porque": "não."
    },
    {
     "id": "c",
     "texto": "Só precisão.",
     "correta": false,
     "porque": "não."
    }
   ]
  },
  {
   "id": "r3",
   "pergunta": "Quando abster é correto?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Melhor score abaixo do limiar: lista vazia (\"não sei\"), nunca palpite.",
     "correta": true,
     "porque": "é diferente de erro silencioso."
    },
    {
     "id": "b",
     "texto": "Nunca.",
     "correta": false,
     "porque": "é invariante."
    },
    {
     "id": "c",
     "texto": "Só se a query for vazia.",
     "correta": false,
     "porque": "query vazia é outro teste."
    }
   ]
  },
  {
   "id": "r4",
   "pergunta": "Limiar relaxado após falha é:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Pré-registro rasgado: edição datada ou NO-GO.",
     "correta": true,
     "porque": "diagnóstico."
    },
    {
     "id": "b",
     "texto": "Prática normal.",
     "correta": false,
     "porque": "não."
    },
    {
     "id": "c",
     "texto": "Aceitável com CI verde.",
     "correta": false,
     "porque": "não."
    }
   ]
  }
 ]
});
})();
