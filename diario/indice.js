/* Gerado por tools/build_diario.py — não edite. */
window.DIARIO = {
 "edicoes": [
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
