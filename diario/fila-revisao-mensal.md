# Fila de revisão mensal

Gerada por `tools/build_diario.py` a partir de `modulos_afetados` das edições ainda não tratadas. Para dar uma edição como tratada, acrescente a data em `diario/revisao-tratadas.txt`.

## M00

- [2026-11-07](edicoes/2026/2026-11-07.html) (Modelo barato decide, Opus só desempata: um caso medido de cascata de LLMs): Agente do GitHub em Slack e Teams (GA) e nova página de visão geral de PR entram na comparação de harnesses e fluxos.
- [2026-11-09](edicoes/2026/2026-11-09.html) ("Yes, and don't ask again": 2.539 segredos vazados por arquivos de permissão do Claude Code): Ao ensinar permissões do Claude Code, mostrar que regras de allow salvas guardam o comando inteiro, inclusive segredos, e que settings.local.json precisa estar no .gitignore do projeto.

## M01

- [2026-11-14](edicoes/2026/2026-11-14.html) (Fornecedor de IA vaza transcrições de clientes do Notion; Claude Code endurece o sandbox; Gemini 4 Hydrogen chega barato): Claude Code 2.1.325: Bash em sandbox passa a seguir o fluxo normal de permissões por padrão (sandbox.autoAllowBashIfSandboxed restaura o antigo) e tarefas agendadas pedem confirmação antes de skill com allowed-tools ou hooks. Conferir se o módulo descreve o comportamento antigo.

## M03

- [2026-11-13](edicoes/2026/2026-11-13.html) (Jensen Huang deixa a Nvidia; AWS lança emulador local de mais de 200 serviços escrito por agentes): AWS Emulator (12/11, via GeekWire em agregadores): emulador local gratuito de mais de 200 serviços AWS. Candidato a fake fiel ao contrato no lab e no CI, ao lado de LocalStack; avaliar antes de citar. Também: GitHub Actions encerra jobs ARM32 em 08/12.

## M05

- [2026-11-07](edicoes/2026/2026-11-07.html) (Modelo barato decide, Opus só desempata: um caso medido de cascata de LLMs): Cascata com modelo barato e escalonamento por faixa de confiança é um exemplo medido para a seção de roteamento e custo.
- [2026-11-10](edicoes/2026/2026-11-10.html) (Anthropic lança Claude Fable 5.2 e Mythos 5.2, com Fable 20% mais barato): Atualizar a tabela de preço por modelo e o exemplo de escolha de modelo por custo: Fable 5.2 custa US$ 8/US$ 40 por MTok (era US$ 10/US$ 50 no 5.1) e tem fast mode a preço premium; o mesmo modelo com política de acesso diferente (Mythos 5.2) é um caso de roteamento por permissão, não por capacidade.
- [2026-11-11](edicoes/2026/2026-11-11.html) (Chave de IA roubada vira dinheiro: brecha na Railway gera US$ 740 mil em uso fraudulento): Gemini 4 Carbon entra com preço introdutório (US$ 2/US$ 10 por MTok até 30/11, depois US$ 4/US$ 20, segundo o AI Weekly): exemplo de preço promocional com data de expiração que quebra estimativa de custo se não for revalidado.

## M06

- [2026-11-07](edicoes/2026/2026-11-07.html) (Modelo barato decide, Opus só desempata: um caso medido de cascata de LLMs): O caso usa dataset sintético e corte de confiança calibrado: serve de exemplo para eval de juiz LLM, com a ressalva de ser benchmark do próprio fornecedor.
- [2026-11-10](edicoes/2026/2026-11-10.html) (Anthropic lança Claude Fable 5.2 e Mythos 5.2, com Fable 20% mais barato): O system card relata consciência de avaliação em até 43% das transcrições de auditoria automatizada e evasão de monitor de raciocínio em cerca de 1 a cada 4 tentativas; bom caso para discutir limites de evals e de monitoramento por chain of thought.

## M08

