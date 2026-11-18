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
 },
 {
  "id": "2026-11-11#1",
  "data": "2026-11-11",
  "pergunta": "Uma chave de API de LLM vazou numa variável de ambiente. Qual medida limita o prejuízo financeiro antes mesmo de alguém perceber o vazamento?",
  "opcoes": [
   {
    "texto": "Limite de gasto e alerta de consumo por chave no provedor",
    "correta": true
   },
   {
    "texto": "Apagar a variável de ambiente do servidor",
    "correta": false
   },
   {
    "texto": "Trocar o modelo usado pela aplicação",
    "correta": false
   }
  ],
  "porque": "Apagar o segredo do servidor não invalida a chave já copiada; só a rotação no emissor faz isso. O teto de gasto por chave limita o dano no intervalo entre o vazamento e a detecção.",
  "url": "diario/edicoes/2026/2026-11-11.html"
 },
 {
  "id": "2026-11-11#2",
  "data": "2026-11-11",
  "pergunta": "O GPUStack anterior à 2.2.0 tratava como administrador requisições vindas de loopback ou com o cabeçalho X-GPUStack-Real-IP forjado. Que princípio essa falha viola?",
  "opcoes": [
   {
    "texto": "Confiar em origem de rede ou cabeçalho controlável pelo cliente como prova de identidade",
    "correta": true
   },
   {
    "texto": "Usar HTTP em vez de gRPC",
    "correta": false
   },
   {
    "texto": "Rodar o servidor fora de contêiner",
    "correta": false
   }
  ],
  "porque": "Atrás de proxy, toda requisição pode parecer vir de loopback, e cabeçalhos são enviados pelo cliente. Autenticação precisa de credencial, não de endereço.",
  "url": "diario/edicoes/2026/2026-11-11.html"
 },
 {
  "id": "2026-11-12#1",
  "data": "2026-11-12",
  "pergunta": "Um checkpoint de terceiros passa em todas as suas avaliações de segurança. Segundo o trabalho Lazarus da Microsoft Research, o que isso deixa de garantir?",
  "opcoes": [
   {
    "texto": "Que não há um backdoor dormente acionado por um gatilho que as avaliações não exercitam",
    "correta": true
   },
   {
    "texto": "Que o modelo roda dentro do orçamento de memória",
    "correta": false
   },
   {
    "texto": "Que a licença dos pesos permite uso comercial",
    "correta": false
   }
  ],
  "porque": "O backdoor fica em poucos neurônios que só disparam com o gatilho (até uma data, no exemplo descrito). Avaliação de comportamento amostra entradas; proveniência e integridade do arquivo vêm de outra camada de controle.",
  "url": "diario/edicoes/2026/2026-11-12.html"
 },
 {
  "id": "2026-11-12#2",
  "data": "2026-11-12",
  "pergunta": "Dois modelos têm a mesma perda de validação, um treinado em BF16 e outro em NVFP4. O que o paper de Lu e Zhang recomenda medir além da perda?",
  "opcoes": [
   {
    "texto": "A recuperação de fatos raros, que pode ficar pior no de baixa precisão",
    "correta": true
   },
   {
    "texto": "Apenas a latência por token",
    "correta": false
   },
   {
    "texto": "Nada: perda igual implica conhecimento igual",
    "correta": false
   }
  ],
  "porque": "A perda é uma média dominada por padrões frequentes; fatos vistos poucas vezes pesam pouco nela e são justamente os que a precisão reduzida aprende mais devagar.",
  "url": "diario/edicoes/2026/2026-11-12.html"
 },
 {
  "id": "2026-11-13#1",
  "data": "2026-11-13",
  "pergunta": "No estudo 'Worse Together' da Anthropic, qual configuração teve resultado de grupo pior?",
  "opcoes": [
   {
    "texto": "Cada usuário com o próprio agente, todos interagindo no mesmo ambiente",
    "correta": true
   },
   {
    "texto": "Um único agente compartilhado por todos os usuários",
    "correta": false
   },
   {
    "texto": "Nenhuma diferença foi encontrada entre as configurações",
    "correta": false
   }
  ],
  "porque": "Agentes que representam usuários diferentes otimizam objetivos locais e coordenam mal entre si; o agente compartilhado enxerga o problema do grupo inteiro.",
  "url": "diario/edicoes/2026/2026-11-13.html"
 },
 {
  "id": "2026-11-13#2",
  "data": "2026-11-13",
  "pergunta": "A partir de 08/12/2026, o que acontece com os alertas do Dependabot num repositório sem atividade há mais de um ano?",
  "opcoes": [
   {
    "texto": "São desligados e os alertas existentes vão para arquivo; um push ou reativar os alertas os traz de volta",
    "correta": true
   },
   {
    "texto": "São apagados de forma permanente",
    "correta": false
   },
   {
    "texto": "Passam a abrir PRs automaticamente",
    "correta": false
   }
  ],
  "porque": "Segundo o changelog do GitHub (espelhado pelo releases.sh), os alertas são arquivados, não apagados, e voltam com atividade. Biblioteca interna estável e pouco tocada é exatamente o caso que fica sem aviso.",
  "url": "diario/edicoes/2026/2026-11-13.html"
 },
 {
  "id": "2026-11-14#1",
  "data": "2026-11-14",
  "pergunta": "No Claude Code 2.1.325, o que mudou para comandos Bash executados dentro do sandbox?",
  "opcoes": [
   {
    "texto": "Passaram a seguir o fluxo normal de permissões; sandbox.autoAllowBashIfSandboxed: true restaura a execução sem pergunta",
    "correta": true
   },
   {
    "texto": "Passaram a rodar sempre sem pedir permissão",
    "correta": false
   },
   {
    "texto": "O sandbox foi removido",
    "correta": false
   }
  ],
  "porque": "Sandbox isola o efeito, mas não substitui a decisão de executar. A versão volta a exigir aprovação por padrão e deixa a dispensa como escolha explícita.",
  "url": "diario/edicoes/2026/2026-11-14.html"
 },
 {
  "id": "2026-11-14#2",
  "data": "2026-11-14",
  "pergunta": "Qual é a ideia central do LLMON, da IBM, contra prompt injection indireta?",
  "opcoes": [
   {
    "texto": "Tokens delimitadores reservados no tokenizer marcam o que é instrução, dado e requisito",
    "correta": true
   },
   {
    "texto": "Um classificador externo bloqueia toda entrada com a palavra 'ignore'",
    "correta": false
   },
   {
    "texto": "Proibir o modelo de ler documentos externos",
    "correta": false
   }
  ],
  "porque": "Se o texto vindo de um documento nunca pode produzir o token que abre uma seção de instrução, a fronteira entre dado e comando passa a existir no nível do tokenizer, e não só no texto do prompt. A IBM diz que ataques adaptativos de vários turnos ainda estão em estudo.",
  "url": "diario/edicoes/2026/2026-11-14.html"
 },
 {
  "id": "2026-11-14#3",
  "data": "2026-11-14",
  "pergunta": "Segundo o preprint Termination Lag, o que acontece em execuções resolvidas de agentes de código no SWE-bench?",
  "opcoes": [
   {
    "texto": "Em mediana, 35% a 60% dos passos ocorrem depois do primeiro patch correto",
    "correta": true
   },
   {
    "texto": "O agente para logo no primeiro patch correto",
    "correta": false
   },
   {
    "texto": "Os passos extras sempre melhoram o patch",
    "correta": false
   }
  ],
  "porque": "Passos depois da solução custam tokens e podem estragar o que já funcionava. Critério de parada (testes verdes, orçamento de passos) é parte do projeto do agente.",
  "url": "diario/edicoes/2026/2026-11-14.html"
 },
 {
  "id": "2026-11-15#1",
  "data": "2026-11-15",
  "pergunta": "No Codex CLI 0.169.0, o que acontece ao rodar codex exec com --sandbox workspace-write num diretório ainda não confiável?",
  "opcoes": [
   {
    "texto": "Config do projeto e servidores MCP continuam desligados; --trust grava a confiança do projeto",
    "correta": true
   },
   {
    "texto": "O sandbox de escrita habilita automaticamente config e MCP do projeto",
    "correta": false
   },
   {
    "texto": "O comando falha e não executa nada",
    "correta": false
   }
  ],
  "porque": "Liberar escrita no workspace e confiar no que o repositório configura são decisões diferentes. Um repositório clonado pode trazer config ou MCP maliciosos; a confiança passa a ser explícita.",
  "url": "diario/edicoes/2026/2026-11-15.html"
 },
 {
  "id": "2026-11-15#2",
  "data": "2026-11-15",
  "pergunta": "O que muda para quem integra o llama.cpp com a versão v1.0.0?",
  "opcoes": [
   {
    "texto": "API e ABI passam a ser estáveis e um novo major indica quebra de compatibilidade",
    "correta": true
   },
   {
    "texto": "O projeto deixa de suportar Apple Silicon",
    "correta": false
   },
   {
    "texto": "Os builds numerados bNNNN deixam de existir e só há uma release por ano",
    "correta": false
   }
  ],
  "porque": "Com versionamento semântico, dá para fixar um intervalo compatível (1.x) em vez de travar num build específico e revisar a cada atualização.",
  "url": "diario/edicoes/2026/2026-11-15.html"
 },
 {
  "id": "2026-11-15#3",
  "data": "2026-11-15",
  "pergunta": "Num teste com 200 perguntas do ToolRet, como a busca BM25 se saiu contra um modelo de embedding de 8B para escolher ferramentas de agente?",
  "opcoes": [
   {
    "texto": "Empatou em acurácia e foi cerca de 40 vezes mais rápida que o BGE-large em CPU",
    "correta": true
   },
   {
    "texto": "Perdeu por larga margem em todos os tamanhos de catálogo",
    "correta": false
   },
   {
    "texto": "Venceu só quando havia menos de 10 ferramentas",
    "correta": false
   }
  ],
  "porque": "Nomes e descrições de ferramentas têm muito termo exato; busca lexical é baseline barato que precisa entrar no eval antes de você pagar por embedding.",
  "url": "diario/edicoes/2026/2026-11-15.html"
 },
 {
  "id": "2026-11-17#1",
  "data": "2026-11-17",
  "pergunta": "No beta de Managed Agents auto-hospedados da Anthropic, o que continua saindo do ambiente do cliente?",
  "opcoes": [
   {
    "texto": "Só as chamadas ao modelo, para o provedor que o cliente escolher",
    "correta": true
   },
   {
    "texto": "O histórico de sessões, que fica sempre na Anthropic",
    "correta": false
   },
   {
    "texto": "A execução das ferramentas de shell e arquivos",
    "correta": false
   }
  ],
  "porque": "Servidor, banco, workers, sandboxes e credenciais ficam no ambiente do cliente; o pedido de inferência vai para Anthropic, Bedrock, Google, Foundry ou um gateway próprio.",
  "url": "diario/edicoes/2026/2026-11-17.html"
 },
 {
  "id": "2026-11-17#2",
  "data": "2026-11-17",
  "pergunta": "No desenho do Uber Secure AI, qual componente decide se uma ação proposta pelo agente pode seguir?",
  "opcoes": [
   {
    "texto": "O AI Guard, ponto de decisão consultado pelos hooks antes da ação",
    "correta": true
   },
   {
    "texto": "O próprio LLM do agente, por autoavaliação",
    "correta": false
   },
   {
    "texto": "O registry, que executa a ação em nome do agente",
    "correta": false
   }
  ],
  "porque": "O registry guarda a política (intenções permitidas, risco); o AI Guard decide; os hooks de runtime aplicam. Separar política, decisão e aplicação evita que o agente seja juiz de si mesmo.",
  "url": "diario/edicoes/2026/2026-11-17.html"
 },
 {
  "id": "2026-11-17#3",
  "data": "2026-11-17",
  "pergunta": "Segundo o README do Edge0, o Edge0-145B roda oficialmente num MacBook com Apple Silicon?",
  "opcoes": [
   {
    "texto": "Não: macOS aparece como não suportado para o 145B; o alvo é NVIDIA com CUDA 13",
    "correta": true
   },
   {
    "texto": "Sim, via MLX, com 29 GB de memória",
    "correta": false
   },
   {
    "texto": "Sim, mas só no Ollama",
    "correta": false
   }
  ],
  "porque": "O post de lançamento cita 29 GB num MacBook Pro, mas a matriz de suporte do repositório (segundo o eesel) só cobre Linux e Windows com NVIDIA. Manchete não é matriz de suporte.",
  "url": "diario/edicoes/2026/2026-11-17.html"
 },
 {
  "id": "2026-11-18#1",
  "data": "2026-11-18",
  "pergunta": "No ataque de 'tool-provider misbinding' descrito no preprint de 16/11, o que o atacante precisa controlar?",
  "opcoes": [
   {
    "texto": "Apenas um segundo servidor MCP conectado ao mesmo cliente",
    "correta": true
   },
   {
    "texto": "O servidor MCP legítimo, para alterar a descrição da ferramenta",
    "correta": false
   },
   {
    "texto": "A rede entre o cliente e o provedor do modelo",
    "correta": false
   }
  ],
  "porque": "Basta anunciar uma ferramenta com o mesmo nome (e, idealmente, descrição copiada e esquema compatível). A especificação só pede unicidade de nome dentro de um servidor; quem desempata entre servidores é o modelo.",
  "url": "diario/edicoes/2026/2026-11-18.html"
 },
 {
  "id": "2026-11-18#2",
  "data": "2026-11-18",
  "pergunta": "O GitHub retirou do Copilot, em 16/11, Claude Opus 4.8, Claude Opus 5 e GPT-5.6 Terra. Onde isso quebra primeiro?",
  "opcoes": [
   {
    "texto": "Em workflows de agente ou CI que fixam o nome do modelo",
    "correta": true
   },
   {
    "texto": "No autocomplete do editor, que passa a ficar desligado",
    "correta": false
   },
   {
    "texto": "Em repositórios sem arquivo AGENTS.md",
    "correta": false
   }
  ],
  "porque": "Quem escolhe o modelo pela interface recebe o substituto; quem fixou o identificador em configuração ou pipeline recebe erro. Modelo é dependência com data de validade.",
  "url": "diario/edicoes/2026/2026-11-18.html"
 },
 {
  "id": "2026-11-18#3",
  "data": "2026-11-18",
  "pergunta": "Segundo o comunicado da Nvidia de 17/11, quanto da receita do 3º trimestre fiscal de 2027 veio de data center?",
  "opcoes": [
   {
    "texto": "US$ 107,6 bi de um total de US$ 115,8 bi",
    "correta": true
   },
   {
    "texto": "US$ 57,0 bi de um total de US$ 109,1 bi",
    "correta": false
   },
   {
    "texto": "US$ 130,0 bi de um total de US$ 140 bi",
    "correta": false
   }
  ],
  "porque": "Receita total de US$ 115,8 bi (+103% no ano), data center US$ 107,6 bi (+110%). US$ 130 bi é a projeção do 4º trimestre, que tem uma semana a mais.",
  "url": "diario/edicoes/2026/2026-11-18.html"
 }
];
