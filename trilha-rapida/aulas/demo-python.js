/* Aula escondida (fora de aulas/indice.js): demonstra o exercício `python` (Pyodide). Acesso: TR.html#aula=demo-python */
TrilhaAula.registrar({
  id: 'demo-python', escondida: true, titulo: 'Demo: Python no navegador', minutos: 5,
  resumo: 'Código real rodando na própria página, com testes. O interpretador (cerca de 10 MB) só baixa no primeiro Rodar.',
  abas: [{ rotulo: 'Exercício', blocos: [
    { tipo: 'texto', html: '<p>Um <strong>slug</strong> é o pedaço de texto que vai na URL: minúsculas, sem acento e com hífen no lugar dos espaços. Escreva <code>slugify</code> e aperte <strong>Testar</strong>.</p>' },
    { tipo: 'python', id: 'demo-slugify', titulo: 'Escreva slugify',
      enunciado: 'Complete a função <code>slugify(texto)</code>: minúsculas, sem acentos, e qualquer sequência de caracteres que não seja letra ou número vira um único hífen, sem hífen nas pontas.',
      codigo: 'import re\nimport unicodedata\n\n\ndef slugify(texto):\n    # 1. tire os acentos  2. minúsculas  3. troque o que não é letra/número por "-"\n    return texto\n\n\nprint(slugify("Olá, Mundo!"))\n',
      testes: 'def test_minusculas():\n    assert slugify("Ola") == "ola"\n\n\ndef test_espacos_viram_hifen():\n    assert slugify("meu primeiro post") == "meu-primeiro-post"\n\n\ndef test_acentos():\n    assert slugify("Ação rápida") == "acao-rapida"\n\n\ndef test_pontas_e_repeticoes():\n    assert slugify("  Olá,   Mundo!  ") == "ola-mundo"\n',
      dica: 'Normalize com <code>unicodedata.normalize("NFKD", texto)</code> e descarte o que não é ASCII com <code>.encode("ascii", "ignore").decode()</code>. Depois use <code>re.sub(r"[^a-z0-9]+", "-", ...)</code> e <code>.strip("-")</code>.',
      solucao: 'import re\nimport unicodedata\n\n\ndef slugify(texto):\n    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()\n    return re.sub(r"[^a-z0-9]+", "-", sem_acento.lower()).strip("-")\n',
      tutorDepois: 'Quatro testes passando: acento, caixa, repetição e pontas.',
      callout: 'slugify passou nos quatro testes.' },
    { tipo: 'takeaway', html: 'Um exercício de código vale quando <mark>os testes</mark> dizem se você acertou, não a sua <mark>impressão</mark>.' }
  ] }]
});
