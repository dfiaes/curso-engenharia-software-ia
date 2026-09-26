# Instruções permanentes para agentes

Antes de auditar, criar ou alterar qualquer módulo deste curso, leia integralmente:

1. `CLAUDE.md` — constituição compartilhada do repositório e contrato de qualidade v4;
2. `docs/POLITICA-FONTES-E-AGNOSTICISMO.md` — hierarquia de fontes e neutralidade;
3. `docs/STATUS-IMPLEMENTACAO-CURSO.md` — unidade ativa, gates e bloqueios;
4. `docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md` — régua composta de autoria e revisão;
5. a especificação e a rastreabilidade do módulo em escopo.

## Regras que nunca podem ser omitidas

- Python 3.14 é a linguagem canônica. Ensinar diretamente, sem pressupor .NET ou outra stack; comparações não substituem definição, mecanismo e exemplo.
- O material atende pessoas que ainda não conhecem o assunto. Explicitar pré-requisitos e ensinar o contexto necessário no ponto de uso.
- Estudo em ritmo livre: blocos são unidades de conteúdo, nunca sessões obrigatórias. Não exigir duração, aquecimento, diário, commit ou avaliação para permitir leitura e retomada.
- O M00 é referência visual inicial, não autoridade única. O padrão obrigatório é o conjunto formado pela constituição, política de fontes, régua N1–N5, gates G0–G6, especificação/rastreabilidade e `docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md`. Uma melhoria comprovada em módulo posterior deve elevar o padrão comum e, quando relevante, voltar aos anteriores.
- Aplicar a régua de profundidade N1–N5 e os gates G0–G6 definidos em `CLAUDE.md`.
- Conceito sem decisão, execução, falha e evidência não representa formação sênior.
- Prática descrita sem laboratório executável não comprova N3.
- Código, benchmark, resultado e versão publicados precisam vir de execução real ou ser rotulados explicitamente como exemplo variável.
- Usar primeiro especificações, PEPs/RFCs, documentação oficial e papers originais. Practitioner guidance deve ser rotulada; nenhum fornecedor define sozinho o currículo.
- Separar invariante, padrão aberto e adapter de produto. Revalidar informação de alto risco em até 90 dias.
- Não esconder bloqueio com `skip`, mock irrelevante, saída simulada ou número hardcoded.
- Durante produção editorial, atualizar status/rastreabilidade, nunca `PROGRESSO.md`. Este último registra somente estudo real do aluno.
- Contribuição paralela ou de subagente só altera gate/status após revisão do orquestrador.
- Execução contínua autorizada em 24/09/2026: usar exclusivamente GPT-6 Luna (`gpt-6-luna`), inclusive revisões e REL-06; automação em high. Esta decisão substitui exceções anteriores de Sol/Astra e a parada obrigatória por cartão. Revisar em execução separada da autoria, registrar evidência, e avançar automaticamente pelos cartões elegíveis. Seguir o protocolo em `docs/BACKLOG-OPERACIONAL-V4.md`. Um pedido de parar/pausar exige marcar PAUSADA no status e pausar a automação antes de novo trabalho.
- Preservar mudanças do usuário. Labs só apagam recursos de sandbox temporário possuído; limpeza editorial só remove arquivos identificados como redundantes ou fora de escopo quando autorizada, após preservar decisões e corrigir referências.

## Unidade ativa

Consulte sempre `docs/STATUS-IMPLEMENTACAO-CURSO.md`; este é o único registro da prioridade operacional. Não duplicar a fila aqui nem deduzi-la pela numeração dos módulos.

## Contexto focal e apêndice opcional — 21/09/2026

- ML01–ML07 são apêndice opcional. Não bloquear leitura, estudo ou release principal por sua ausência ou pendências; não introduzir dependências do principal para módulos ML opcionais.
- Priorizar profundidade da explicação e laboratório mínimo suficiente. Não adicionar serviços/frameworks para parecer avançado; não reduzir mecanismo, decisão, falha ou honestidade da evidência.
- Após as leituras obrigatórias acima, carregar somente o cartão da tarefa (`python3 tools/backlog_tasks.py --task ID --prompt`), os arquivos locais em escopo e a especificação transversal indicada no cartão.
- `docs/historico/` não é contexto padrão nem fonte de ordens atuais. Consultar documento histórico específico apenas para reconstruir evidência/decisão referenciada.
- Não ler todo `docs/`, todo o catálogo JSON ou todos os módulos para executar uma tarefa focal. `--bundle` reúne leituras do cartão quando necessário; ainda deve respeitar o escopo.
