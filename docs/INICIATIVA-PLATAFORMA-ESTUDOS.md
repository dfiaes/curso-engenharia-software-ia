# Iniciativa futura — plataforma integrada de estudos

## Inventário read-only de 15/08/2026

- o repositório ainda não contém uma aplicação de estudos integrada, frontend ou backend a ser evoluído: o material principal está distribuído em 14 HTMLs estáticos e autossuficientes;
- os HTMLs principais não possuem scripts, formulários ou controles de estudo; somente M00, M01, M02 e M12 oferecem navegação interna por âncoras, enquanto M03–M11 e M13 permanecem sem navegação equivalente;
- não há índice global, busca, breadcrumbs, fluxo anterior/próximo, modelo canônico de conteúdo, pipeline de geração nem CSS/JavaScript compartilhado;
- os laboratórios executáveis existentes concentram-se em M00, M01, M02 e M12, além do baseline do Capstone; eles ainda não estão ligados a uma experiência única de leitura, prática e evidência;
- `PROGRESSO.md` é manual e apresenta drift editorial em relação ao currículo atual — 135 versus 152 blocos, M02 com seis versus oito blocos e ausência de M02A/LT01–LT04. Ele não será alterado durante a regeneração editorial; a futura migração precisa preservar o histórico do aluno;
- a integração de progresso existente apenas devolve um recorte de Markdown em modo leitura, e a configuração MCP local referencia caminhos externos ao repositório e uma raiz irmã diferente de `tutor-ia-codex`;
- não existem atualmente banco do aluno, autenticação, API de curso, índice de busca, gateway de IA ou política de retenção de conversas e notas.

Consequência: a futura interface será essencialmente um produto novo com migração compatível do acervo, não uma simples modernização de frontend. A revisão de código e a entrevista precisam preceder a escolha entre uma experiência local-first, híbrida ou hospedada.

**Estado:** descoberta registrada; especificação bloqueada até revisão do código e entrevista  
**Data:** 15/08/2026

## Problema observado

O curso está distribuído entre HTMLs locais, Markdown, laboratórios e conversa com IA. Isso cria fricção para:

- navegar e criar links profundos entre módulos;
- saber o que estudar agora e por quê;
- unir currículo, método, status editorial e progresso pessoal sem misturá-los;
- registrar diário, erros, ideias e evidências no contexto da leitura;
- praticar recuperação ativa e revisão espaçada;
- consultar IA durante leitura/prática com o trecho e o estado corretos;
- pesquisar o acervo e reencontrar decisões meses depois.

## Capabilities mínimas solicitadas

1. biblioteca navegável de módulos, blocos, seções e laboratórios;
2. painel de “agora”, retomada e próximos passos;
3. currículo, plano de estudo e progresso numa interface coerente;
4. diário de estudo, lista de revisão, ideias e evidências por contexto;
5. prática, checkpoint, fixação e revisão espaçada;
6. assistente de IA contextual durante leitura e laboratório;
7. pesquisa unificada e links profundos compartilháveis;
8. funcionamento simples, legível, acessível e seguro.

## Decisões que ainda não foram tomadas

Não escolher antes da entrevista:

- aplicação local-first, web hospedada ou híbrida;
- autenticação, sincronização e suporte multi-dispositivo;
- armazenamento em Markdown/Git, banco local, banco remoto ou combinação;
- provedor/modelo de IA e política de custo/privacidade;
- edição do conteúdo dentro da plataforma ou somente leitura;
- grau de automação do planejamento e da revisão espaçada;
- importação/migração dos HTMLs atuais;
- publicação privada, pública ou ambas.

## Insights iniciais a validar

- O curso precisa de um **content model** estável — módulo, bloco, competência, prática, evidência, checkpoint, fonte e anotação — antes de escolher framework.
- Conteúdo e progresso possuem ciclos de vida diferentes. Conteúdo pode ser versionado; progresso e notas pessoais precisam de escrita segura e histórico próprio.
- A IA deve receber contexto selecionado e citável, não o repositório inteiro. Respostas precisam apontar para seção/fonte e permitir transformar uma dúvida em nota, revisão ou proposta de melhoria.
- “Chat ao lado do texto” é insuficiente: a integração valiosa fecha o ciclo dúvida → resposta com fonte → nota/ideia → tarefa → evidência → revisão futura.
- Local-first pode reduzir dependência e proteger dados, mas sincronização e uso móvel podem justificar arquitetura híbrida. Isso depende dos hábitos reais do aluno.
- HTML estático pode continuar como artefato exportável, mas não deve permanecer a única interface de navegação.

## Gate antes da especificação

1. concluir inventário read-only do código e dos formatos existentes;
2. revisar os fluxos atuais de estudo, retomada, prática e consulta à IA;
3. entrevistar o aluno sobre dispositivos, rotina, privacidade, custos, edição e prioridades;
4. produzir mapa de jornadas e modelo de informação;
5. somente então escrever PRD, ADRs, arquitetura, roadmap e critérios de aceite.

## Roteiro preliminar da entrevista futura

- Onde você estuda: desktop, notebook, celular ou combinação?
- Precisa estudar offline? Quais dados podem sair da máquina?
- Como deseja marcar lido, compreendido, praticado e verificado?
- O diário é livre, estruturado ou ambos?
- Como a IA deve usar o trecho selecionado, seu código, seu histórico e fontes externas?
- Uma resposta da IA pode alterar conteúdo/progresso automaticamente ou sempre exige aprovação?
- O que precisa sincronizar entre dispositivos e o que deve permanecer local?
- Você quer editar o material na interface ou propor mudanças revisáveis no Git?
- Quais notificações/revisões ajudam e quais seriam ruído?
- Quais custos recorrentes, serviços externos e manutenção são aceitáveis?

A entrevista será refinada após o inventário. Este documento registra o problema e impede que uma solução seja escolhida cedo demais.
