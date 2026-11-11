/* M13 · B2: Baseline reproduzível do repositório. Fonte: M13.html#h-b2. Exemplos rotulados como exemplo não vêm do laboratório. */
(function () {
  TrilhaAula.registrar({
 "id": "m13-b2",
 "titulo": "Baseline reproduzível do repositório",
 "minutos": 30,
 "resumo": "Clone limpo, uv sync, lint, tipos e testes sem passo oculto; o que o ambiente não roda fica BLOCKED com causa.",
 "objetivo": "Distinguir baseline reproduzível de máquina do autor e registrar BLOCKED honesto em vez de simular.",
 "abas": [
  {
   "rotulo": "Entender",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<h3>Reprodutível é sem passo oculto</h3><p><strong>Reprodutível</strong> significa: clone limpo, <code>uv sync</code>, lint, tipos e testes, sem passo oculto e sem depender da máquina do autor. O mecanismo é o <strong>lockfile</strong>: <code>uv.lock</code> fixa cada dependência por versão e hash, e <code>requires-python = \">=3.14\"</code> fixa o interpretador. <code>ruff</code> e <code>mypy</code> strict são <strong>oráculos</strong>, não enfeite de CI. Sem lock, \"funciona na minha máquina\" é dado faltando, não opinião divergente.</p>"
    },
    {
     "tipo": "texto",
     "html": "<h3>Decisão do Tier: sem contêiner</h3><p>O ambiente deste lote não tem Docker. O arquivo <code>lab/docker-compose.yml</code> documenta o alvo (api + worker + Postgres 17) e fica <strong>BLOCKED</strong> até o ambiente existir. Nenhum comando foi simulado. Rodar com SQLite e filesystem locais basta para provar os invariantes de B3 a B5; o custo é a distância do deploy real, registrada nos riscos R-01 e R-03. Depende de M02, M03 e LT04; artefatos: <code>lab/pyproject.toml</code> e <code>lab/uv.lock</code>.</p>"
    },
    {
     "tipo": "takeaway",
     "html": "O <mark>lockfile</mark> torna o baseline reproduzível; o que não roda fica <mark>BLOCKED com causa</mark>."
    }
   ]
  },
  {
   "rotulo": "Ver funcionando",
   "blocos": [
    {
     "tipo": "rode",
     "id": "m13b2-rode",
     "titulo": "Baseline completo",
     "enunciado": "Sequência do laboratório, do sync ao pytest.",
     "prefixo": "$",
     "entrada": "uv sync && uv run pytest -q",
     "unidade": "ms",
     "terminalTitulo": "lab",
     "etapas": [
      {
       "id": "sync",
       "nome": "uv sync",
       "descricao": "Resolve pelo lock",
       "tom": "dns",
       "ms": 4,
       "linhas": [
        {
         "kind": "cmd",
         "text": "cd modulos/M13-capstone/lab"
        },
        {
         "kind": "cmd",
         "text": "uv sync"
        },
        {
         "kind": "out",
         "text": "Resolved 13 packages in 4ms"
        }
       ]
      },
      {
       "id": "ruff",
       "nome": "ruff",
       "descricao": "Lint e formato",
       "tom": "tcp",
       "ms": 20,
       "linhas": [
        {
         "kind": "cmd",
         "text": "uv run ruff check ."
        },
        {
         "kind": "out",
         "text": "All checks passed!"
        },
        {
         "kind": "cmd",
         "text": "uv run ruff format --check ."
        },
        {
         "kind": "out",
         "text": "12 files already formatted"
        }
       ]
      },
      {
       "id": "mypy",
       "nome": "mypy",
       "descricao": "Strict",
       "tom": "tls",
       "ms": 30,
       "linhas": [
        {
         "kind": "cmd",
         "text": "uv run mypy"
        },
        {
         "kind": "out",
         "text": "Success: no issues found in 8 source files"
        }
       ]
      },
      {
       "id": "pytest",
       "nome": "pytest",
       "descricao": "Suíte completa",
       "tom": "request",
       "ms": 80,
       "linhas": [
        {
         "kind": "cmd",
         "text": "uv run pytest -q"
        },
        {
         "kind": "out",
         "text": "23 passed in 0.08s"
        },
        {
         "kind": "hint",
         "text": "saídas em evidence/m13/B02/"
        }
       ]
      },
      {
       "id": "docker",
       "nome": "docker",
       "descricao": "Trilha Compose",
       "tom": "response",
       "ms": 1,
       "linhas": [
        {
         "kind": "cmd",
         "text": "docker --version"
        },
        {
         "kind": "in",
         "text": "command not found: docker"
        },
        {
         "kind": "hint",
         "text": "BLOCKED: causa registrada em uv-sync-e-docker-blocked.txt"
        }
       ]
      }
     ],
     "prever": {
      "pergunta": "Qual destas etapas termina em BLOCKED neste ambiente?",
      "opcoes": [
       {
        "id": "a",
        "texto": "uv sync",
        "correta": false,
        "porque": "o sync resolve 13 pacotes."
       },
       {
        "id": "b",
        "texto": "mypy",
        "correta": false,
        "porque": "passa em 8 arquivos de origem."
       },
       {
        "id": "c",
        "texto": "docker --version (trilha Compose)",
        "correta": true,
        "porque": "command not found: docker; sem Docker, a trilha fica BLOCKED."
       }
      ]
     },
     "tutorDepois": "Cada etapa tem saída real; a que não pôde rodar tem causa, não badge."
    },
    {
     "tipo": "takeaway",
     "html": "Cada etapa gera <mark>evidência real</mark>; Docker ausente vira <mark>BLOCKED</mark>, nunca simulação."
    }
   ]
  },
  {
   "rotulo": "Praticar",
   "blocos": [
    {
     "tipo": "ordene",
     "id": "m13b2-ord",
     "titulo": "Ordene o baseline",
     "enunciado": "Ordem do clone limpo ao registro do que não rodou.",
     "itens": [
      {
       "id": "pt",
       "texto": "uv run pytest -q"
      },
      {
       "id": "sync",
       "texto": "uv sync"
      },
      {
       "id": "fmt",
       "texto": "uv run ruff format --check ."
      },
      {
       "id": "mypy",
       "texto": "uv run mypy"
      },
      {
       "id": "lint",
       "texto": "uv run ruff check ."
      },
      {
       "id": "bl",
       "texto": "Registrar BLOCKED para o que o ambiente não roda"
      }
     ],
     "solucao": [
      "sync",
      "lint",
      "fmt",
      "mypy",
      "pt",
      "bl"
     ],
     "obrigatorio": true,
     "tutorDepois": "Lock primeiro, oráculos estáticos depois, testes no fim, e o bloqueio fica registrado."
    },
    {
     "tipo": "transcript",
     "id": "m13b2-tr",
     "titulo": "Ache a afirmação sem sustentação",
     "obrigatorio": false,
     "terminalTitulo": "sessão",
     "enunciado": "Uma afirmação do agente não tem evidência. Clique nela e confira.",
     "linhas": [
      {
       "quem": "voce",
       "texto": "Feche o baseline do capstone."
      },
      {
       "quem": "agente",
       "texto": "Rodei uv sync, ruff, mypy e pytest: tudo verde."
      },
      {
       "quem": "ferramenta",
       "texto": "$ docker --version\ncommand not found: docker"
      },
      {
       "quem": "agente",
       "texto": "Docker Compose está OK, porque o docker-compose.yml existe."
      },
      {
       "quem": "agente",
       "texto": "Registro a trilha Compose como BLOCKED, causa command not found."
      }
     ],
     "erradas": [
      3
     ],
     "explicacao": {
      "3": "existir o arquivo não prova execução; sem Docker o estado é BLOCKED com causa, não OK decorativo."
     }
    },
    {
     "tipo": "python",
     "id": "m13b2-py",
     "titulo": "Classifique a trilha",
     "obrigatorio": false,
     "enunciado": "Complete <code>status_trilha(exit_code, stderr)</code>: <code>PASS</code> com 0; <code>BLOCKED</code> com 127 ou \"command not found\" (e a causa); <code>FAIL</code> com a última linha do stderr nos demais casos.",
     "codigo": "def status_trilha(exit_code, stderr):\n    \"\"\"Devolve (status, causa). Nunca finge PASS.\"\"\"\n    # 0 -> (\"PASS\", \"\")\n    # 127 ou \"command not found\" no stderr -> (\"BLOCKED\", <causa>)\n    # qualquer outro codigo -> (\"FAIL\", <ultima linha do stderr>)\n    return (\"PASS\", \"\")\n\n\nprint(status_trilha(127, \"command not found: docker\"))\n",
     "testes": "def test_sucesso():\n    assert status_trilha(0, \"\") == (\"PASS\", \"\")\n\n\ndef test_docker_ausente_e_blocked_com_causa():\n    assert status_trilha(127, \"command not found: docker\") == (\"BLOCKED\", \"command not found: docker\")\n\n\ndef test_command_not_found_com_outro_codigo():\n    assert status_trilha(1, \"zsh: command not found: docker\")[0] == \"BLOCKED\"\n\n\ndef test_falha_real_nao_vira_blocked():\n    assert status_trilha(1, \"linha1\\nruff: 3 errors\") == (\"FAIL\", \"ruff: 3 errors\")\n\n\ndef test_blocked_sempre_tem_causa():\n    s, causa = status_trilha(127, \"command not found: docker\")\n    assert s == \"BLOCKED\" and causa\n",
     "dica": "Teste primeiro o código 0, depois 127 ou a frase no stderr; o resto é FAIL com <code>splitlines()[-1]</code>.",
     "solucao": "def status_trilha(exit_code, stderr):\n    if exit_code == 0:\n        return (\"PASS\", \"\")\n    if exit_code == 127 or \"command not found\" in stderr:\n        return (\"BLOCKED\", stderr.strip())\n    linhas = stderr.strip().splitlines()\n    return (\"FAIL\", linhas[-1] if linhas else \"\")\n",
     "tutorDepois": "BLOCKED sempre carrega causa; FAIL real não pode virar BLOCKED para esconder defeito (exemplo didático)."
    },
    {
     "tipo": "takeaway",
     "html": "Baseline é <mark>ordem fixa</mark> de oráculos; o que não rodou ganha <mark>causa</mark>, não badge."
    }
   ]
  },
  {
   "rotulo": "Conferir",
   "blocos": [
    {
     "tipo": "escolha",
     "id": "m13b2-e1",
     "titulo": "Confira: Docker ausente",
     "pergunta": "O ambiente não tem Docker. O que o baseline deve fazer com a trilha Compose?",
     "opcoes": [
      {
       "id": "a",
       "texto": "Mostrar um badge OK, porque o docker-compose.yml existe.",
       "correta": false,
       "porque": "é badge decorativo."
      },
      {
       "id": "b",
       "texto": "Simular a saída dos comandos para completar a evidência.",
       "correta": false,
       "porque": "é trilha simulada."
      },
      {
       "id": "c",
       "texto": "Registrar BLOCKED com a causa (command not found) e o risco associado, sem fingir execução.",
       "correta": true,
       "porque": "BLOCKED honesto tem causa e evidência."
      }
     ],
     "tutorDepois": "A e B são exatamente o que o curso chama de trilha simulada."
    },
    {
     "tipo": "escolha",
     "id": "m13b2-e2",
     "titulo": "Confira: mypy reclama",
     "pergunta": "mypy strict reclama de um teste sem anotação. O conserto certo é:",
     "opcoes": [
      {
       "id": "a",
       "texto": "Anotar o teste.",
       "correta": true,
       "porque": "o diagnóstico do bloco: anotar, não silenciar."
      },
      {
       "id": "b",
       "texto": "Adicionar <code>type: ignore</code>.",
       "correta": false,
       "porque": "silencia o oráculo."
      },
      {
       "id": "c",
       "texto": "Excluir tests/ do mypy.",
       "correta": false,
       "porque": "o strict vale no código e nos testes."
      }
     ],
     "tutorDepois": "Oráculo silenciado deixa de ser oráculo."
    },
    {
     "tipo": "takeaway",
     "html": "<mark>BLOCKED honesto</mark> tem causa e evidência; simulação não."
    }
   ]
  }
 ],
 "revisao": [
  {
   "id": "r1",
   "pergunta": "O que o lockfile garante que um requirements informal não garante?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Cada dependência fixada por versão e hash.",
     "correta": true,
     "porque": "é o mecanismo de reprodutibilidade."
    },
    {
     "id": "b",
     "texto": "Código sem bugs.",
     "correta": false,
     "porque": "lock não testa código."
    },
    {
     "id": "c",
     "texto": "Execução mais rápida.",
     "correta": false,
     "porque": "não é o objetivo."
    }
   ]
  },
  {
   "id": "r2",
   "pergunta": "Ruff e ruff format divergem. Conserto:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Rodar ruff format antes de publicar.",
     "correta": true,
     "porque": "é o diagnóstico do bloco."
    },
    {
     "id": "b",
     "texto": "Desligar o format.",
     "correta": false,
     "porque": "remove o oráculo."
    },
    {
     "id": "c",
     "texto": "Ignorar o formato.",
     "correta": false,
     "porque": "CI vai divergir."
    }
   ]
  },
  {
   "id": "r3",
   "pergunta": "uv sync falha sem rede. Conduta:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Usar cache/lock e registrar a limitação.",
     "correta": true,
     "porque": "é o diagnóstico."
    },
    {
     "id": "b",
     "texto": "Pular o sync.",
     "correta": false,
     "porque": "quebra o baseline."
    },
    {
     "id": "c",
     "texto": "Declarar PASS.",
     "correta": false,
     "porque": "seria evidência falsa."
    }
   ]
  },
  {
   "id": "r4",
   "pergunta": "Diferença entre BLOCKED honesto e trilha simulada:",
   "opcoes": [
    {
     "id": "a",
     "texto": "BLOCKED tem causa e evidência; simulada fabrica saída.",
     "correta": true,
     "porque": "é a distinção do bloco."
    },
    {
     "id": "b",
     "texto": "Não há diferença.",
     "correta": false,
     "porque": "há."
    },
    {
     "id": "c",
     "texto": "Simulada é mais barata e igual.",
     "correta": false,
     "porque": "é evidência falsa."
    }
   ]
  }
 ]
});
})();
