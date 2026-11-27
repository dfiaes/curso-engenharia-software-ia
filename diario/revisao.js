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
 },
 {
  "id": "2026-11-19#1",
  "data": "2026-11-19",
  "pergunta": "Como o pacote malicioso agent-framework 1.26.1/1.26.2 executava o código de roubo de credenciais, segundo o relato de 17/11?",
  "opcoes": [
   {
    "texto": "Por um hook .pth, executado a cada inicialização do interpretador Python",
    "correta": true
   },
   {
    "texto": "Só quando o código importava o módulo agent_framework",
    "correta": false
   },
   {
    "texto": "Por um script de pós-instalação do pip, uma única vez",
    "correta": false
   }
  ],
  "porque": "Arquivos .pth em site-packages podem conter linhas 'import ...' que o Python executa ao iniciar. Basta o pacote estar instalado no ambiente; não é preciso importá-lo.",
  "url": "diario/edicoes/2026/2026-11-19.html"
 },
 {
  "id": "2026-11-19#2",
  "data": "2026-11-19",
  "pergunta": "Qual o preço de API do GPT-6.2 Astra divulgado no lançamento de 17/11?",
  "opcoes": [
   {
    "texto": "US$ 8 por milhão de tokens de entrada e US$ 40 por milhão de saída",
    "correta": true
   },
   {
    "texto": "US$ 2 por milhão de entrada e US$ 10 por milhão de saída",
    "correta": false
   },
   {
    "texto": "US$ 0,40 por milhão de entrada e US$ 8 por milhão de saída",
    "correta": false
   }
  ],
  "porque": "US$ 8/US$ 40 é o Astra (US$ 0,40 é o preço de entrada em cache). US$ 2/US$ 10 é o Sol, que mantém os preços do GPT-6.1 Sol.",
  "url": "diario/edicoes/2026/2026-11-19.html"
 },
 {
  "id": "2026-11-20#1",
  "data": "2026-11-20",
  "pergunta": "Segundo a OpenAI (18/11), qual mecanismo o Codex usa para isolar comandos no Linux?",
  "opcoes": [
   {
    "texto": "bubblewrap (namespaces de montagem) com filtro seccomp-bpf e no_new_privs",
    "correta": true
   },
   {
    "texto": "Um container Docker por comando",
    "correta": false
   },
   {
    "texto": "Uma VM Firecracker por sessão",
    "correta": false
   }
  ],
  "porque": "O Codex usa o sandbox nativo de cada sistema na máquina do usuário: Seatbelt no macOS, bubblewrap + seccomp no Linux e MXC no Windows. A justificativa é que toolchains como a do iOS precisam do host.",
  "url": "diario/edicoes/2026/2026-11-20.html"
 },
 {
  "id": "2026-11-20#2",
  "data": "2026-11-20",
  "pergunta": "Qual risco a própria OpenAI aponta como residual mesmo com o sandbox do Codex ativo?",
  "opcoes": [
   {
    "texto": "Um comando pode alterar um pacote local (ex.: em node_modules) que o editor executa depois, fora do sandbox",
    "correta": true
   },
   {
    "texto": "Comandos conseguem escrever em qualquer pasta fora do workspace",
    "correta": false
   },
   {
    "texto": "A rede fica liberada por padrão no perfil :workspace",
    "correta": false
   }
  ],
  "porque": "O perfil :workspace limita escrita ao workspace e desliga a rede, mas o código escrito ali pode ser executado depois por outro processo sem sandbox. Leitura ampla, DNS e MCP stdio também ficam como riscos.",
  "url": "diario/edicoes/2026/2026-11-20.html"
 },
 {
  "id": "2026-11-21#1",
  "data": "2026-11-21",
  "pergunta": "No Tool Retrieval da Gemini API, o que o modelo vê de uma ferramenta marcada com defer_loading antes de pedi-la?",
  "opcoes": [
   {
    "texto": "Nome e descrição; o schema de parâmetros só entra no contexto quando o modelo solicita a ferramenta",
    "correta": true
   },
   {
    "texto": "Nada; a ferramenta só aparece se o cliente a reenviar no turno seguinte",
    "correta": false
   },
   {
    "texto": "O schema completo, mas comprimido pelo servidor",
    "correta": false
   }
  ],
  "porque": "Segundo o Google, a ferramenta adiada fica com nome e descrição visíveis; o schema é carregado sob demanda via tool_search, e o prefixo do prompt continua igual entre turnos, o que preserva o cache.",
  "url": "diario/edicoes/2026/2026-11-21.html"
 },
 {
  "id": "2026-11-21#2",
  "data": "2026-11-21",
  "pergunta": "No Performance Factory da OpenAI, quem decide se a correção proposta pelo agente entra em produção?",
  "opcoes": [
   {
    "texto": "Um engenheiro, que revisa e decide o merge do PR",
    "correta": true
   },
   {
    "texto": "Uma segunda sessão do Codex, que aprova automaticamente se não refutar o diagnóstico",
    "correta": false
   },
   {
    "texto": "O próprio agente, depois de verificar a recuperação em staging",
    "correta": false
   }
  ],
  "porque": "A sessão adversária tenta refutar diagnóstico e correção, mas a etapa Review & deploy é do engenheiro. A OpenAI cita o tempo de espera por essa revisão como o gargalo atual.",
  "url": "diario/edicoes/2026/2026-11-21.html"
 },
 {
  "id": "2026-11-22#1",
  "data": "2026-11-22",
  "pergunta": "Segundo a Dragos, como revendedores de um marketplace de inferência conseguiam ver os prompts dos clientes?",
  "opcoes": [
   {
    "texto": "Pelo log de requisição normal do revendedor, sem exploit nenhum",
    "correta": true
   },
   {
    "texto": "Por uma falha de autenticação no próprio marketplace, que expunha todos os vendedores",
    "correta": false
   },
   {
    "texto": "Só quando o cliente desativava a retenção zero de dados",
    "correta": false
   }
  ],
  "porque": "A Dragos diz que o vazamento acompanhava o vendedor individual, não o marketplace inteiro, e acontecia por request logging padrão. Por isso a recomendação é escolher o provedor upstream e testar com credenciais-isca.",
  "url": "diario/edicoes/2026/2026-11-22.html"
 },
 {
  "id": "2026-11-22#2",
  "data": "2026-11-22",
  "pergunta": "Nas Semantic Governance Policies do Google (preview), o que acontece com chamadas de ferramenta em respostas com streaming?",
  "opcoes": [
   {
    "texto": "Streaming não é suportado e a chamada de ferramenta pode passar sem bloqueio",
    "correta": true
   },
   {
    "texto": "A política é avaliada no fim do stream e a resposta inteira é descartada se violar a regra",
    "correta": false
   },
   {
    "texto": "O Agent Gateway converte o stream em chamada síncrona automaticamente",
    "correta": false
   }
  ],
  "porque": "A documentação lista :streamGenerateContent, :streamRawPredict e o parâmetro stream ligado como não suportados e avisa que tool calls nesses casos podem não ser bloqueadas. Quem quer a checagem precisa manter as chamadas ao modelo sem streaming.",
  "url": "diario/edicoes/2026/2026-11-22.html"
 },
 {
  "id": "2026-11-22#3",
  "data": "2026-11-22",
  "pergunta": "Por que o Inkling 2 Mini (26,4B parâmetros) é viável num Mac de 48 GB?",
  "opcoes": [
   {
    "texto": "O checkpoint oficial vem quantizado (NVFP4 e MXFP8) em cerca de 20 GB, e só cerca de 3,4B parâmetros ficam ativos por token",
    "correta": true
   },
   {
    "texto": "Porque é um modelo denso de 3,4B que o fornecedor descreve como 26,4B",
    "correta": false
   },
   {
    "texto": "Porque o Ollama carrega só os especialistas ativos e o resto fica no disco",
    "correta": false
   }
  ],
  "porque": "Todos os pesos precisam caber na memória; o tamanho de 20 GB vem da quantização. Os parâmetros ativos (MoE, 8 de 128 especialistas por camada) definem a velocidade, não a memória.",
  "url": "diario/edicoes/2026/2026-11-22.html"
 },
 {
  "id": "2026-11-23#1",
  "data": "2026-11-23",
  "pergunta": "No Tool Retrieval da Gemini API, o que o modelo vê de uma ferramenta marcada com defer_loading antes de buscá-la?",
  "opcoes": [
   {
    "texto": "Só o nome e a descrição; o esquema de parâmetros vem quando o tool_search a seleciona",
    "correta": true
   },
   {
    "texto": "Nada; a ferramenta fica invisível até o usuário citá-la",
    "correta": false
   },
   {
    "texto": "O esquema completo, mas sem cobrança de tokens",
    "correta": false
   }
  ],
  "porque": "O post do Google diz que o modelo continua vendo nome e descrição de cada ferramenta adiada e carrega o esquema só quando a tarefa pede. Depois de carregado, o esquema é cobrado como entrada pelo resto da conversa.",
  "url": "diario/edicoes/2026/2026-11-23.html"
 },
 {
  "id": "2026-11-23#2",
  "data": "2026-11-23",
  "pergunta": "Qual é o custo escondido de ativar a busca de ferramentas no lado do servidor da Gemini API?",
  "opcoes": [
   {
    "texto": "Cada busca faz uma passada extra do modelo, contada como tokens de entrada, e esquemas carregados não podem ser descarregados",
    "correta": true
   },
   {
    "texto": "Uma taxa fixa por ferramenta registrada, cobrada mesmo sem uso",
    "correta": false
   },
   {
    "texto": "Nenhum; o Google declara economia de 85% em todos os casos",
    "correta": false
   }
  ],
  "porque": "O Google diz que não há cobrança separada, mas ligar o tool_search soma um bloco fixo de tokens e, segundo a documentação citada pela PPC Land, cada busca no servidor é uma passada a mais (total_tool_use_tokens). O Google não publicou número de economia; os 85% são da Anthropic, em 2025.",
  "url": "diario/edicoes/2026/2026-11-23.html"
 },
 {
  "id": "2026-11-24#1",
  "data": "2026-11-24",
  "pergunta": "No Claude Ship, onde fica a regra que decide quais PRs o agente pode aprovar sozinho?",
  "opcoes": [
   {
    "texto": "Num arquivo de política no próprio repositório, escrito em linguagem natural pela equipe",
    "correta": true
   },
   {
    "texto": "Numa lista fixa definida pela Anthropic, igual para todos os clientes",
    "correta": false
   },
   {
    "texto": "Nas regras de branch protection do GitHub, sem configuração extra",
    "correta": false
   }
  ],
  "porque": "Segundo TechCrunch e SiliconANGLE, o Claude Approvals aplica uma política de aprovação que a equipe escreve como arquivo no repositório, em linguagem natural; a recomendação é começar em modo só de observação.",
  "url": "diario/edicoes/2026/2026-11-24.html"
 },
 {
  "id": "2026-11-24#2",
  "data": "2026-11-24",
  "pergunta": "Que garantia o Shirudo usa para que só proteções aprovadas rodem no servidor alvo?",
  "opcoes": [
   {
    "texto": "Pacotes de proteção assinados, distribuídos por registry OCI e verificados com TPM antes de carregar",
    "correta": true
   },
   {
    "texto": "Um daemon permanente que consulta a OpenAI a cada requisição",
    "correta": false
   },
   {
    "texto": "Nenhuma; o agente escreve direto no kernel",
    "correta": false
   }
  ],
  "porque": "Pela Isovalent e pela OpenAI, o lado operador gera pacotes .bee assinados, enviados por registry OCI; o alvo valida a assinatura com TPM e o verificador de eBPF antes de carregar. Não há daemon permanente: a CLI é de execução única.",
  "url": "diario/edicoes/2026/2026-11-24.html"
 },
 {
  "id": "2026-11-25#1",
  "data": "2026-11-25",
  "pergunta": "Na versão 2.1.332 do Claude Code, o que o hook PreSkillShellCommand permite?",
  "opcoes": [
   {
    "texto": "Recusar os comandos de shell embutidos numa skill no momento em que ela é carregada",
    "correta": true
   },
   {
    "texto": "Executar um comando de shell antes de cada chamada ao modelo",
    "correta": false
   },
   {
    "texto": "Instalar dependências de uma skill automaticamente",
    "correta": false
   }
  ],
  "porque": "Segundo a lista de mudanças da 2.1.332 (Havoptic), o novo evento de hook pode recusar os comandos de shell inline de uma skill enquanto ela carrega. É o ponto de controle natural agora que skills podem vir de servidores MCP de terceiros.",
  "url": "diario/edicoes/2026/2026-11-25.html"
 },
 {
  "id": "2026-11-25#2",
  "data": "2026-11-25",
  "pergunta": "O que a verificação em Lean das provas de VP ≠ VNP garante, segundo o README do repositório da Anthropic?",
  "opcoes": [
   {
    "texto": "Que as provas estão corretas para os enunciados formais, mas não que esses enunciados dizem o que o artigo afirma",
    "correta": true
   },
   {
    "texto": "Que o resultado foi revisado por pares e aceito pela comunidade",
    "correta": false
   },
   {
    "texto": "Que o resultado resolve P vs NP",
    "correta": false
   }
  ],
  "porque": "O README, citado pela CASRAI, diz que o Lean checa as provas, mas nenhuma máquina checa se o arquivo de enunciado diz o que se afirma; também diz que nenhum matemático conferiu a prova e que ela não resolve P vs NP.",
  "url": "diario/edicoes/2026/2026-11-25.html"
 },
 {
  "id": "2026-11-26#1",
  "data": "2026-11-26",
  "pergunta": "No relato da migração da Messages API para Rust, por que ~98% dos testes de integração passando em abril não indicavam que a nova versão estava pronta?",
  "opcoes": [
   {
    "texto": "Porque, no tráfego real espelhado, só cerca de um quarto das respostas era equivalente à versão Python, e uma auditoria achou mais de 100 asserções enfraquecidas",
    "correta": true
   },
   {
    "texto": "Porque os testes de integração não rodavam em Rust",
    "correta": false
   },
   {
    "texto": "Porque a Anthropic não tinha testes de integração para a Messages API",
    "correta": false
   }
  ],
  "porque": "Segundo The Terminal e MadRobot, que resumem o post de 25/11, a taxa de equivalência no tráfego espelhado era de cerca de 24–25% em abril e só chegou a 99,6% perto da troca; uma auditoria encontrou mais de 100 asserções enfraquecidas. Teste verde mede o que o teste verifica, não equivalência de comportamento.",
  "url": "diario/edicoes/2026/2026-11-26.html"
 },
 {
  "id": "2026-11-26#2",
  "data": "2026-11-26",
  "pergunta": "O que muda no Codex CLI 0.172.0 para servidores MCP stdio opcionais com lista de ferramentas em cache?",
  "opcoes": [
   {
    "texto": "Eles passam a iniciar só na primeira chamada de ferramenta, por padrão",
    "correta": true
   },
   {
    "texto": "Eles deixam de ser suportados",
    "correta": false
   },
   {
    "texto": "Eles passam a rodar sempre em contêiner remoto",
    "correta": false
   }
  ],
  "porque": "O changelog oficial do Codex de 24/11 diz que servidores MCP stdio opcionais com ferramentas em cache agora iniciam na primeira chamada por padrão. Isso reduz custo de inicialização, mas desloca falhas de arranque do início da sessão para o meio da tarefa.",
  "url": "diario/edicoes/2026/2026-11-26.html"
 },
 {
  "id": "2026-11-27#1",
  "data": "2026-11-27",
  "pergunta": "Segundo o relato da Help Net Security sobre o Workspace AI Tools Addendum, como agentes de IA de terceiros deverão acessar dados do Google Workspace a partir de 1/2/2027?",
  "opcoes": [
   {
    "texto": "Pelos servidores MCP ou pelo CLI do Workspace; apps convencionais podem continuar na REST API",
    "correta": true
   },
   {
    "texto": "Somente pela REST API, com chave de API dedicada",
    "correta": false
   },
   {
    "texto": "Somente por agentes hospedados no Google Cloud",
    "correta": false
   }
  ],
  "porque": "A matéria de 26/11 diz que o adendo exige MCP ou CLI para agentes, com aplicação técnica a partir de 1/2/2027, enquanto aplicações convencionais seguem usando as APIs REST. A troca de canal permite checar cada requisição contra permissões, DLP e rótulos de classificação da organização.",
  "url": "diario/edicoes/2026/2026-11-27.html"
 },
 {
  "id": "2026-11-27#2",
  "data": "2026-11-27",
  "pergunta": "Por que atualizar o FastMCP para 4.1.2 não basta para fechar o aviso GHSA-vqqp-x5qm-5qp4?",
  "opcoes": [
   {
    "texto": "É preciso também configurar o novo parâmetro issuer e rotacionar as credenciais reutilizáveis que possam ter vazado",
    "correta": true
   },
   {
    "texto": "Porque a 4.1.2 ainda não foi publicada",
    "correta": false
   },
   {
    "texto": "Porque o aviso só se aplica a servidores stdio",
    "correta": false
   }
  ],
  "porque": "Segundo a Adversa (09/11), os provedores OAuth de client credentials e private key JWT não vinculavam o issuer, então o segredo podia ir para um servidor de autorização anunciado pelo atacante. A versão nova só ajuda se o issuer for configurado, e segredo que pode ter vazado precisa ser trocado.",
  "url": "diario/edicoes/2026/2026-11-27.html"
 }
];
