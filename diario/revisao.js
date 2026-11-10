/* Gerado por tools/build_diario.py — não edite. */
window.DIARIO_REVISAO = [
 {
  "id": "2026-11-07#1",
  "data": "2026-11-07",
  "pergunta": "Na cascata do Hightouch, o que decide quais identidades vão para o Opus?",
  "opcoes": [
   {
    "texto": "Uma faixa de confiança do modelo de decisão (por exemplo, 30–90%)",
    "correta": true
   },
   {
    "texto": "Um sorteio de 10% dos casos",
    "correta": false
   },
   {
    "texto": "O tamanho do registro de entrada",
    "correta": false
   }
  ],
  "porque": "O modelo de decisão avalia todos os casos; só os que caem na faixa de incerteza recebem segunda opinião do modelo caro.",
  "url": "diario/edicoes/2026/2026-11-07.html"
 },
 {
  "id": "2026-11-07#2",
  "data": "2026-11-07",
  "pergunta": "Qual garantia o libghostty 1.0 declara para quem o embute?",
  "opcoes": [
   {
    "texto": "Biblioteca e ABI em C estáveis, com versionamento semântico",
    "correta": true
   },
   {
    "texto": "API Rust estável e ABI em C experimental",
    "correta": false
   },
   {
    "texto": "Licença GPL com dependências copyleft",
    "correta": false
   }
  ],
  "porque": "O post afirma que a biblioteca e a ABI em C são estáveis, sob licença MIT e sem código copyleft na árvore de dependências.",
  "url": "diario/edicoes/2026/2026-11-07.html"
 },
 {
  "id": "2026-11-09#1",
  "data": "2026-11-09",
  "pergunta": "Segundo o relato da pesquisa da Apiiro, qual é a primeira resposta ao descobrir um segredo commitado em .claude/settings.local.json?",
  "opcoes": [
   {
    "texto": "Revogar e rotacionar a credencial antes de apagar o arquivo ou reescrever o histórico",
    "correta": true
   },
   {
    "texto": "Rodar git rm e forçar push para limpar o histórico",
    "correta": false
   },
   {
    "texto": "Tornar o repositório privado",
    "correta": false
   }
  ],
  "porque": "O segredo já pode ter sido copiado; apagar o arquivo não invalida a credencial. Rotação primeiro, limpeza depois.",
  "url": "diario/edicoes/2026/2026-11-09.html"
 },
 {
  "id": "2026-11-09#2",
  "data": "2026-11-09",
  "pergunta": "Por que a exclusão que o Claude Code adiciona ao gitignore global não basta?",
  "opcoes": [
   {
    "texto": "Ela não viaja com o projeto e não cobre arquivos que já estavam rastreados",
    "correta": true
   },
   {
    "texto": "Ela só funciona no Windows",
    "correta": false
   },
   {
    "texto": "Ela ignora apenas .env",
    "correta": false
   }
  ],
  "porque": "O gitignore global vale só na máquina de quem o tem; um clone em outra máquina ou um arquivo já rastreado continua sendo commitado.",
  "url": "diario/edicoes/2026/2026-11-09.html"
 },
 {
  "id": "2026-11-10#1",
  "data": "2026-11-10",
  "pergunta": "Segundo a documentação da Anthropic, o que diferencia o Claude Mythos 5.2 do Claude Fable 5.2?",
  "opcoes": [
   {
    "texto": "Mesmas especificações e preço; o acesso é restrito a organizações verificadas",
    "correta": true
   },
   {
    "texto": "O Mythos tem janela de contexto maior",
    "correta": false
   },
   {
    "texto": "O Mythos é a versão barata do Fable",
    "correta": false
   }
  ],
  "porque": "A página do Mythos 5.2 diz que ele tem as mesmas especificações e preço do Fable 5.2 e só está disponível para organizações verificadas, como no Cyber Verification Program.",
  "url": "diario/edicoes/2026/2026-11-10.html"
 },
 {
  "id": "2026-11-10#2",
  "data": "2026-11-10",
  "pergunta": "Ao migrar um workload do Fable 5.1 para o Fable 5.2, qual é o primeiro passo responsável antes de trocar o model ID em produção?",
  "opcoes": [
   {
    "texto": "Rodar a suíte de evals do seu caso de uso com os dois modelos e comparar qualidade, latência e custo",
    "correta": true
   },
   {
    "texto": "Trocar direto, já que a versão nova é sempre melhor",
    "correta": false
   },
   {
    "texto": "Ativar o fast mode para compensar qualquer regressão",
    "correta": false
   }
  ],
  "porque": "Benchmarks do fornecedor não medem o seu caso; a eval própria mostra regressões, e o fast mode dobra o preço.",
  "url": "diario/edicoes/2026/2026-11-10.html"
 }
];
