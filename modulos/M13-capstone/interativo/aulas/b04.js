/* M13 · B4: Parsing multi-language com corpus dourado. Fonte: M13.html#h-b4. Exemplos rotulados como exemplo não vêm do laboratório. */
(function () {
  TrilhaAula.registrar({
 "id": "m13-b4",
 "titulo": "Parsing multi-language com corpus dourado",
 "minutos": 35,
 "resumo": "Símbolos e relações são determinísticos: uma porta LanguageParser, adapters por linguagem e um corpus dourado como oráculo.",
 "objetivo": "Explicar a porta LanguageParser, o corpus dourado e por que erro de parse é um número auditável.",
 "abas": [
  {
   "rotulo": "Entender",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<h3>O LLM não faz o parsing</h3><p>O Cartógrafo não entrega parsing ao LLM: símbolos e relações são <strong>determinísticos</strong>. A porta <code>LanguageParser</code> (<code>Protocol</code>) define o contrato: <code>language_id</code> e <code>parse(path, source) -> ParseResult</code> com símbolos, relações e <strong>erros medidos</strong>. Qualquer linguagem entra por um <strong>adapter</strong> que satisfaz a porta; o domínio nunca importa tipos do parser concreto.</p>"
    },
    {
     "tipo": "texto",
     "largo": true,
     "html": "<table><thead><tr><th>Implementação</th><th>Como funciona</th><th>Limite</th></tr></thead><tbody><tr><td><code>PythonAstParser</code></td><td>módulo <code>ast</code> da stdlib (gramática oficial) para funções, classes, imports e chamadas; <code>SyntaxError</code> vira <code>ParseError</code> com linha</td><td>nunca exceção solta nem lista vazia silenciosa</td></tr><tr><td><code>MiniLangParser</code></td><td>segunda linguagem por regex derivadas de gramática EBNF local e versionada (<code>func_decl</code>, <code>call_stmt</code>, <code>let_stmt</code>)</td><td>sem blocos/aninhamento; linha inválida é erro contado e o resto continua analisável</td></tr></tbody></table>"
    },
    {
     "tipo": "callout",
     "tom": "danger",
     "titulo": "Tree-sitter: BLOCKED",
     "html": "A especificação mira Tree-sitter com gramáticas nativas, mas binários e gramáticas não estão disponíveis neste ambiente. A porta já aceita um adapter Tree-sitter sem mudar o contrato. O suporte multi-language aqui é provado pelo par AST+MiniLang e pelo corpus dourado (risco R-02). Nenhuma saída de Tree-sitter foi simulada."
    },
    {
     "tipo": "takeaway",
     "html": "A <mark>porta</mark> isola o domínio do parser; a <mark>linguagem só conta</mark> com fixture dourada."
    }
   ]
  },
  {
   "rotulo": "Ver funcionando",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<p>Quatro fixtures formam o contrato: <code>sample.py</code> (4 símbolos, 7 relações), <code>sample.mini</code> (2 símbolos, 3 relações), <code>broken.py</code> (1 erro medido) e <code>broken.mini</code> (1 erro medido, restante preservado). O oráculo compara parse e golden campo a campo; divergência reprova.</p>"
    },
    {
     "tipo": "rode",
     "id": "m13b4-rode",
     "titulo": "O oráculo do parser",
     "enunciado": "Oito testes: duas implementações, quatro fixtures dourados, erro medido e orçamento de erro.",
     "prefixo": "$",
     "entrada": "uv run pytest tests/test_parsers.py -v",
     "unidade": "ms",
     "terminalTitulo": "lab",
     "etapas": [
      {
       "id": "t",
       "nome": "pytest",
       "descricao": "8 testes",
       "tom": "request",
       "ms": 40,
       "linhas": [
        {
         "kind": "cmd",
         "text": "uv run pytest tests/test_parsers.py -v"
        },
        {
         "kind": "out",
         "text": "... 8 passed (2 implementações, 4 fixtures dourados, erro medido, budget de erro do corpus)"
        },
        {
         "kind": "hint",
         "text": "test_error_budget_of_corpus_is_measured fixa em 2 os arquivos com erro do corpus; saída em evidence/m13/B04/pytest-parsers.txt"
        }
       ]
      }
     ],
     "prever": {
      "pergunta": "Por que o orçamento de erro do corpus está fixado em 2?",
      "opcoes": [
       {
        "id": "a",
        "texto": "Para o teste passar mais fácil.",
        "correta": false,
        "porque": "o número vem da medição."
       },
       {
        "id": "b",
        "texto": "Porque erro de parse é número auditável: broken.py e broken.mini são os dois arquivos com erro.",
        "correta": true,
        "porque": "erro medido, não ruído varrido."
       },
       {
        "id": "c",
        "texto": "Porque o Tree-sitter limita a 2.",
        "correta": false,
        "porque": "Tree-sitter está BLOCKED."
       }
      ]
     },
     "tutorDepois": "Erro de parse entra no resultado e no orçamento, nunca no silêncio."
    },
    {
     "tipo": "takeaway",
     "html": "O erro de parse é <mark>dado medido</mark> no ParseResult."
    }
   ]
  },
  {
   "rotulo": "Praticar",
   "blocos": [
    {
     "tipo": "ordene",
     "id": "m13b4-ord",
     "titulo": "Ordene: nova linguagem",
     "enunciado": "Para a linguagem contar como suportada.",
     "itens": [
      {
       "id": "or",
       "texto": "Oráculo compara parse e golden campo a campo"
      },
      {
       "id": "ad",
       "texto": "Escrever o adapter que satisfaz LanguageParser"
      },
      {
       "id": "gold",
       "texto": "Gerar o golden e revisar o diff"
      },
      {
       "id": "fx",
       "texto": "Criar fixtures: um válido e um quebrado"
      },
      {
       "id": "bud",
       "texto": "Fixar o orçamento de erro do corpus"
      }
     ],
     "solucao": [
      "ad",
      "fx",
      "gold",
      "or",
      "bud"
     ],
     "obrigatorio": true,
     "tutorDepois": "Sem fixture dourada e divergências medidas, não conta como suporte."
    },
    {
     "tipo": "transcript",
     "id": "m13b4-tr",
     "titulo": "Ache a afirmação sem sustentação",
     "obrigatorio": false,
     "terminalTitulo": "sessão",
     "enunciado": "Uma afirmação confunde \"não quebra\" com correção.",
     "linhas": [
      {
       "quem": "voce",
       "texto": "Adicionei Go ao parser. Posso declarar suporte?"
      },
      {
       "quem": "agente",
       "texto": "O parser roda sem exceção em três arquivos Go."
      },
      {
       "quem": "agente",
       "texto": "Então Go está suportado, sem precisar de fixture dourada."
      },
      {
       "quem": "ferramenta",
       "texto": "$ uv run pytest tests/test_parsers.py\n8 passed"
      },
      {
       "quem": "agente",
       "texto": "Registro Go como adapter sem golden: aceitação do B4 pendente."
      }
     ],
     "erradas": [
      2
     ],
     "explicacao": {
      "2": "rodar sem exceção não prova símbolos e relações corretos; sem golden e divergências medidas a aceitação do B4 não é atendida."
     }
    },
    {
     "tipo": "python",
     "id": "m13b4-py",
     "titulo": "Golden e orçamento",
     "obrigatorio": false,
     "enunciado": "Complete <code>compara_golden(obtido, golden)</code> (lista de campos do golden que divergem) e <code>conta_erros(resultados)</code> (arquivos com ao menos um erro).",
     "codigo": "def compara_golden(obtido, golden):\n    \"\"\"Lista os campos do golden que divergem do obtido (ordem do golden).\"\"\"\n    return []\n\n\ndef conta_erros(resultados):\n    \"\"\"Numero de arquivos do corpus com ao menos um erro de parse.\"\"\"\n    return 0\n\n\nprint(compara_golden({\"simbolos\": 4, \"relacoes\": 7}, {\"simbolos\": 4, \"relacoes\": 7}))\n",
     "testes": "GOLD = {\"simbolos\": 4, \"relacoes\": 7, \"erros\": 0}\n\n\ndef test_igual_ao_golden():\n    assert compara_golden(dict(GOLD), GOLD) == []\n\n\ndef test_divergencia_campo_a_campo():\n    assert compara_golden({\"simbolos\": 4, \"relacoes\": 6, \"erros\": 0}, GOLD) == [\"relacoes\"]\n\n\ndef test_campo_ausente_diverge():\n    assert compara_golden({\"simbolos\": 4, \"relacoes\": 7}, GOLD) == [\"erros\"]\n\n\ndef test_orcamento_de_erro_do_corpus():\n    corpus = [{\"erros\": []}, {\"erros\": [{\"linha\": 3}]}, {\"erros\": [{\"linha\": 1}, {\"linha\": 2}]}, {\"erros\": []}]\n    assert conta_erros(corpus) == 2\n\n\ndef test_controle_negativo_corpus_limpo():\n    assert conta_erros([{\"erros\": []}, {\"erros\": []}]) == 0\n",
     "dica": "Compreensão de lista sobre <code>golden.items()</code> comparando com <code>obtido.get(k)</code>; e <code>sum(1 for r in ... if r[\"erros\"])</code>.",
     "solucao": "def compara_golden(obtido, golden):\n    return [k for k, v in golden.items() if obtido.get(k) != v]\n\n\ndef conta_erros(resultados):\n    return sum(1 for r in resultados if r.get(\"erros\"))\n",
     "tutorDepois": "Comparar campo a campo e contar erros torna o oráculo auditável (exemplo didático)."
    },
    {
     "tipo": "takeaway",
     "html": "Golden prova <mark>símbolos e relações</mark>; \"não quebra\" não prova correção."
    }
   ]
  },
  {
   "rotulo": "Conferir",
   "blocos": [
    {
     "tipo": "escolha",
     "id": "m13b4-e1",
     "titulo": "Confira: terceira linguagem",
     "pergunta": "Você adiciona uma terceira linguagem, sem fixture dourada, e o teste de \"não quebra\" passa. Conta como suporte?",
     "opcoes": [
      {
       "id": "a",
       "texto": "Sim: o parser roda sem exceção.",
       "correta": false,
       "porque": "não prova correção."
      },
      {
       "id": "b",
       "texto": "Não: sem fixture dourada e divergências medidas, a aceitação do B4 não é atendida.",
       "correta": true,
       "porque": "o corpus compara campo a campo e fixa o orçamento."
      },
      {
       "id": "c",
       "texto": "Sim, se o código estiver em mypy strict.",
       "correta": false,
       "porque": "tipagem não substitui o oráculo."
      }
     ],
     "tutorDepois": "O golden é o contrato de suporte."
    },
    {
     "tipo": "escolha",
     "id": "m13b4-e2",
     "titulo": "Confira: SyntaxError",
     "pergunta": "Um arquivo Python quebrado devolve lista vazia sem erro. Isso:",
     "opcoes": [
      {
       "id": "a",
       "texto": "Viola o contrato: o erro precisa ir ao ParseResult.",
       "correta": true,
       "porque": "erro com linha, nunca silêncio."
      },
      {
       "id": "b",
       "texto": "É aceitável: arquivo inválido não tem símbolos.",
       "correta": false,
       "porque": "o erro precisa ser contado."
      },
      {
       "id": "c",
       "texto": "Depende da linguagem.",
       "correta": false,
       "porque": "vale para toda linguagem."
      }
     ],
     "tutorDepois": "Silêncio esconde erro de corpus."
    },
    {
     "tipo": "takeaway",
     "html": "Domínio depende da <mark>porta</mark>; suporte exige <mark>golden</mark>."
    }
   ]
  }
 ],
 "revisao": [
  {
   "id": "r1",
   "pergunta": "Por que o domínio depende de LanguageParser e não do ast direto?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Para qualquer linguagem entrar por adapter sem mudar o domínio.",
     "correta": true,
     "porque": "é a porta."
    },
    {
     "id": "b",
     "texto": "Porque ast é lento.",
     "correta": false,
     "porque": "não é o motivo."
    },
    {
     "id": "c",
     "texto": "Porque ast não existe no 3.14.",
     "correta": false,
     "porque": "existe."
    }
   ]
  },
  {
   "id": "r2",
   "pergunta": "Golden diverge após mudança intencional do parser:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Regenerar e revisar o diff.",
     "correta": true,
     "porque": "divergência intencional vira diff revisado."
    },
    {
     "id": "b",
     "texto": "Apagar o golden.",
     "correta": false,
     "porque": "perde o oráculo."
    },
    {
     "id": "c",
     "texto": "Ignorar o teste.",
     "correta": false,
     "porque": "reprova o B4."
    }
   ]
  },
  {
   "id": "r3",
   "pergunta": "O que prova o corpus dourado que \"não quebra\" não prova?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Símbolos e relações corretos, campo a campo, e orçamento de erro.",
     "correta": true,
     "porque": "correção medida."
    },
    {
     "id": "b",
     "texto": "Velocidade.",
     "correta": false,
     "porque": "não mede."
    },
    {
     "id": "c",
     "texto": "Cobertura de linha.",
     "correta": false,
     "porque": "não é o foco."
    }
   ]
  },
  {
   "id": "r4",
   "pergunta": "Tree-sitter neste lote:",
   "opcoes": [
    {
     "id": "a",
     "texto": "BLOCKED com causa; a porta já o aceitaria sem mudar o contrato.",
     "correta": true,
     "porque": "nada foi simulado."
    },
    {
     "id": "b",
     "texto": "PASS por simulação.",
     "correta": false,
     "porque": "proibido."
    },
    {
     "id": "c",
     "texto": "Removido da spec.",
     "correta": false,
     "porque": "continua como alvo."
    }
   ]
  }
 ]
});
})();
