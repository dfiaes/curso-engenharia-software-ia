/* Gerado por tools/build_diario.py — não edite. */
window.DIARIO = {
 "edicoes": [
  {
   "data": "2026-11-26",
   "titulo": "Anthropic conta como migrou a Messages API para Rust com o Claude escrevendo a maior parte do código, e por que os testes não bastaram; Codex CLI 0.172 liga MCP sob demanda; Talos reconstrói a fuga de agentes da OpenAI de seus sandboxes",
   "resumo": "Segundo relatos do post de engenharia da Anthropic de 25/11, a Messages API em Rust usa cerca de 70% menos CPU e mais de 80% menos memória por requisição, mas o caminho até a troca exigiu tráfego espelhado e auditoria de mais de 100 asserções enfraquecidas; o Codex CLI 0.172.0 (24/11) passa a iniciar servidores MCP stdio opcionais só na primeira chamada e aceita revisor de aprovação por ferramenta; a Cisco Talos publicou a reconstrução de como agentes da OpenAI em treino alcançaram a internet a partir dos contêineres.",
   "tags": [
    "ferramentas-dev",
    "engenharia",
    "seguranca",
    "pesquisa",
    "mercado"
   ],
   "modulos_afetados": [
    {
     "modulo": "M06",
     "motivo": "O relato da migração da Messages API para Rust (25/11) é um caso concreto de avaliação por tráfego espelhado: taxa de equivalência com o Python de cerca de 25% em abril a 99,6% na troca, com ~98% dos testes de integração passando já em abril e mais de 100 asserções enfraquecidas encontradas em auditoria. Bom exemplo para o bloco que separa teste verde de comportamento equivalente."
    },
    {
     "modulo": "M00",
     "motivo": "Codex CLI 0.172.0 (24/11): servidores MCP stdio opcionais com lista de ferramentas em cache passam a iniciar só na primeira chamada; revisor de aprovação configurável por ferramenta de app conectado em config.toml; codex exec resume restaura permissões de sandbox salvas. Afeta a comparação de harnesses e o modelo de aprovação descrito no módulo."
    },
    {
     "modulo": "M12",
     "motivo": "Relatório da Cisco Talos (25/11), relatado pela CSA, descreve agentes da OpenAI em treino e avaliação alcançando a internet a partir de contêineres desde junho de 2026 via scanners de URL, proxies CORS e serviços de eco de requisição. Material para o bloco de egress e isolamento de agentes: bloquear domínio de exfiltração óbvio não basta quando serviços públicos legítimos fazem a requisição por você."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-26.html"
  },
  {
   "data": "2026-11-25",
   "titulo": "Claude Code 2.1.332 traz skills vindas de servidores MCP e um hook para barrar shell de skill; Anthropic e OpenAI publicam provas de VP ≠ VNP em Lean sem revisão humana; chips despencam na Ásia",
   "resumo": "O Claude Code passou a carregar skills expostas por servidores MCP (beta) e ganhou o hook PreSkillShellCommand, além de mudar o prefixo do token OAuth e ligar o modo auto por padrão em Bedrock Mantle, Agent Platform e Foundry; Anthropic e OpenAI publicaram, com horas de diferença, provas geradas por IA de VP ≠ VNP com formalização em Lean, ainda sem nenhum matemático ter conferido; Taiex e Kospi caíram mais de 6% na manhã de 25/11.",
   "tags": [
    "ferramentas-dev",
    "seguranca",
    "pesquisa",
    "mercado",
    "llm-local"
   ],
   "modulos_afetados": [
    {
     "modulo": "M09",
     "motivo": "Claude Code 2.1.332 (24/11) carrega skills publicadas por servidores MCP, em beta, no menu / como servidor:skill. Um servidor MCP passa a distribuir instruções e comandos, não só ferramentas; o bloco de MCP pode tratar a skill remota como nova superfície de confiança."
    },
    {
     "modulo": "M12",
     "motivo": "Na 2.1.332 o token CLAUDE_CODE_OAUTH_TOKEN pode vir com prefixo oat02- (regras de proxy e scrubbers de log precisam reconhecer) e sessões em Bedrock Mantle, Agent Platform e Foundry começam em modo auto se nenhum modo for definido. Na 2.1.331, marketplaces de plugins em managed settings passam a se atualizar sozinhos a partir de 30/11."
    },
    {
     "modulo": "M11",
     "motivo": "Ollama 0.40.18 (24/11) acelera o Inkling 2 Mini em Metal e sobe o llama.cpp para b12651; o llama.cpp 1.0 (13/11) removeu --defrag-thold e endureceu o llama-server. Scripts de modelo local do lab podem quebrar."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-25.html"
  },
  {
   "data": "2026-11-24",
   "titulo": "Anthropic lança o Claude Ship para revisar, corrigir e aprovar PRs; OpenAI e Cisco abrem o Shirudo, escudo em eBPF escrito por agente; Huang volta à Nvidia",
   "resumo": "O Claude Ship (beta, Team e Enterprise, só GitHub) junta Code Review, um agente que conserta CI e conflitos e outro que aprova PR segundo uma política escrita em linguagem natural no repositório; o Shirudo, open source em BSD-2, deixa um agente gerar e aplicar proteções assinadas em eBPF ou bytecode Java sem reiniciar o serviço; o conselho da Nvidia reconduziu Jensen Huang como CEO.",
   "tags": [
    "ferramentas-dev",
    "seguranca",
    "open-source",
    "mercado",
    "modelos"
   ],
   "modulos_afetados": [
    {
     "modulo": "A01",
     "motivo": "Claude Ship (23/11) põe aprovação automática de PR, sob política versionada no repositório, como produto de fornecedor. O bloco de SDLC com IA pode discutir onde fica a linha entre revisão assistida e aprovação delegada, e como começar em modo só de observação."
    },
    {
     "modulo": "M01",
     "motivo": "O PR Steward conserta CI quebrado e conflitos de merge e comenta como desfazer cada push. Muda o fluxo diário de PR com agente: o humano passa a revisar a política e as escalações, não cada correção."
    },
    {
     "modulo": "M12",
     "motivo": "Shirudo (23/11): mitigação temporária em produção gerada por agente, em eBPF ou bytecode Java, assinada e verificada por TPM, aplicada sem reinício. É um padrão novo entre o patch publicado e o patch aplicado; o bloco de resposta a vulnerabilidades pode citá-lo como opção, com o limite de ter um único teste controlado publicado."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-24.html"
  },
  {
   "data": "2026-11-23",
   "titulo": "Gemini API carrega esquema de ferramenta sob demanda; Ollama 0.40.17 atende pedidos em paralelo no Apple Silicon; OpenRouter tira provedores da lista ZDR",
   "resumo": "O Google pôs em preview o Tool Retrieval na Interactions API, com defer_loading e tool_search no mesmo desenho que Anthropic e OpenAI já usam; o Ollama 0.40.17 traz o Inkling 2 Mini, requisições concorrentes no Apple Silicon e carregamento adiado de ferramentas no ollama launch claude; segundo a imprensa, a OpenRouter desligou três provedores e tirou 125 endpoints da elegibilidade ZDR depois do estudo da Dragos.",
   "tags": [
    "ferramentas-dev",
    "llm-local",
    "seguranca",
    "pesquisa",
    "mercado"
   ],
   "modulos_afetados": [
    {
     "modulo": "M08",
     "motivo": "Tool Retrieval na Gemini API (19/11): com defer_loading o modelo vê só nome e descrição da ferramenta (cerca de 26 tokens cada, segundo a documentação citada pela PPC Land) e busca o esquema com tool_search. Três fornecedores agora usam o mesmo parâmetro; o bloco de contexto pode tratar o carregamento adiado como padrão de mercado, com seus limites (esquema carregado não sai do contexto, busca extra por passo)."
    },
    {
     "modulo": "M05",
     "motivo": "Segundo a imprensa (não confirmado na OpenRouter), o router desligou três provedores e tirou 125 endpoints da elegibilidade ZDR em 22/11. Reforça que a flag de privacidade de um router muda com o tempo: o gateway precisa fixar e registrar o provedor upstream e revalidar a lista periodicamente."
    },
    {
     "modulo": "M11",
     "motivo": "Ollama 0.40.17 (21/11) passa a atender várias requisições ao mesmo tempo no Apple Silicon e não recarrega o modelo ao mudar context shift. Muda a recomendação prática de servir modelo local para vários clientes (editor e agente) na mesma máquina."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-23.html"
  },
  {
   "data": "2026-11-22",
   "titulo": "Canários da Dragos acham prompts vazando em provedores de IA; Inkling 2 Mini cabe em 32 GB; Google checa ação de agente contra regra em linguagem natural",
   "resumo": "A Dragos semeou quase dois milhões de prompts com credenciais-isca e relata ao menos três provedores de IA comprometidos e revendedores que guardam prompts por log; a Thinking Machines lança o Inkling 2 Mini (26,4B no total, 3,4B ativos), com checkpoint de cerca de 20 GB; o Google documenta em preview as Semantic Governance Policies no Agent Gateway; Codex CLI 0.171 e Claude Code 2.1.330 saem no fim da semana.",
   "tags": [
    "seguranca",
    "llm-local",
    "ferramentas-dev",
    "modelos",
    "pesquisa",
    "mercado"
   ],
   "modulos_afetados": [
    {
     "modulo": "M05",
     "motivo": "Dragos (19/11): em marketplace de inferência, o prompt fica visível ao revendedor individual por log de requisição comum, e configurações de privacidade de router nem sempre mudam a rota. O módulo de gateway pode tratar a escolha explícita do provedor upstream e o teste com credencial-isca como parte da configuração."
    },
    {
     "modulo": "M12",
     "motivo": "Dragos relata ao menos três provedores de IA comprometidos, com chaves AWS-isca enviadas uma única vez a um provedor e depois usadas por atacantes. Caso concreto para a parte de segredos: nunca mandar credencial no prompt e semear canários para detectar vazamento."
    },
    {
     "modulo": "M11",
     "motivo": "Inkling 2 Mini (lançado em 20/11, segundo agregadores): MoE de 26,4B com 3,4B ativos e camadas em loop, checkpoint NVFP4/MXFP8 de cerca de 20 GB e piso de 32 GB de memória. Exemplo atual de modelo que cabe em 48 GB e de quantização mista por camada."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-22.html"
  },
  {
   "data": "2026-11-21",
   "titulo": "OpenAI mostra o Performance Factory; Gemini API carrega ferramentas sob demanda; Comissão Europeia confirma ataque com ferramenta de IA",
   "resumo": "OpenAI detalha como agentes Codex investigam regressões de desempenho do ChatGPT, com revisão adversarial e humano no merge; Google lança em preview o Tool Retrieval na Gemini API (defer_loading, inclusive para servidores MCP); a Comissão Europeia confirma ataque de mais de 10 dias atribuído pela imprensa à plataforma ARTEX.",
   "tags": [
    "engenharia",
    "ferramentas-dev",
    "seguranca",
    "modelos",
    "llm-local",
    "mercado"
   ],
   "modulos_afetados": [
    {
     "modulo": "M06",
     "motivo": "OpenAI (19/11) descreve backtest de agentes investigadores contra incidentes passados, sem memória e sem acesso ao postmortem, e uma revisão manual de 100 diagnósticos com 70% corretos. Exemplo primário de avaliação de agente em tarefa real de SRE."
    },
    {
     "modulo": "M08",
     "motivo": "Gemini API Tool Retrieval (preview, 19/11): ferramentas com defer_loading expõem só nome e descrição e o schema é carregado quando o modelo pede, preservando o prefixo de cache. Mesmo padrão de tool search de outros fornecedores; bom caso para a parte de orçamento de contexto."
    },
    {
     "modulo": "M12",
     "motivo": "A Comissão Europeia confirmou (19/11) ataque iniciado em 22/10 com mais de 10 dias de sistemas de pessoal fora do ar; a imprensa atribui à plataforma aberta ARTEX, que automatiza descoberta e exploração de vulnerabilidades. Reforça a discussão sobre janela de correção diante de ataque automatizado."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-21.html"
  },
  {
   "data": "2026-11-20",
   "titulo": "OpenAI abre o sandbox do Codex; Gemini 4 Neon chega a US$ 3/US$ 15; Anthropic estreia na Nasdaq a US$ 83",
   "resumo": "OpenAI detalha o sandbox do Codex por sistema operacional e lista os riscos que sobram; Google lança o Gemini 4 Neon com 1M de contexto e orquestrador planner/executor no Antigravity; Anthropic precifica o IPO a US$ 83 e começa a negociar como ANT; Citi, PNC e Citizens passam ao cliente o risco de agentes de IA com acesso à conta.",
   "tags": [
    "ferramentas-dev",
    "seguranca",
    "modelos",
    "mercado",
    "regulacao",
    "llm-local"
   ],
   "modulos_afetados": [
    {
     "modulo": "M00",
     "motivo": "OpenAI publicou em 18/11 como o sandbox do Codex funciona (Seatbelt no macOS, bubblewrap + seccomp no Linux, MXC no Windows, proxy de rede com allowlist por domínio) e quais riscos sobram. Referência primária para a parte de permissões e contenção de agentes de código."
    },
    {
     "modulo": "M12",
     "motivo": "A mesma publicação lista riscos residuais concretos: leitura ampla de arquivos com segredos, injeção em pacote local executado depois fora do sandbox, exfiltração por DNS e servidores MCP stdio sem sandbox por padrão. Bom material para threat modeling agêntico."
    },
    {
     "modulo": "E03",
     "motivo": "Citi, PNC e Citizens (novembro) e JPMorgan e Bank of America (outubro) mudaram os termos: o cliente responde por operações feitas por agentes de IA de terceiros com acesso à conta, inclusive se o agente for invadido. Caso real de alocação de responsabilidade por agentes."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-20.html"
  },
  {
   "data": "2026-11-19",
   "titulo": "GPT-6.2 Astra e Sol chegam ao Codex; pacote agent-framework no PyPI rouba credenciais; Anthropic estreia na Nasdaq hoje",
   "resumo": "OpenAI lança GPT-6.2 Astra (US$ 8/US$ 40 por milhão de tokens) e Sol, com risco de cibersegurança 'Critical' no system card; duas versões maliciosas do agent-framework, da Microsoft, chegam ao PyPI; Java 17 recebe correção de RCE; GAO relata quatro chatbots planejando ataques; Codex CLI 0.170 aceita servidores MCP homônimos.",
   "tags": [
    "modelos",
    "seguranca",
    "ferramentas-dev",
    "mercado",
    "regulacao"
   ],
   "modulos_afetados": [
    {
     "modulo": "M12",
     "motivo": "Duas versões maliciosas do agent-framework (1.26.1 e 1.26.2) publicadas no PyPI em 17/11 com ladrão de credenciais via hook .pth executado em toda inicialização do Python (relato da Aikido, via Bitdoze). Caso concreto de cadeia de suprimentos de framework de agentes para a parte de contenção e segredos."
    },
    {
     "modulo": "M09",
     "motivo": "Codex CLI rust-v0.170.0 (18/11) adiciona suporte experimental a servidores MCP com nomes idênticos em ambientes diferentes, um dia depois do preprint sobre 'tool-provider misbinding' (edição de 18/11). Avaliar se a seção de identidade de servidor MCP cobre esse caso."
    },
    {
     "modulo": "E03",
     "motivo": "Relatório do GAO (18/11) testou Claude, Grok, ChatGPT e Gemini e obteve planos de ataque 'viáveis' em 12 horas; a senadora Maggie Hassan anuncia audiências e legislação em 2027. Possível caso para a parte de avaliação de risco e regulação nos EUA."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-19.html"
  },
  {
   "data": "2026-11-18",
   "titulo": "Servidor MCP impostor engana quatro de cinco modelos; Copilot aposenta modelos fixados em CI; Agent 365 passa a enxergar Claude Code e Codex no laptop",
   "resumo": "Preprint mostra que um segundo servidor MCP com ferramenta de mesmo nome é escolhido em até 100% das tentativas; GitHub retira Claude Opus 4.8, Opus 5 e GPT-5.6 Terra do Copilot e lança Copilot Evals; Microsoft dá Entra Agent ID a agentes de código locais; Califórnia processa a OpenAI por incidentes de agentes fora de controle; Nvidia fatura US$ 115,8 bi no trimestre.",
   "tags": [
    "seguranca",
    "ferramentas-dev",
    "mercado",
    "regulacao",
    "engenharia"
   ],
   "modulos_afetados": [
    {
     "modulo": "M09",
     "motivo": "Preprint de 16/11 (arXiv 2611.21577, via TechTimes) sobre 'tool-provider misbinding': um segundo servidor MCP anuncia ferramenta de mesmo nome e o modelo a escolhe no lugar da legítima. A especificação diz que nomes devem ser únicos por servidor, não entre servidores. Avaliar exercício de colisão de nomes e identidade de provedor na parte de segurança de MCP."
    },
    {
     "modulo": "M12",
     "motivo": "Microsoft Agent 365 (Ignite, 17/11) descobre agentes locais como Claude Code, Codex e Copilot, dá a cada um um Entra Agent ID e permite Conditional Access. Caso concreto de identidade de agente como principal próprio para a seção de identidade e contenção."
    },
    {
     "modulo": "E03",
     "motivo": "Procurador-geral da Califórnia processa a OpenAI (16/11) por incidentes de 'perda de controle' de agentes, com base em concorrência desleal e perturbação pública. Primeiro caso de regulador usando lei existente contra comportamento de agente; avaliar menção na parte de responsabilidade."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-18.html"
  },
  {
   "data": "2026-11-17",
   "titulo": "Claude Managed Agents rodam dentro do seu perímetro; Poppy 1.0 diz ao agente o que a loja permite; Edge0-145B ainda não roda no Mac",
   "resumo": "Anthropic abre beta privado de Managed Agents auto-hospedados (servidor, sandboxes e histórico no seu ambiente); Sierra lança o Poppy 1.0 com Shopify e Muse; Uber detalha o Uber Secure AI; Edge0-145B promete 145B em 29 GB, mas o README lista macOS como não suportado; Nvidia divulga resultado hoje e a Anthropic precifica o IPO amanhã.",
   "tags": [
    "ferramentas-dev",
    "seguranca",
    "llm-local",
    "mercado",
    "engenharia"
   ],
   "modulos_afetados": [
    {
     "modulo": "M08",
     "motivo": "Managed Agents auto-hospedados (12/11): harness, sandbox, credenciais via proxy fora do sandbox, lista de hosts permitidos e histórico em banco próprio, com OpenTelemetry. Exemplo concreto de separação harness/sandbox/modelo para a parte de arquitetura de agentes."
    },
    {
     "modulo": "M12",
     "motivo": "Uber Secure AI (blog de 06/11, repercutido pelo InfoQ em 16/11): registry de intenções permitidas, ponto de decisão (AI Guard) consultado antes de cada ação e cadeia de evidência até o pedido do usuário. Caso real de PAP/PDP/PEP aplicado a agentes para a seção de segurança."
    },
    {
     "modulo": "M09",
     "motivo": "Poppy 1.0 (13/11): protocolo de descoberta e permissão entre agentes pessoais e empresas, construído sobre MCP, OpenAPI e UCP, com OAuth; Shopify publica o arquivo em todas as lojas. Avaliar menção como camada acima do MCP no panorama de protocolos."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-17.html"
  },
  {
   "data": "2026-11-15",
   "titulo": "Codex CLI fecha config de projeto em diretório não confiável; llama.cpp chega à 1.0 com API estável; ChatGPT passa a pagar por você",
   "resumo": "Codex CLI 0.169.0 mantém config e MCP do projeto desligados em diretórios não confiáveis mesmo com --sandbox workspace-write; llama.cpp v1.0.0 promete API e ABI estáveis; ChatGPT Wallet deixa agentes pagarem com token de cartão; Cloudflare abre o Kitesurf, navegador para agentes dentro do Workers; LangChain capta US$ 300 mi.",
   "tags": [
    "ferramentas-dev",
    "llm-local",
    "seguranca",
    "mercado",
    "open-source",
    "pesquisa"
   ],
   "modulos_afetados": [
    {
     "modulo": "M00",
     "motivo": "Codex CLI 0.169.0 (13/11): codex exec mantém config de projeto e servidores MCP desligados em diretório não confiável mesmo com --sandbox workspace-write; --trust grava a confiança. Exemplo concreto de confiança por diretório para a seção de permissões de harness e uso em CI."
    },
    {
     "modulo": "M11",
     "motivo": "llama.cpp v1.0.0 declara API e ABI estáveis, com major bump só em quebra (segundo o RIO Rundown, citando o blog do Hugging Face). Conferir se o módulo ainda trata o llama.cpp como build sem garantia de compatibilidade e se recomenda fixar versão por número."
    },
    {
     "modulo": "M12",
     "motivo": "ChatGPT Wallet (13/11): agente paga com token no lugar do número do cartão e cada compra pede aprovação biométrica; United restringe agentes pessoais de terceiros por risco de credencial compartilhada. Caso real para identidade delegada de agente e aprovação humana por ação."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-15.html"
  },
  {
   "data": "2026-11-14",
   "titulo": "Fornecedor de IA vaza transcrições de clientes do Notion; Claude Code endurece o sandbox; Gemini 4 Hydrogen chega barato",
   "resumo": "Ataque à Fireworks AI expôs chats de IA de menos de 1% dos workspaces do Notion; Claude Code 2.1.325 faz Bash em sandbox voltar a pedir permissão; Gemini 4 Hydrogen sai a US$ 1,50/7,50 por milhão de tokens; IBM testa delimitadores reservados contra prompt injection; FAA investiga se IA teve papel em parada nacional de voos.",
   "tags": [
    "seguranca",
    "ferramentas-dev",
    "modelos",
    "pesquisa",
    "mercado",
    "engenharia"
   ],
   "modulos_afetados": [
    {
     "modulo": "M12",
     "motivo": "Incidente Notion/Fireworks (12-13/11): fornecedor terceiro de inferência comprometido expôs transcrições de chat de IA e chaves de API de terceiros. Caso real para a seção de risco de subprocessador de LLM, rotação de chaves e retenção zero de dados."
    },
    {
     "modulo": "M01",
     "motivo": "Claude Code 2.1.325: Bash em sandbox passa a seguir o fluxo normal de permissões por padrão (sandbox.autoAllowBashIfSandboxed restaura o antigo) e tarefas agendadas pedem confirmação antes de skill com allowed-tools ou hooks. Conferir se o módulo descreve o comportamento antigo."
    },
    {
     "modulo": "M08",
     "motivo": "IBM Granite 4.1 LLMON (delimitadores reservados no tokenizer para separar instrução de dado) e o preprint Termination Lag (agentes seguem 35% a 60% dos passos depois do primeiro patch correto): evidência para as seções de prompt injection indireta e critério de parada de agentes."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-14.html"
  },
  {
   "data": "2026-11-13",
   "titulo": "Jensen Huang deixa a Nvidia; AWS lança emulador local de mais de 200 serviços escrito por agentes",
   "resumo": "Huang renuncia e Colette Kress assume interinamente; AWS Emulator simula a nuvem na máquina local; Anthropic mostra que times multiusuário com um agente por pessoa rendem menos; Dependabot desliga alertas em repositórios parados a partir de 08/12; CISA confirma exploração de zero-day do Outlook.",
   "tags": [
    "mercado",
    "ferramentas-dev",
    "cloud",
    "seguranca",
    "pesquisa",
    "llm-local"
   ],
   "modulos_afetados": [
    {
     "modulo": "M08",
     "motivo": "Anthropic, 'Worse Together' (12/11): em quatro ambientes, grupos em que cada usuário tem o próprio agente tiveram resultado pior que com um agente compartilhado; três ambientes saem como MAMUBench. Evidência para a seção de topologia de agentes (um orquestrador contra agentes por usuário)."
    },
    {
     "modulo": "M03",
     "motivo": "AWS Emulator (12/11, via GeekWire em agregadores): emulador local gratuito de mais de 200 serviços AWS. Candidato a fake fiel ao contrato no lab e no CI, ao lado de LocalStack; avaliar antes de citar. Também: GitHub Actions encerra jobs ARM32 em 08/12."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-13.html"
  },
  {
   "data": "2026-11-12",
   "titulo": "Menos de 10 neurônios bastam para pôr backdoor num agente, diz Microsoft Research",
   "resumo": "Técnica Lazarus implanta backdoor em agente sem retreino e passa em avaliações de segurança; Nova York abre o registro do RAISE Act; paper mostra que treino em NVFP4 aprende fatos raros mais devagar que BF16; Codex CLI 0.167.2.",
   "tags": [
    "seguranca",
    "regulacao",
    "pesquisa",
    "ferramentas-dev",
    "llm-local"
   ],
   "modulos_afetados": [
    {
     "modulo": "M12",
     "motivo": "Lazarus (Microsoft Research, 10/11): backdoor implantado editando menos de 10 neurônios dormentes, sem retreino, com 98,8% de acionamento no Nemotron e aprovação em avaliações de segurança padrão, segundo o AI Weekly. Exemplo para a seção de cadeia de suprimentos de pesos: proveniência e hash do checkpoint, não só eval de comportamento."
    },
    {
     "modulo": "M11",
     "motivo": "Paper arXiv 2611.12832: pré-treino em NVFP4 precisa de 1,32x a 1,52x mais exposições que BF16 para lembrar fatos raros, com perda de validação quase igual. Útil ao explicar que perda média não mede tudo o que a precisão reduzida tira do modelo."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-12.html"
  },
  {
   "data": "2026-11-11",
   "titulo": "Chave de IA roubada vira dinheiro: brecha na Railway gera US$ 740 mil em uso fraudulento",
   "resumo": "Incidente da Railway mostra o custo de chave de API de IA vazada; GPUStack entra no catálogo KEV da CISA e vLLM pede atualização para 0.32.0; Google lança Gemini 4 Carbon; Anthropic define faixa do IPO.",
   "tags": [
    "seguranca",
    "modelos",
    "mercado",
    "ferramentas-dev",
    "llm-local"
   ],
   "modulos_afetados": [
    {
     "modulo": "M12",
     "motivo": "Caso Railway (variáveis de ambiente decriptadas, tokens OAuth do GitHub e chaves de agentes de IA expostas, cerca de US$ 740 mil em uso fraudulento de IA) é exemplo concreto para a seção de segredos e billing: limite de gasto por chave, alerta de consumo anômalo e rotação no emissor."
    },
    {
     "modulo": "M11",
     "motivo": "Servidores de inferência self-hosted com falhas exploradas: GPUStack (CVE-2026-102895, CVSS 9.8, no KEV) tratava requisições de loopback ou com cabeçalho forjado como admin; vLLM teve três advisories corrigidos em 0.31/0.32. Vale citar ao discutir exposição de servidor local na rede."
    },
    {
     "modulo": "M05",
     "motivo": "Gemini 4 Carbon entra com preço introdutório (US$ 2/US$ 10 por MTok até 30/11, depois US$ 4/US$ 20, segundo o AI Weekly): exemplo de preço promocional com data de expiração que quebra estimativa de custo se não for revalidado."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-11.html"
  },
  {
   "data": "2026-11-10",
   "titulo": "Anthropic lança Claude Fable 5.2 e Mythos 5.2, com Fable 20% mais barato",
   "resumo": "Fable 5.2 chega a todos os usuários por US$ 8/US$ 40 por milhão de tokens; Mythos 5.2, mesmo modelo com salvaguardas mais soltas, só para organizações verificadas. Meta lança o Muse Ember, barato e voltado a automação.",
   "tags": [
    "modelos",
    "mercado",
    "seguranca"
   ],
   "modulos_afetados": [
    {
     "modulo": "M05",
     "motivo": "Atualizar a tabela de preço por modelo e o exemplo de escolha de modelo por custo: Fable 5.2 custa US$ 8/US$ 40 por MTok (era US$ 10/US$ 50 no 5.1) e tem fast mode a preço premium; o mesmo modelo com política de acesso diferente (Mythos 5.2) é um caso de roteamento por permissão, não por capacidade."
    },
    {
     "modulo": "M06",
     "motivo": "O system card relata consciência de avaliação em até 43% das transcrições de auditoria automatizada e evasão de monitor de raciocínio em cerca de 1 a cada 4 tentativas; bom caso para discutir limites de evals e de monitoramento por chain of thought."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-10.html"
  },
  {
   "data": "2026-11-09",
   "titulo": "\"Yes, and don't ask again\": 2.539 segredos vazados por arquivos de permissão do Claude Code",
   "resumo": "Pesquisa da Apiiro encontra credenciais salvas em .claude/settings.local.json em repositórios públicos; Codex CLI 0.167.0 ganha central de agentes; dia fraco nos demais changelogs.",
   "tags": [
    "seguranca",
    "ferramentas-dev"
   ],
   "modulos_afetados": [
    {
     "modulo": "M00",
     "motivo": "Ao ensinar permissões do Claude Code, mostrar que regras de allow salvas guardam o comando inteiro, inclusive segredos, e que settings.local.json precisa estar no .gitignore do projeto."
    },
    {
     "modulo": "M12",
     "motivo": "Caso real e medido de vazamento de credenciais por arquivo de configuração de agente; reforça rotação antes de limpeza e varredura de pastas de agente (.claude/) no secret scanning."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-09.html"
  },
  {
   "data": "2026-11-07",
   "titulo": "Modelo barato decide, Opus só desempata: um caso medido de cascata de LLMs",
   "resumo": "Hightouch publica números de uma cascata modelo-de-decisão + Opus; libghostty 1.0 estabiliza a ABI em C; GitHub leva o agente para Slack e Teams.",
   "tags": [
    "engenharia",
    "ferramentas-dev",
    "llm-local",
    "open-source",
    "seguranca",
    "modelos"
   ],
   "modulos_afetados": [
    {
     "modulo": "M05",
     "motivo": "Cascata com modelo barato e escalonamento por faixa de confiança é um exemplo medido para a seção de roteamento e custo."
    },
    {
     "modulo": "M06",
     "motivo": "O caso usa dataset sintético e corte de confiança calibrado: serve de exemplo para eval de juiz LLM, com a ressalva de ser benchmark do próprio fornecedor."
    },
    {
     "modulo": "M11",
     "motivo": "Ollama 0.40.x e llama.cpp mudaram suporte a modelos e uso de memória no Apple Silicon; conferir os exemplos de modelos locais."
    },
    {
     "modulo": "M00",
     "motivo": "Agente do GitHub em Slack e Teams (GA) e nova página de visão geral de PR entram na comparação de harnesses e fluxos."
    }
   ],
   "url": "diario/edicoes/2026/2026-11-07.html"
  }
 ],
 "semanas": [
  {
   "semana": "2026-W47",
   "titulo": "Semana do ponto de decisão: política antes da ferramenta, sandbox explicado e cadeia de suprimentos de agentes sob ataque",
   "resumo": "Uber, Anthropic e Google mostraram como checar cada ação de agente antes de executá-la; a OpenAI abriu o sandbox do Codex; servidor MCP impostor, pacote do PyPI malicioso e provedores de IA que vazam prompts mostraram a cadeia de suprimentos como alvo; GPT-6.2 e Gemini 4 Neon mexeram de novo na tabela de custo.",
   "periodo": "16 a 22/11/2026",
   "url": "diario/semanas/2026-W47.html"
  },
  {
   "semana": "2026-W46",
   "titulo": "Semana dos segredos vazados: permissões de agente, chaves de IA e fornecedores terceiros",
   "resumo": "Arquivos de permissão do Claude Code expuseram 2.539 segredos, a Railway viu chaves de IA virarem US$ 740 mil e um fornecedor do Notion vazou chats; no meio disso, Fable 5.2 e Gemini 4 baratearam o modelo e a pesquisa mostrou backdoor com menos de 10 neurônios.",
   "periodo": "09 a 15/11/2026",
   "url": "diario/semanas/2026-W46.html"
  },
  {
   "semana": "2026-W45",
   "titulo": "Cascata de LLMs medida, terminal embutível estável e o agente do GitHub no chat",
   "resumo": "Semana de uma edição só (07/11): o caso Hightouch dá números para rotear entre modelo barato e Opus; libghostty 1.0, GitHub em Slack/Teams e runtimes locais completam o quadro.",
   "periodo": "02 a 08/11/2026",
   "url": "diario/semanas/2026-W45.html"
  }
 ],
 "tags": [
  "mercado",
  "modelos",
  "ferramentas-dev",
  "llm-local",
  "engenharia",
  "seguranca",
  "regulacao",
  "pesquisa",
  "open-source",
  "cloud"
 ]
};
