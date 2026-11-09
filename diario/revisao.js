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
 }
];