- [2026-11-13](edicoes/2026/2026-11-13.html) (Jensen Huang deixa a Nvidia; AWS lança emulador local de mais de 200 serviços escrito por agentes): Anthropic, 'Worse Together' (12/11): em quatro ambientes, grupos em que cada usuário tem o próprio agente tiveram resultado pior que com um agente compartilhado; três ambientes saem como MAMUBench. Evidência para a seção de topologia de agentes (um orquestrador contra agentes por usuário).
- [2026-11-14](edicoes/2026/2026-11-14.html) (Fornecedor de IA vaza transcrições de clientes do Notion; Claude Code endurece o sandbox; Gemini 4 Hydrogen chega barato): IBM Granite 4.1 LLMON (delimitadores reservados no tokenizer para separar instrução de dado) e o preprint Termination Lag (agentes seguem 35% a 60% dos passos depois do primeiro patch correto): evidência para as seções de prompt injection indireta e critério de parada de agentes.

## M11

- [2026-11-07](edicoes/2026/2026-11-07.html) (Modelo barato decide, Opus só desempata: um caso medido de cascata de LLMs): Ollama 0.40.x e llama.cpp mudaram suporte a modelos e uso de memória no Apple Silicon; conferir os exemplos de modelos locais.
- [2026-11-11](edicoes/2026/2026-11-11.html) (Chave de IA roubada vira dinheiro: brecha na Railway gera US$ 740 mil em uso fraudulento): Servidores de inferência self-hosted com falhas exploradas: GPUStack (CVE-2026-102895, CVSS 9.8, no KEV) tratava requisições de loopback ou com cabeçalho forjado como admin; vLLM teve três advisories corrigidos em 0.31/0.32. Vale citar ao discutir exposição de servidor local na rede.
- [2026-11-12](edicoes/2026/2026-11-12.html) (Menos de 10 neurônios bastam para pôr backdoor num agente, diz Microsoft Research): Paper arXiv 2611.12832: pré-treino em NVFP4 precisa de 1,32x a 1,52x mais exposições que BF16 para lembrar fatos raros, com perda de validação quase igual. Útil ao explicar que perda média não mede tudo o que a precisão reduzida tira do modelo.

## M12

- [2026-11-09](edicoes/2026/2026-11-09.html) ("Yes, and don't ask again": 2.539 segredos vazados por arquivos de permissão do Claude Code): Caso real e medido de vazamento de credenciais por arquivo de configuração de agente; reforça rotação antes de limpeza e varredura de pastas de agente (.claude/) no secret scanning.
- [2026-11-11](edicoes/2026/2026-11-11.html) (Chave de IA roubada vira dinheiro: brecha na Railway gera US$ 740 mil em uso fraudulento): Caso Railway (variáveis de ambiente decriptadas, tokens OAuth do GitHub e chaves de agentes de IA expostas, cerca de US$ 740 mil em uso fraudulento de IA) é exemplo concreto para a seção de segredos e billing: limite de gasto por chave, alerta de consumo anômalo e rotação no emissor.
- [2026-11-12](edicoes/2026/2026-11-12.html) (Menos de 10 neurônios bastam para pôr backdoor num agente, diz Microsoft Research): Lazarus (Microsoft Research, 10/11): backdoor implantado editando menos de 10 neurônios dormentes, sem retreino, com 98,8% de acionamento no Nemotron e aprovação em avaliações de segurança padrão, segundo o AI Weekly. Exemplo para a seção de cadeia de suprimentos de pesos: proveniência e hash do checkpoint, não só eval de comportamento.
- [2026-11-14](edicoes/2026/2026-11-14.html) (Fornecedor de IA vaza transcrições de clientes do Notion; Claude Code endurece o sandbox; Gemini 4 Hydrogen chega barato): Incidente Notion/Fireworks (12-13/11): fornecedor terceiro de inferência comprometido expôs transcrições de chat de IA e chaves de API de terceiros. Caso real para a seção de risco de subprocessador de LLM, rotação de chaves e retenção zero de dados.
