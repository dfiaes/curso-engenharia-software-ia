/* Gerado por tools/build_diario.py — não edite. */
window.DIARIO = {
 "edicoes": [
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
