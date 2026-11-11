/* M13 · B8: Gateway de modelos: porta, normalização e budget de retry. Fonte: M13.html#h-b8. Exemplos rotulados como exemplo não vêm do laboratório. */
(function () {
  TrilhaAula.registrar({
 "id": "m13-b8",
 "titulo": "Gateway de modelos: porta, normalização e budget de retry",
 "minutos": 40,
 "resumo": "O domínio fala com a porta ModelGateway; todo erro vira ErrorKind fechado e o retry tem budget e só vale para kinds retryable.",
 "objetivo": "Explicar porta, normalização de erro e budget de retry, e distinguir fake declarado de chamada simulada.",
 "abas": [
  {
   "rotulo": "Entender",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<h3>Acoplar ao SDK custa caro</h3><p>Acoplar o domínio ao SDK de um fornecedor transforma troca de modelo em refatoração e erro proprietário em exceção imprevisível. A porta <code>ModelGateway</code> (<code>Protocol</code>) define <code>ModelRequest → ModelResponse</code> com <code>usage</code> normalizado. Toda falha vira <code>NormalizedError</code> com <code>ErrorKind</code> <strong>fechado</strong>: <code>timeout</code>, <code>rate_limit</code>, <code>invalid_output</code>, <code>budget_exceeded</code>, <code>unavailable</code>. <strong>Structured output</strong> é validado contra o schema do request; JSON inválido vira erro tipado, nunca string solta.</p>"
    },
    {
     "tipo": "texto",
     "html": "<h3>Fake declarado, nada simulado</h3><p>Sem rede e sem credenciais, os adapters reais (OpenAI, Anthropic, locais) ficam <strong>BLOCKED</strong> e registrados; nenhuma chamada é fingida como real. O <code>FakeModelAdapter</code> é declarado como fake e serve aos <strong>contract tests</strong>: a mesma suíte que rodará contra um adapter real roda hoje contra ele. <code>with_retry_budget</code> limita retentativas a <code>max_retries</code> e só em kinds retryable; esgotado, converte em <code>BUDGET_EXCEEDED</code>. Depende de M09 e M11; artefato <code>lab/src/capstone_lab/models.py</code>.</p>"
    },
    {
     "tipo": "takeaway",
     "html": "<mark>Erro fechado e tipado</mark>, retry com <mark>budget</mark>, fake sempre <mark>declarado</mark>."
    }
   ]
  },
  {
   "rotulo": "Ver funcionando",
   "blocos": [
    {
     "tipo": "rode",
     "id": "m13b8-rode",
     "titulo": "Os oráculos do gateway",
     "enunciado": "Sete testes rodam a mesma suíte contra o fake.",
     "prefixo": "$",
     "entrada": "uv run pytest tests/test_gateway.py -v",
     "unidade": "ms",
     "terminalTitulo": "lab",
     "etapas": [
      {
       "id": "t",
       "nome": "pytest",
       "descricao": "7 testes",
       "tom": "request",
       "ms": 45,
       "linhas": [
        {
         "kind": "cmd",
         "text": "uv run pytest tests/test_gateway.py -v"
        },
        {
         "kind": "out",
         "text": "test_same_suite_runs_on_fake_adapter PASSED"
        },
        {
         "kind": "out",
         "text": "test_usage_is_normalized_format PASSED"
        },
        {
         "kind": "out",
         "text": "test_structured_output_parsed_and_validated PASSED"
        },
        {
         "kind": "out",
         "text": "test_invalid_structured_output_is_normalized_error PASSED"
        },
        {
         "kind": "out",
         "text": "test_timeout_is_normalized_and_retryable PASSED"
        },
        {
         "kind": "out",
         "text": "test_non_retryable_error_is_not_retried PASSED"
        },
        {
         "kind": "out",
         "text": "test_domain_types_do_not_import_vendor_sdks PASSED"
        },
        {
         "kind": "out",
         "text": "7 passed"
        },
        {
         "kind": "hint",
         "text": "o último teste falha se algum SDK de fornecedor aparecer fora de um adapter; saída em evidence/m13/B08/pytest-gateway.txt"
        }
       ]
      }
     ],
     "prever": {
      "pergunta": "O que o último teste faz?",
      "opcoes": [
       {
        "id": "a",
        "texto": "Mede a latência do fornecedor.",
        "correta": false,
        "porque": "não faz chamadas."
       },
       {
        "id": "b",
        "texto": "Importa o pacote e falha se algum SDK de fornecedor aparecer fora de um adapter.",
        "correta": true,
        "porque": "neutralidade aplicada por oráculo."
       },
       {
        "id": "c",
        "texto": "Testa o timeout.",
        "correta": false,
        "porque": "há outro teste para isso."
       }
      ]
     },
     "tutorDepois": "Neutralidade vira teste, não boa vontade."
    },
    {
     "tipo": "takeaway",
     "html": "A suíte é a mesma para o <mark>fake</mark> e para o adapter real."
    }
   ]
  },
  {
   "rotulo": "Praticar",
   "blocos": [
    {
     "tipo": "ordene",
     "id": "m13b8-ord",
     "titulo": "Ordene a chamada",
     "enunciado": "Da request ao domínio.",
     "itens": [
      {
       "id": "dom",
       "texto": "O domínio recebe só tipos internos"
      },
      {
       "id": "req",
       "texto": "ModelRequest com schema opcional"
      },
      {
       "id": "exh",
       "texto": "Esgotado: NormalizedError BUDGET_EXCEEDED"
      },
      {
       "id": "norm",
       "texto": "O adapter normaliza o erro em ErrorKind"
      },
      {
       "id": "ret",
       "texto": "Se retryable e dentro do budget: retentar"
      }
     ],
     "solucao": [
      "req",
      "norm",
      "ret",
      "exh",
      "dom"
     ],
     "obrigatorio": true,
     "tutorDepois": "Normaliza primeiro; só então decide retry; o domínio nunca vê exceção do fornecedor."
    },
    {
     "tipo": "transcript",
     "id": "m13b8-tr",
     "titulo": "Ache a afirmação sem sustentação",
     "obrigatorio": false,
     "terminalTitulo": "sessão",
     "enunciado": "Uma afirmação declara teste real sem credencial.",
     "linhas": [
      {
       "quem": "voce",
       "texto": "Validamos o adapter da Anthropic?"
      },
      {
       "quem": "agente",
       "texto": "Rodei a suíte de contrato contra o FakeModelAdapter: 7 passed."
      },
      {
       "quem": "ferramenta",
       "texto": "$ env | grep -i API_KEY\\n(sem saída)"
      },
      {
       "quem": "agente",
       "texto": "Então o adapter real foi testado e está PASS."
      },
      {
       "quem": "agente",
       "texto": "Registro os adapters reais como BLOCKED: sem rede nem credenciais."
      }
     ],
     "erradas": [
      3
     ],
     "explicacao": {
      "3": "sem credencial não houve chamada real; \"testado contra o modelo X\" sem credencial é BLOCKED honesto, nunca PASS."
     }
    },
    {
     "tipo": "python",
     "id": "m13b8-py",
     "titulo": "Retry com budget",
     "obrigatorio": false,
     "enunciado": "Complete <code>with_retry_budget(gateway, retryable, max_retries)</code>: <code>max_retries + 1</code> tentativas, só em kinds retryable; esgotado vira <code>budget_exceeded</code>; não retryable sobe na hora.",
     "codigo": "class NormalizedError(Exception):\n    def __init__(self, kind, provider=\"fake\", detail=\"\"):\n        super().__init__(kind)\n        self.kind, self.provider, self.detail = kind, provider, detail\n\n\ndef with_retry_budget(gateway, retryable, max_retries):\n    \"\"\"Devolve call(request). Tenta max_retries + 1 vezes, so em kinds retryable.\n    Esgotado -> NormalizedError(\"budget_exceeded\"). Nao retryable -> sobe na hora.\"\"\"\n\n    def call(request):\n        return gateway(request)\n\n    return call\n",
     "testes": "RETRY = frozenset({\"timeout\", \"rate_limit\"})\n\n\ndef _falha(n, kind):\n    estado = {\"calls\": 0}\n\n    def gw(req):\n        estado[\"calls\"] += 1\n        if estado[\"calls\"] <= n:\n            raise NormalizedError(kind)\n        return \"ok\"\n\n    return gw, estado\n\n\ndef test_sucesso_apos_retries():\n    gw, st = _falha(2, \"timeout\")\n    assert with_retry_budget(gw, RETRY, 2)(\"p\") == \"ok\" and st[\"calls\"] == 3\n\n\ndef test_esgotado_vira_budget_exceeded():\n    gw, st = _falha(99, \"rate_limit\")\n    try:\n        with_retry_budget(gw, RETRY, 2)(\"p\")\n        assert False\n    except NormalizedError as e:\n        assert e.kind == \"budget_exceeded\"\n    assert st[\"calls\"] == 3\n\n\ndef test_nao_retryable_nao_e_repetido():\n    gw, st = _falha(99, \"invalid_output\")\n    try:\n        with_retry_budget(gw, RETRY, 2)(\"p\")\n        assert False\n    except NormalizedError as e:\n        assert e.kind == \"invalid_output\"\n    assert st[\"calls\"] == 1\n\n\ndef test_controle_negativo_zero_retries_tenta_uma_vez():\n    gw, st = _falha(99, \"timeout\")\n    try:\n        with_retry_budget(gw, RETRY, 0)(\"p\")\n    except NormalizedError:\n        pass\n    assert st[\"calls\"] == 1\n",
     "dica": "Laço <code>for _ in range(max_retries + 1)</code> com <code>try/except NormalizedError</code>; se <code>exc.kind not in retryable</code>, <code>raise</code>; após o laço, levante budget_exceeded.",
     "solucao": "class NormalizedError(Exception):\n    def __init__(self, kind, provider=\"fake\", detail=\"\"):\n        super().__init__(kind)\n        self.kind, self.provider, self.detail = kind, provider, detail\n\n\ndef with_retry_budget(gateway, retryable, max_retries):\n    def call(request):\n        tentativas = max_retries + 1\n        ultimo = None\n        for _ in range(tentativas):\n            try:\n                return gateway(request)\n            except NormalizedError as exc:\n                ultimo = exc\n                if exc.kind not in retryable:\n                    raise\n        raise NormalizedError(\"budget_exceeded\", ultimo.provider, \"retry budget esgotado apos %d tentativas\" % tentativas)\n\n    return call\n",
     "tutorDepois": "O budget limita custo e o conjunto de kinds limita o que vale a pena repetir (versão reduzida do models.py)."
    },
    {
     "tipo": "takeaway",
     "html": "<mark>Retry</mark> só para erro que melhora com tempo, e com <mark>teto</mark>."
    }
   ]
  },
  {
   "rotulo": "Conferir",
   "blocos": [
    {
     "tipo": "escolha",
     "id": "m13b8-e1",
     "titulo": "Confira: budget esgotado",
     "pergunta": "with_retry_budget esgota as tentativas em um erro retryable. O que o domínio recebe?",
     "opcoes": [
      {
       "id": "a",
       "texto": "A exceção original do SDK do fornecedor.",
       "correta": false,
       "porque": "nenhuma exceção proprietária sobe."
      },
      {
       "id": "b",
       "texto": "Uma string com a mensagem de erro.",
       "correta": false,
       "porque": "erro precisa ser tipado."
      },
      {
       "id": "c",
       "texto": "Um NormalizedError com kind BUDGET_EXCEEDED.",
       "correta": true,
       "porque": "o conjunto de ErrorKind é fechado e tipado."
      }
     ],
     "tutorDepois": "Nenhuma exceção proprietária sobe ao domínio."
    },
    {
     "tipo": "escolha",
     "id": "m13b8-e2",
     "titulo": "Confira: loop de retry",
     "pergunta": "Um erro invalid_output é retentado indefinidamente. Qual o diagnóstico?",
     "opcoes": [
      {
       "id": "a",
       "texto": "Retry loop em erro não retryable: budget ou kind não conferidos.",
       "correta": true,
       "porque": "diagnóstico do bloco."
      },
      {
       "id": "b",
       "texto": "O fake está lento.",
       "correta": false,
       "porque": "não é latência."
      },
      {
       "id": "c",
       "texto": "Falta mais tokens.",
       "correta": false,
       "porque": "usage não é o problema."
      }
     ],
     "tutorDepois": "Repetir saída inválida só gasta budget."
    },
    {
     "tipo": "takeaway",
     "html": "<mark>Fake declarado</mark> e <mark>BLOCKED honesto</mark> protegem a evidência."
    }
   ]
  }
 ],
 "revisao": [
  {
   "id": "r1",
   "pergunta": "Por que o conjunto de ErrorKind precisa ser fechado e tipado?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Para o domínio tratar toda falha sem conhecer exceção de fornecedor.",
     "correta": true,
     "porque": "normalização."
    },
    {
     "id": "b",
     "texto": "Para reduzir tokens.",
     "correta": false,
     "porque": "não."
    },
    {
     "id": "c",
     "texto": "Para dispensar testes.",
     "correta": false,
     "porque": "não."
    }
   ]
  },
  {
   "id": "r2",
   "pergunta": "O que o contract test garante quando um adapter real entrar?",
   "opcoes": [
    {
     "id": "a",
     "texto": "A mesma suíte roda sem mudar o domínio.",
     "correta": true,
     "porque": "contrato igual."
    },
    {
     "id": "b",
     "texto": "Que o modelo é melhor.",
     "correta": false,
     "porque": "não mede qualidade."
    },
    {
     "id": "c",
     "texto": "Que o custo cai.",
     "correta": false,
     "porque": "não."
    }
   ]
  },
  {
   "id": "r3",
   "pergunta": "Fake declarado vs simulação como chamada real:",
   "opcoes": [
    {
     "id": "a",
     "texto": "O fake é rotulado e serve a contract tests; simulação apresentada como real é evidência falsa.",
     "correta": true,
     "porque": "BLOCKED honesto."
    },
    {
     "id": "b",
     "texto": "São iguais.",
     "correta": false,
     "porque": "não."
    },
    {
     "id": "c",
     "texto": "Simulação é preferível.",
     "correta": false,
     "porque": "não."
    }
   ]
  },
  {
   "id": "r4",
   "pergunta": "\"Testado contra o modelo X\" sem credencial:",
   "opcoes": [
    {
     "id": "a",
     "texto": "BLOCKED honesto, nunca PASS.",
     "correta": true,
     "porque": "sem chamada real."
    },
    {
     "id": "b",
     "texto": "PASS.",
     "correta": false,
     "porque": "falso."
    },
    {
     "id": "c",
     "texto": "PASS condicional.",
     "correta": false,
     "porque": "não existe."
    }
   ]
  },
  {
   "id": "r5",
   "pergunta": "Exceção de SDK subindo ao domínio indica:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Normalização ausente no adapter.",
     "correta": true,
     "porque": "diagnóstico."
    },
    {
     "id": "b",
     "texto": "Rede instável.",
     "correta": false,
     "porque": "não."
    },
    {
     "id": "c",
     "texto": "Schema inválido.",
     "correta": false,
     "porque": "não."
    }
   ]
  }
 ]
});
})();
