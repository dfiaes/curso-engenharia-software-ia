/* M13 · B3: Ingestão segura e job assíncrono idempotente. Fonte: M13.html#h-b3. Exemplos rotulados como exemplo não vêm do laboratório. */
(function () {
  TrilhaAula.registrar({
 "id": "m13-b3",
 "titulo": "Ingestão segura e job assíncrono idempotente",
 "minutos": 40,
 "resumo": "A request cria um job; o worker faz checkpoint por arquivo, o snapshot é endereçado por SHA-256 e a retomada não duplica.",
 "objetivo": "Explicar idempotência, cancelamento cooperativo e retomada na ingestão, e prever o efeito de um crash.",
 "abas": [
  {
   "rotulo": "Entender",
   "blocos": [
    {
     "tipo": "texto",
     "html": "<h3>Ingerir leva minutos; request não espera</h3><p>A request cria um <strong>job</strong> e devolve um id; o trabalho roda em outro contexto e o cliente consulta o estado (<strong>polling</strong>). Três requisitos não negociáveis: <strong>idempotência</strong> (repetir não duplica efeito), <strong>cancelamento cooperativo</strong> (o job verifica um flag entre unidades de trabalho) e <strong>retomada</strong> (crash no meio não força recomeço nem deixa estado impossível de reconciliar).</p>"
    },
    {
     "tipo": "texto",
     "largo": true,
     "html": "<table><thead><tr><th>Peça</th><th>Papel</th></tr></thead><tbody><tr><td><code>SnapshotStore</code></td><td>conteúdo endereçado por SHA-256; o mesmo arquivo cai no mesmo path (idempotência estrutural); escrita atômica tmp+rename</td></tr><tr><td><code>JobStore</code></td><td>estado persistido em JSON; <code>submit</code> com a mesma <code>idempotency_key</code> devolve o job existente</td></tr><tr><td>Worker</td><td>checkpoint em <code>processed</code> após cada arquivo; <code>recover_interrupted</code> devolve jobs <code>running</code> a <code>queued</code>; retry explícito limpa cancelamento anterior</td></tr><tr><td>Políticas</td><td>ignora <code>.git</code>, <code>.env*</code>, <code>__pycache__</code>; pula binário (byte nulo) e arquivo acima de 1 MB; limite total de arquivos. Segredo nunca vai para o snapshot</td></tr></tbody></table>"
    },
    {
     "tipo": "texto",
     "html": "<h3>Limite declarado</h3><p>Sem broker real neste Tier: thread de fundo e filesystem bastam para os invariantes. A fronteira (R-04) é concorrência multi-processo, onde o contrato passa a exigir lock transacional ou fila (trilha Postgres do B2). Depende de M03, LT01, LT02 e M12; artefato: <code>lab/src/capstone_lab/ingest.py</code>.</p>"
    },
    {
     "tipo": "takeaway",
     "html": "Idempotência, cancelamento e retomada nascem de <mark>checkpoint por arquivo</mark> e <mark>conteúdo endereçado por hash</mark>."
    }
   ]
  },
  {
   "rotulo": "Ver funcionando",
   "blocos": [
    {
     "tipo": "rode",
     "id": "m13b3-rode",
     "titulo": "Os oráculos de ingestão",
     "enunciado": "Seis testes do laboratório cobrem conclusão, duplicata, cancel, crash, async e limite de tamanho.",
     "prefixo": "$",
     "entrada": "uv run pytest tests/test_ingest.py -v",
     "unidade": "ms",
     "terminalTitulo": "lab",
     "etapas": [
      {
       "id": "t",
       "nome": "pytest",
       "descricao": "6 testes",
       "tom": "request",
       "ms": 40,
       "linhas": [
        {
         "kind": "cmd",
         "text": "uv run pytest tests/test_ingest.py -v"
        },
        {
         "kind": "out",
         "text": "test_ingest_concludes_and_applies_ignore_and_binary_rules PASSED"
        },
        {
         "kind": "out",
         "text": "test_resubmit_same_key_does_not_duplicate_snapshot PASSED"
        },
        {
         "kind": "out",
         "text": "test_cancel_stops_between_files_and_preserves_partial_state PASSED"
        },
        {
         "kind": "out",
         "text": "test_crash_mid_run_recovers_without_duplicate_processing PASSED"
        },
        {
         "kind": "out",
         "text": "test_run_async_does_not_block_caller PASSED"
        },
        {
         "kind": "out",
         "text": "test_file_over_size_limit_is_skipped PASSED"
        },
        {
         "kind": "out",
         "text": "6 passed"
        },
        {
         "kind": "hint",
         "text": "o teste de crash injeta exceção real após o 3º arquivo e abre um worker novo; sem sleep() fingindo trabalho"
        }
       ]
      }
     ],
     "prever": {
      "pergunta": "No teste de crash, quais arquivos o worker novo deve processar?",
      "opcoes": [
       {
        "id": "a",
        "texto": "Todos os cinco, do zero.",
        "correta": false,
        "porque": "recomeçar duplicaria trabalho."
       },
       {
        "id": "b",
        "texto": "Só o 4º e o 5º.",
        "correta": true,
        "porque": "o checkpoint guardou os três primeiros em processed."
       },
       {
        "id": "c",
        "texto": "Nenhum.",
        "correta": false,
        "porque": "o job seria abandonado."
       }
      ]
     },
     "tutorDepois": "Os três primeiros ficaram registrados; a retomada cobre só o resto."
    },
    {
     "tipo": "takeaway",
     "html": "O teste de crash usa <mark>falha real</mark> e confere que só o <mark>restante</mark> foi processado."
    }
   ]
  },
  {
   "rotulo": "Praticar",
   "blocos": [
    {
     "tipo": "ordene",
     "id": "m13b3-ord",
     "titulo": "Ordene a retomada",
     "enunciado": "Do POST ao worker novo.",
     "itens": [
      {
       "id": "rec",
       "texto": "recover_interrupted devolve running a queued"
      },
      {
       "id": "post",
       "texto": "POST /ingest com idempotency_key cria o job"
      },
      {
       "id": "crash",
       "texto": "Crash após o 3º arquivo: job fica em running"
      },
      {
       "id": "ck",
       "texto": "Worker grava no snapshot e faz checkpoint em processed"
      },
      {
       "id": "ret",
       "texto": "Worker novo retoma só o 4º e o 5º"
      }
     ],
     "solucao": [
      "post",
      "ck",
      "crash",
      "rec",
      "ret"
     ],
     "obrigatorio": true,
     "tutorDepois": "Checkpoint antes do crash, recuperação depois, retomada do resto."
    },
    {
     "tipo": "cenario",
     "id": "m13b3-cen",
     "titulo": "Snapshot duplicado após retry",
     "enunciado": "Um retry gerou snapshots duplicados. Investigue.",
     "inicio": "ini",
     "nos": {
      "ini": {
       "texto": "Após reenviar o mesmo POST, o snapshot aparece duplicado. Qual hipótese testar primeiro?",
       "opcoes": [
        {
         "texto": "A chave de idempotência ausente ou não persistida.",
         "vai": "f-bom",
         "tom": "ok",
         "consequencia": "é o diagnóstico do bloco: o submit não devolveu o job existente."
        },
        {
         "texto": "Aumentar o timeout do cliente.",
         "vai": "f-rasa",
         "tom": "ruim",
         "consequencia": "timeout não cria nem evita duplicata."
        },
        {
         "texto": "Apagar o snapshot e recomeçar.",
         "vai": "f-perde",
         "tom": "ruim",
         "consequencia": "funciona uma vez, mas perde estado parcial e não corrige a causa."
        }
       ]
      }
     },
     "finais": {
      "f-bom": {
       "texto": "Persistir a chave no JobStore e devolver o job existente: reenvio vira consulta.",
       "bom": true
      },
      "f-rasa": {
       "texto": "O sintoma volta no próximo retry.",
       "bom": false
      },
      "f-perde": {
       "texto": "Custa caro e o defeito continua.",
       "bom": false
      }
     }
    },
    {
     "tipo": "python",
     "id": "m13b3-py",
     "titulo": "Ingestão idempotente",
     "obrigatorio": false,
     "enunciado": "Complete <code>submeter</code> (mesma chave devolve o mesmo job) e o corpo do laço de <code>processar</code>: grave em <code>store</code> pelo <code>sha(conteudo)</code> e registre o checkpoint em <code>job[\"processed\"]</code>.",
     "codigo": "import hashlib\n\n\ndef sha(b):\n    return hashlib.sha256(b).hexdigest()\n\n\ndef submeter(jobs, chave):\n    \"\"\"Mesma idempotency_key devolve o job existente.\"\"\"\n    return {}\n\n\ndef processar(job, arquivos, store, crash_apos=None):\n    job[\"status\"] = \"running\"\n    for nome, conteudo in arquivos:\n        if nome in job[\"processed\"]:\n            continue\n        if crash_apos is not None and len(job[\"processed\"]) >= crash_apos:\n            raise RuntimeError(\"crash\")\n        # 1. grave o conteudo em store pela chave sha(conteudo)\n        # 2. faca o checkpoint: registre nome em job[\"processed\"]\n    job[\"status\"] = \"done\"\n\n\ndef recuperar(job):\n    if job[\"status\"] == \"running\":\n        job[\"status\"] = \"queued\"\n",
     "testes": "ARQ = [(\"a\", b\"1\"), (\"b\", b\"2\"), (\"c\", b\"3\"), (\"d\", b\"4\"), (\"e\", b\"5\")]\n\n\ndef test_mesma_chave_nao_duplica_job():\n    jobs = {}\n    assert submeter(jobs, \"k1\") is submeter(jobs, \"k1\") and len(jobs) == 1\n\n\ndef test_ingestao_completa():\n    jobs, store = {}, {}\n    j = submeter(jobs, \"k\")\n    processar(j, ARQ, store)\n    assert j[\"status\"] == \"done\" and j[\"processed\"] == [\"a\", \"b\", \"c\", \"d\", \"e\"]\n\n\ndef test_mesmo_conteudo_cai_no_mesmo_blob():\n    j, store = submeter({}, \"k\"), {}\n    processar(j, [(\"x\", b\"igual\"), (\"y\", b\"igual\")], store)\n    assert len(store) == 1 and j[\"processed\"] == [\"x\", \"y\"]\n\n\ndef test_crash_e_retomada_so_processa_o_restante():\n    j, store = submeter({}, \"k\"), {}\n    try:\n        processar(j, ARQ, store, crash_apos=3)\n    except RuntimeError:\n        pass\n    assert j[\"status\"] == \"running\" and j[\"processed\"] == [\"a\", \"b\", \"c\"]\n    recuperar(j)\n    assert j[\"status\"] == \"queued\"\n    processar(j, ARQ, store)\n    assert j[\"processed\"] == [\"a\", \"b\", \"c\", \"d\", \"e\"] and len(store) == 5\n\n\ndef test_controle_negativo_recuperar_nao_mexe_em_job_concluido():\n    j = {\"status\": \"done\", \"processed\": []}\n    recuperar(j)\n    assert j[\"status\"] == \"done\"\n",
     "dica": "Duas lacunas: <code>jobs.setdefault</code>-like em <code>submeter</code>; no laço, <code>store[sha(conteudo)] = conteudo</code> e <code>job[\"processed\"].append(nome)</code>.",
     "solucao": "import hashlib\n\n\ndef sha(b):\n    return hashlib.sha256(b).hexdigest()\n\n\ndef submeter(jobs, chave):\n    if chave not in jobs:\n        jobs[chave] = {\"status\": \"queued\", \"processed\": []}\n    return jobs[chave]\n\n\ndef processar(job, arquivos, store, crash_apos=None):\n    job[\"status\"] = \"running\"\n    for nome, conteudo in arquivos:\n        if nome in job[\"processed\"]:\n            continue\n        if crash_apos is not None and len(job[\"processed\"]) >= crash_apos:\n            raise RuntimeError(\"crash\")\n        store[sha(conteudo)] = conteudo\n        job[\"processed\"].append(nome)\n    job[\"status\"] = \"done\"\n\n\ndef recuperar(job):\n    if job[\"status\"] == \"running\":\n        job[\"status\"] = \"queued\"\n",
     "tutorDepois": "Hash como endereço e checkpoint por arquivo dão a idempotência estrutural (versão didática em memória, sem escrita atômica)."
    },
    {
     "tipo": "takeaway",
     "html": "Retomar é <mark>pular o que já tem checkpoint</mark>; gravar por hash é <mark>idempotente por construção</mark>."
    }
   ]
  },
  {
   "rotulo": "Conferir",
   "blocos": [
    {
     "tipo": "escolha",
     "id": "m13b3-e1",
     "titulo": "Confira: worker caiu",
     "pergunta": "O worker cai depois do 3º arquivo; um worker novo sobe. O que impede reprocessar e duplicar?",
     "opcoes": [
      {
       "id": "a",
       "texto": "Checkpoint em processed após cada arquivo, recover_interrupted e snapshot endereçado por SHA-256.",
       "correta": true,
       "porque": "é idempotência estrutural."
      },
      {
       "id": "b",
       "texto": "Um sleep() antes de retomar.",
       "correta": false,
       "porque": "não resolve nada."
      },
      {
       "id": "c",
       "texto": "Apagar o snapshot e recomeçar do zero.",
       "correta": false,
       "porque": "correto porém caro; perde o estado parcial."
      }
     ],
     "tutorDepois": "Estado no disco, não na memória do worker."
    },
    {
     "tipo": "escolha",
     "id": "m13b3-e2",
     "titulo": "Confira: cancel sem efeito",
     "pergunta": "O cancelamento não surte efeito. Causa provável:",
     "opcoes": [
      {
       "id": "a",
       "texto": "O flag é lido só no início, não entre arquivos.",
       "correta": true,
       "porque": "cancelamento cooperativo exige checar entre unidades."
      },
      {
       "id": "b",
       "texto": "O SHA-256 está lento.",
       "correta": false,
       "porque": "não tem relação."
      },
      {
       "id": "c",
       "texto": "O JSON está indentado.",
       "correta": false,
       "porque": "formato não importa."
      }
     ],
     "tutorDepois": "Cooperativo significa verificar entre os arquivos."
    },
    {
     "tipo": "takeaway",
     "html": "Queda e cancelamento são casos diferentes, mas ambos precisam de <mark>estado persistido</mark> entre arquivos."
    }
   ]
  }
 ],
 "revisao": [
  {
   "id": "r1",
   "pergunta": "Por que content-addressable storage torna a re-ingestão idempotente?",
   "opcoes": [
    {
     "id": "a",
     "texto": "O mesmo conteúdo gera o mesmo hash e cai no mesmo path.",
     "correta": true,
     "porque": "escrever de novo não cria cópia."
    },
    {
     "id": "b",
     "texto": "Comprime os arquivos.",
     "correta": false,
     "porque": "não é o ponto."
    },
    {
     "id": "c",
     "texto": "Bloqueia segundo POST.",
     "correta": false,
     "porque": "isso é papel da idempotency_key."
    }
   ]
  },
  {
   "id": "r2",
   "pergunta": "Job preso em running após crash:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Rodar recover_interrupted.",
     "correta": true,
     "porque": "devolve a queued."
    },
    {
     "id": "b",
     "texto": "Apagar o job.",
     "correta": false,
     "porque": "perde o checkpoint."
    },
    {
     "id": "c",
     "texto": "Esperar o timeout.",
     "correta": false,
     "porque": "não há timeout."
    }
   ]
  },
  {
   "id": "r3",
   "pergunta": "Segredo no snapshot indica:",
   "opcoes": [
    {
     "id": "a",
     "texto": "Ignore rules vazadas; o teste B3 reprova até corrigir.",
     "correta": true,
     "porque": "segredo nunca vai ao snapshot."
    },
    {
     "id": "b",
     "texto": "Comportamento normal.",
     "correta": false,
     "porque": "viola a política."
    },
    {
     "id": "c",
     "texto": "Problema do cliente.",
     "correta": false,
     "porque": "é do ingest."
    }
   ]
  },
  {
   "id": "r4",
   "pergunta": "O que muda com N processos?",
   "opcoes": [
    {
     "id": "a",
     "texto": "O contrato passa a exigir lock transacional ou fila.",
     "correta": true,
     "porque": "é a fronteira R-04."
    },
    {
     "id": "b",
     "texto": "Nada.",
     "correta": false,
     "porque": "a prova só vale para 1 processo."
    },
    {
     "id": "c",
     "texto": "O hash deixa de funcionar.",
     "correta": false,
     "porque": "o hash continua."
    }
   ]
  }
 ]
});
})();
