# Diagnóstico de completude, didática e profundidade

Data: 21/09/2026. Análise solicitada pelo usuário; não é REL-06 nem certificação integral. Escopo: regras, currículo, REL-01–05 e amostragem aprofundada de M05/M06/M13 (especificações, rastreabilidade, HTML e código). Não houve reexecução das 19 suítes nem QA visual. Nenhum gate foi promovido. PROGRESSO.md preservado.

## Veredito e verificações

O curso não está completo. As 19 unidades têm artefatos relatados, mas faltam revisão técnica, integração real e fechamento editorial. REL-02 registra 1.092 testes aprovados e nove skips; a soma da tabela confere, mas essa execução é histórica. REL-01 conta 15 parciais onde sua tabela contém 16, além de M02 completo e M12/M13 bloqueados. O próprio M02 ainda requer revalidação editorial segundo o STATUS.

Executado nesta análise: `python3 tools/check_course.py` → 111 documentos, zero erros estruturais/links e 14 referências legadas. O checker não certifica fontes, acessibilidade ou execução dos labs.

## Achados reproduzidos

**A01/P1 — PRR M13 aprova ausência de evidência substantiva.** `lab/src/capstone_lab/prr.py:61` usa somente `Path.exists()`; a decisão final exige cinco eventos sem verificar recuperação. Em diretório temporário possuído, criei apenas diretórios vazios nos caminhos de PRR_CHECKLIST e invoquei o game day com callback retornando `applied=False, recovered=False`. Resultado real: dez itens aprovados, veredito GO. Corrigir com manifesto por requisito, resultado validado, identidade do artefato, bloqueios propagados e controles negativos. Os PASS históricos de B18 não comprovam prontidão.

**A02/P1 — gate M06 aceita relatório vazio.** `lab/src/eval_lab/gate.py:29` percorre apenas categorias recebidas. `decidir({'por_categoria': {}}, {'por_categoria': {'injection': 100, 'vazamento': 100}})` retornou `([], [])`, sem reprovação. Exigir schema, categorias obrigatórias, amostra e métricas válidas antes da comparação; ausência de evidência deve reprovar.

## Achados de conteúdo e evidência

**A03/P1 didático — estatística M06.** O bloco 1 afirma que 50 casos distinguem cinco pontos e 200 distinguem dois sem declarar proporção, confiança, poder ou desenho experimental; afirma que diferença dentro do ruído não existe. Não detectar diferença não demonstra equivalência. O fechamento chama concordância do juiz de margem de erro, medidas distintas. Ensinar intervalos, efeito, poder, comparação pareada, repetição estocástica e separação ajuste/avaliação; contextualizar o limiar de 85%. Testes unitários continuam necessários ao runtime e são complementados por evals. Fontes consultadas: [NIST — intervalos](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm) e [amostra](https://www.itl.nist.gov/div898/handbook/prc/section2/prc242.htm).

**A04/P1 de evidência — simulador não comprova operação integrada.** M13 `deploy.py` implementa migrations/backup sobre dicionários e health por flag. O código identifica a simulação; a rastreabilidade associa PASS a deploy/restore/game day. Isso demonstra mecanismo local, não release do produto. Os 30 CAP-* permanecem PENDENTES. Fechar API/worker/PostgreSQL, isolamento, falhas de processo, restore e rollback observáveis. Infraestrutura real pode ser local; APIs pagas opcionais não devem virar requisito obrigatório.

**A05/P2 — consolidação documental.** REL-03 atribui ao checker validação de foco, tabelas, impressão e labels que o código inspecionado não realiza. REL-04 confunde mínimos de tokens para cache de M05 com janela/saída máxima. Fonte oficial consultada para a semântica correta: [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching). Status mistura fila antiga e entregas novas. A revisão M05 chama checkpoint único de lacuna, embora a constituição exija avaliação final concentrada; cobertura importa, não multiplicação de checkpoints.

## Melhorias recomendadas

- Preservar Python, fontes primárias, mecanismos antes de frameworks, laboratório guiado, falhas, diagnóstico e ritmo livre; aplicar uniformemente.
- Explicitar pré-requisitos de programação e oferecer ponte consultável de sintaxe, terminal, Git, estruturas de dados e matemática, sem avaliação de entrada obrigatória.
- Antecipar fundamentos de M11 necessários a M05–M07 (vetores, probabilidade, sampling, generalização) com referências profundas, evitando repetição.
- Vincular competência → explicação → exemplo executado → falha → diagnóstico → transferência no checkpoint final. Copiar código prova reprodução, não autonomia.
- Substituir slogans sem método nos trechos curriculares (“chunking é 60%”, “95% do trabalho”, superlativos de contratação) por hipóteses e condições verificáveis.
- Priorizar rigor de evals/estatística, segurança de agentes/dados, sistemas distribuídos, inferência e operação. Os temas já têm owners; ampliar títulos não resolve a evidência insuficiente.
- Se a intenção incluir formação ampla em ML além de aplicações LLM, explicitar trilha de ML tabular, pipelines de dados, leakage temporal, validação, drift e serving. Esta amostragem não prova ausência desses assuntos em todo o acervo.
- Verificar didática com leitores consentidos: compreensão, retomada, diagnóstico e transferência; não fabricar ganho nem impor calendário.

Fechamento recomendado: corrigir oráculos, reconciliar status/trace, concluir integrações obrigatórias, revisar claims, realizar QA visual/acessibilidade e validar compreensão; depois executar revisão terminal. A fila operacional continua exclusivamente no STATUS.
