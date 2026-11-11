# Fila de revisão mensal

Gerada por `tools/build_diario.py` a partir de `modulos_afetados` das edições ainda não tratadas. Para dar uma edição como tratada, acrescente a data em `diario/revisao-tratadas.txt`.

## M00

- [2026-11-07](edicoes/2026/2026-11-07.html) (Modelo barato decide, Opus só desempata: um caso medido de cascata de LLMs): Agente do GitHub em Slack e Teams (GA) e nova página de visão geral de PR entram na comparação de harnesses e fluxos.
- [2026-11-09](edicoes/2026/2026-11-09.html) ("Yes, and don't ask again": 2.539 segredos vazados por arquivos de permissão do Claude Code): Ao ensinar permissões do Claude Code, mostrar que regras de allow salvas guardam o comando inteiro, inclusive segredos, e que settings.local.json precisa estar no .gitignore do projeto.

## M05

- [2026-11-07](edicoes/2026/2026-11-07.html) (Modelo barato decide, Opus só desempata: um caso medido de cascata de LLMs): Cascata com modelo barato e escalonamento por faixa de confiança é um exemplo medido para a seção de roteamento e custo.
- [2026-11-10](edicoes/2026/2026-11-10.html) (Anthropic lança Claude Fable 5.2 e Mythos 5.2, com Fable 20% mais barato): Atualizar a tabela de preço por modelo e o exemplo de escolha de modelo por custo: Fable 5.2 custa US$ 8/US$ 40 por MTok (era US$ 10/US$ 50 no 5.1) e tem fast mode a preço premium; o mesmo modelo com política de acesso diferente (Mythos 5.2) é um caso de roteamento por permissão, não por capacidade.
- [2026-11-11](edicoes/2026/2026-11-11.html) (Chave de IA roubada vira dinheiro: brecha na Railway gera US$ 740 mil em uso fraudulento): Gemini 4 Carbon entra com preço introdutório (US$ 2/US$ 10 por MTok até 30/11, depois US$ 4/US$ 20, segundo o AI Weekly): exemplo de preço promocional com data de expiração que quebra estimativa de custo se não for revalidado.

## M06

- [2026-11-07](edicoes/2026/2026-11-07.html) (Modelo barato decide, Opus só desempata: um caso medido de cascata de LLMs): O caso usa dataset sintético e corte de confiança calibrado: serve de exemplo para eval de juiz LLM, com a ressalva de ser benchmark do próprio fornecedor.
- [2026-11-10](edicoes/2026/2026-11-10.html) (Anthropic lança Claude Fable 5.2 e Mythos 5.2, com Fable 20% mais barato): O system card relata consciência de avaliação em até 43% das transcrições de auditoria automatizada e evasão de monitor de raciocínio em cerca de 1 a cada 4 tentativas; bom caso para discutir limites de evals e de monitoramento por chain of thought.

## M11

- [2026-11-07](edicoes/2026/2026-11-07.html) (Modelo barato decide, Opus só desempata: um caso medido de cascata de LLMs): Ollama 0.40.x e llama.cpp mudaram suporte a modelos e uso de memória no Apple Silicon; conferir os exemplos de modelos locais.
- [2026-11-11](edicoes/2026/2026-11-11.html) (Chave de IA roubada vira dinheiro: brecha na Railway gera US$ 740 mil em uso fraudulento): Servidores de inferência self-hosted com falhas exploradas: GPUStack (CVE-2026-102895, CVSS 9.8, no KEV) tratava requisições de loopback ou com cabeçalho forjado como admin; vLLM teve três advisories corrigidos em 0.31/0.32. Vale citar ao discutir exposição de servidor local na rede.

## M12

- [2026-11-09](edicoes/2026/2026-11-09.html) ("Yes, and don't ask again": 2.539 segredos vazados por arquivos de permissão do Claude Code): Caso real e medido de vazamento de credenciais por arquivo de configuração de agente; reforça rotação antes de limpeza e varredura de pastas de agente (.claude/) no secret scanning.
- [2026-11-11](edicoes/2026/2026-11-11.html) (Chave de IA roubada vira dinheiro: brecha na Railway gera US$ 740 mil em uso fraudulento): Caso Railway (variáveis de ambiente decriptadas, tokens OAuth do GitHub e chaves de agentes de IA expostas, cerca de US$ 740 mil em uso fraudulento de IA) é exemplo concreto para a seção de segredos e billing: limite de gasto por chave, alerta de consumo anômalo e rotação no emissor.
