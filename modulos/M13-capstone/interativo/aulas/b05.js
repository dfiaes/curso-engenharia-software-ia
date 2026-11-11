/* M13 · B5: Modelo de dados, migrations e isolamento. Fonte: M13.html#h-b5. Exemplos rotulados como exemplo não vêm do laboratório. */
(function () {
  TrilhaAula.registrar({
 "id": "m13-b5",
 "titulo": "Modelo de dados, migrations e isolamento",
 "minutos": 40,
 "resumo": "SQLite com foreign keys por conexão, migrations up/down em transação e scoping de tenant obrigatório; RLS fica como design.",
 "objetivo": "Explicar o que o scoping de tenant e as constraints do banco provam, e o que fica BLOCKED sem Postgres.",
 "abas": [
  {
   "rotulo": "Entender",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<h3>Multi-tenant falha por vazamento sutil</h3><p>Uma query sem filtro de <strong>tenant</strong> expõe tudo. O modelo local usa SQLite com <code>PRAGMA foreign_keys = ON</code> e as tabelas <code>tenant → repository → snapshot → file → symbol/edge</code> mais <code>job/usage_event</code>, todas as linhas de cliente com <code>tenant_id</code>. <strong>Migrations</strong> são pares versionados (up/down) aplicados em transação por passo e registrados em <code>schema_migrations</code>; rollback é operação suportada.</p>"
    },
    {
     "tipo": "texto",
     "html": "<h3>Decisão e fronteira PG/RLS</h3><p>Nesta camada, o isolamento é <strong>scoping obrigatório</strong>: toda função pública de leitura exige <code>tenant_id</code>. O Postgres com <strong>RLS</strong> (<code>WITH CHECK</code>, políticas por sessão, pool com <code>SET LOCAL</code>) é defesa em profundidade que entra no adapter PG; o design e o SQL de política estão em <code>docs/migrations-design.md</code>. Postgres fica <strong>BLOCKED</strong> por ambiente (R-01/R-03): o que está provado é limitado ao que o SQLite garante, e o documento separa o provado do planejado. Depende de M03, M07, M10 e M12; artefatos <code>lab/src/capstone_lab/db.py</code> e <code>lab/docs/migrations-design.md</code>.</p>"
    },
    {
     "tipo": "takeaway",
     "html": "O <mark>banco</mark> garante (constraint), a convenção não; <mark>RLS</mark> só vale quando testado em Postgres."
    }
   ]
  },
  {
   "rotulo": "Ver funcionando",
   "blocos": [
    {
     "tipo": "rode",
     "id": "m13b5-rode",
     "titulo": "Os oráculos de dados",
     "enunciado": "Seis testes cobrem migrate, rollback, FK, scoping, job idempotente e CHECK.",
     "prefixo": "$",
     "entrada": "uv run pytest tests/test_db.py -v",
     "unidade": "ms",
     "terminalTitulo": "lab",
     "etapas": [
      {
       "id": "t",
       "nome": "pytest",
       "descricao": "6 testes",
       "tom": "request",
       "ms": 35,
       "linhas": [
        {
         "kind": "cmd",
         "text": "uv run pytest tests/test_db.py -v"
        },
        {
         "kind": "out",
         "text": "test_migrate_applies_all_versions PASSED"
        },
        {
         "kind": "out",
         "text": "test_rollback_restores_prior_schema PASSED"
        },
        {
         "kind": "out",
         "text": "test_foreign_key_integrity_is_enforced PASSED"
        },
        {
         "kind": "out",
         "text": "test_tenant_scoping_isolates_data_between_tenants PASSED"
        },
        {
         "kind": "out",
         "text": "test_job_upsert_is_idempotent_by_key PASSED"
        },
        {
         "kind": "out",
         "text": "test_invalid_job_status_is_rejected_by_check_constraint PASSED"
        },
        {
         "kind": "out",
         "text": "6 passed"
        },
        {
         "kind": "hint",
         "text": "o job idempotente usa UNIQUE + ON CONFLICT DO UPDATE: a constraint é o mecanismo, não a convenção de chamada"
        }
       ]
      }
     ],
     "prever": {
      "pergunta": "Qual destes testes só tem sentido porque o PRAGMA é por conexão?",
      "opcoes": [
       {
        "id": "a",
        "texto": "test_foreign_key_integrity_is_enforced",
        "correta": true,
        "porque": "se alguma conexão abrir sem o PRAGMA, os órfãos passam."
       },
       {
        "id": "b",
        "texto": "test_rollback_restores_prior_schema",
        "correta": false,
        "porque": "fala de migrations."
       },
       {
        "id": "c",
        "texto": "test_job_upsert_is_idempotent_by_key",
        "correta": false,
        "porque": "fala de UNIQUE + ON CONFLICT."
       }
      ]
     },
     "tutorDepois": "Fixtures A e B provam zero vazamento no data plane local."
    },
    {
     "tipo": "takeaway",
     "html": "A <mark>constraint do banco</mark> é o mecanismo; a convenção de chamada não conta."
    }
   ]
  },
  {
   "rotulo": "Praticar",
   "blocos": [
    {
     "tipo": "ordene",
     "id": "m13b5-ord",
     "titulo": "Ordene a migration",
     "enunciado": "Da conexão ao rollback.",
     "itens": [
      {
       "id": "reg",
       "texto": "Registrar a versão em schema_migrations"
      },
      {
       "id": "up",
       "texto": "Aplicar o up da migration em transação"
      },
      {
       "id": "pragma",
       "texto": "Abrir a conexão com PRAGMA foreign_keys = ON"
      },
      {
       "id": "down",
       "texto": "Se falhar ou for revertida: aplicar o down também em transação"
      }
     ],
     "solucao": [
      "pragma",
      "up",
      "reg",
      "down"
     ],
     "obrigatorio": true,
     "tutorDepois": "O PRAGMA vem com a conexão; cada passo é transacional; rollback é suportado."
    },
    {
     "tipo": "cenario",
     "id": "m13b5-cen",
     "titulo": "Vazamento do tenant A para o B",
     "enunciado": "Um relatório mostra repositórios de A na tela de B.",
     "inicio": "ini",
     "nos": {
      "ini": {
       "texto": "A tela do tenant B listou repositórios de A. Onde procurar primeiro?",
       "opcoes": [
        {
         "texto": "Uma query pública sem escopo de tenant_id.",
         "vai": "f-bom",
         "tom": "ok",
         "consequencia": "é o diagnóstico do bloco; reprova o contrato."
        },
        {
         "texto": "Dizer que o RLS resolve, mesmo sem Postgres testado.",
         "vai": "f-rls",
         "tom": "ruim",
         "consequencia": "RLS testado sem Postgres é claim inválida; fica BLOCKED."
        }
       ]
      }
     },
     "finais": {
      "f-bom": {
       "texto": "Escopo obrigatório na função e teste com fixtures A/B: zero vazamento no data plane local.",
       "bom": true
      },
      "f-rls": {
       "texto": "Claim sem evidência: o vazamento continua e o register perde a verdade.",
       "bom": false
      }
     }
    },
    {
     "tipo": "python",
     "id": "m13b5-py",
     "titulo": "Constraints e scoping",
     "obrigatorio": false,
     "enunciado": "Complete <code>abrir()</code> (ligar as foreign keys), <code>upsert_job</code> (<code>ON CONFLICT ... DO UPDATE</code>) e <code>listar_repos(conn, tenant_id)</code> com filtro de tenant.",
     "codigo": "import sqlite3\n\nSCHEMA = \"\"\"\nCREATE TABLE tenant (id TEXT PRIMARY KEY);\nCREATE TABLE repository (id INTEGER PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenant(id), name TEXT NOT NULL);\nCREATE TABLE job (tenant_id TEXT NOT NULL REFERENCES tenant(id), idem_key TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('queued','running','done')), UNIQUE (tenant_id, idem_key));\n\"\"\"\n\n\ndef abrir():\n    conn = sqlite3.connect(\":memory:\")\n    # foreign_keys e por conexao: ligue o PRAGMA aqui\n    conn.executescript(SCHEMA)\n    return conn\n\n\ndef upsert_job(conn, tenant_id, chave, status):\n    \"\"\"Idempotente pela constraint UNIQUE, nao por if no codigo.\"\"\"\n    pass\n\n\ndef listar_repos(conn, tenant_id):\n    \"\"\"Toda leitura publica exige tenant_id.\"\"\"\n    return []\n",
     "testes": "import sqlite3\n\n\ndef _base():\n    c = abrir()\n    c.execute(\"INSERT INTO tenant VALUES ('A')\")\n    c.execute(\"INSERT INTO tenant VALUES ('B')\")\n    c.execute(\"INSERT INTO repository (tenant_id, name) VALUES ('A', 'api')\")\n    c.execute(\"INSERT INTO repository (tenant_id, name) VALUES ('B', 'web')\")\n    return c\n\n\ndef test_foreign_key_e_aplicada():\n    c = abrir()\n    try:\n        c.execute(\"INSERT INTO repository (tenant_id, name) VALUES ('X', 'orfao')\")\n        assert False, \"orfao deveria ser rejeitado\"\n    except sqlite3.IntegrityError:\n        pass\n\n\ndef test_isolamento_entre_tenants():\n    c = _base()\n    assert listar_repos(c, \"A\") == [\"api\"]\n    assert listar_repos(c, \"B\") == [\"web\"]\n\n\ndef test_upsert_idempotente_por_chave():\n    c = _base()\n    upsert_job(c, \"A\", \"k1\", \"queued\")\n    upsert_job(c, \"A\", \"k1\", \"running\")\n    rows = c.execute(\"SELECT status FROM job WHERE tenant_id='A' AND idem_key='k1'\").fetchall()\n    assert rows == [(\"running\",)]\n\n\ndef test_status_invalido_e_rejeitado_pelo_banco():\n    c = _base()\n    try:\n        upsert_job(c, \"A\", \"k2\", \"inventado\")\n        assert False\n    except sqlite3.IntegrityError:\n        pass\n\n\ndef test_controle_negativo_mesma_chave_em_outro_tenant():\n    c = _base()\n    upsert_job(c, \"A\", \"k\", \"queued\")\n    upsert_job(c, \"B\", \"k\", \"queued\")\n    assert c.execute(\"SELECT COUNT(*) FROM job\").fetchone()[0] == 2\n",
     "dica": "<code>PRAGMA foreign_keys = ON</code> logo após <code>connect</code>; upsert com <code>ON CONFLICT (tenant_id, idem_key) DO UPDATE SET status = excluded.status</code>; leitura com <code>WHERE tenant_id = ?</code>.",
     "solucao": "import sqlite3\n\nSCHEMA = \"\"\"\nCREATE TABLE tenant (id TEXT PRIMARY KEY);\nCREATE TABLE repository (id INTEGER PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenant(id), name TEXT NOT NULL);\nCREATE TABLE job (tenant_id TEXT NOT NULL REFERENCES tenant(id), idem_key TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('queued','running','done')), UNIQUE (tenant_id, idem_key));\n\"\"\"\n\n\ndef abrir():\n    conn = sqlite3.connect(\":memory:\")\n    conn.execute(\"PRAGMA foreign_keys = ON\")\n    conn.executescript(SCHEMA)\n    return conn\n\n\ndef upsert_job(conn, tenant_id, chave, status):\n    conn.execute(\n        \"INSERT INTO job (tenant_id, idem_key, status) VALUES (?, ?, ?) \"\n        \"ON CONFLICT (tenant_id, idem_key) DO UPDATE SET status = excluded.status\",\n        (tenant_id, chave, status),\n    )\n\n\ndef listar_repos(conn, tenant_id):\n    rows = conn.execute(\"SELECT name FROM repository WHERE tenant_id = ? ORDER BY name\", (tenant_id,))\n    return [r[0] for r in rows]\n",
     "tutorDepois": "Foreign key, UNIQUE e CHECK vêm do banco; o escopo de tenant vem da assinatura da função (modelo reduzido do db.py)."
    },
    {
     "tipo": "takeaway",
     "html": "Ligue o PRAGMA em <mark>toda conexão</mark> e exija <mark>tenant_id</mark> em toda leitura."
    }
   ]
  },
  {
   "rotulo": "Conferir",
   "blocos": [
    {
     "tipo": "escolha",
     "id": "m13b5-e1",
     "titulo": "Confira: linhas órfãs",
     "pergunta": "Há linhas órfãs apesar das foreign keys declaradas no SQLite. Qual a causa mais provável?",
     "opcoes": [
      {
       "id": "a",
       "texto": "O SQLite não suporta foreign keys.",
       "correta": false,
       "porque": "suporta."
      },
      {
       "id": "b",
       "texto": "As migrations estão fora de ordem.",
       "correta": false,
       "porque": "não explica órfãos."
      },
      {
       "id": "c",
       "texto": "PRAGMA foreign_keys é por conexão, não global: alguma conexão o deixou desligado.",
       "correta": true,
       "porque": "daí o PRAGMA ao abrir toda conexão."
      }
     ],
     "tutorDepois": "O bloco lista exatamente este diagnóstico."
    },
    {
     "tipo": "escolha",
     "id": "m13b5-e2",
     "titulo": "Confira: RLS testado",
     "pergunta": "O relatório diz \"RLS testado\" mas o ambiente só tem SQLite. Como registrar?",
     "opcoes": [
      {
       "id": "a",
       "texto": "PASS, porque o design está pronto.",
       "correta": false,
       "porque": "design não é teste."
      },
      {
       "id": "b",
       "texto": "BLOCKED, com a causa ambiental.",
       "correta": true,
       "porque": "claim inválida vira BLOCKED."
      },
      {
       "id": "c",
       "texto": "PASS parcial.",
       "correta": false,
       "porque": "não existe parcial."
      }
     ],
     "tutorDepois": "Separe o provado do planejado."
    },
    {
     "tipo": "takeaway",
     "html": "Scoping na aplicação é <mark>defesa mínima</mark>; RLS no servidor é <mark>profundidade</mark> ainda BLOCKED."
    }
   ]
  }
 ],
 "revisao": [
  {
   "id": "r1",
   "pergunta": "Por que o par up/down em transação importa mais que a migration \"dar certo\"?",
   "opcoes": [
    {
     "id": "a",
     "texto": "Rollback é operação suportada e não deixa meio-estado.",
     "correta": true,
     "porque": "transação por passo."
    },
    {
     "id": "b",
     "texto": "Para o SQL ficar curto.",
     "correta": false,
     "porque": "não é o motivo."
    },
    {
     "id": "c",
     "texto": "Para dispensar testes.",
     "correta": false,
     "porque": "os testes continuam."
    }
   ]
  },
  {
   "id": "r2",
   "pergunta": "Diferença entre scoping na aplicação e RLS no servidor:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Scoping é filtro obrigatório no código; RLS é política do banco, defesa em profundidade.",
     "correta": true,
     "porque": "RLS entra no adapter PG."
    },
    {
     "id": "b",
     "texto": "São idênticos.",
     "correta": false,
     "porque": "não são."
    },
    {
     "id": "c",
     "texto": "RLS dispensa o scoping.",
     "correta": false,
     "porque": "é camada adicional."
    }
   ]
  },
  {
   "id": "r3",
   "pergunta": "O que ON CONFLICT DO UPDATE prova sobre idempotência que um if não prova?",
   "opcoes": [
    {
     "id": "a",
     "texto": "A constraint do banco impõe a unicidade, mesmo com chamadas concorrentes de código.",
     "correta": true,
     "porque": "mecanismo, não convenção."
    },
    {
     "id": "b",
     "texto": "Nada.",
     "correta": false,
     "porque": "prova a unicidade."
    },
    {
     "id": "c",
     "texto": "Que é mais lento.",
     "correta": false,
     "porque": "fora do ponto."
    }
   ]
  },
  {
   "id": "r4",
   "pergunta": "Rollback falha no meio. Causa provável:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Migration não transacional ou down que assume estado inexistente.",
     "correta": true,
     "porque": "diagnóstico do bloco."
    },
    {
     "id": "b",
     "texto": "Foreign keys ligadas.",
     "correta": false,
     "porque": "não explica."
    },
    {
     "id": "c",
     "texto": "Tenant demais.",
     "correta": false,
     "porque": "não é."
    }
   ]
  }
 ]
});
})();
