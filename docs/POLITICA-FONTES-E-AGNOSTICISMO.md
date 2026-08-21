# Política de fontes e agnosticismo tecnológico

**Versão:** 1.0 · **Data-base:** 14/08/2026

## 1. Princípio

O curso ensina conhecimento transferível. Nenhuma API proprietária, framework ou modelo é tratado como fundamento universal. Python é a linguagem canônica; tecnologias específicas são implementações intercambiáveis de contratos explícitos.

## 2. Hierarquia de fontes

1. **Normativa:** RFCs, PEPs, especificações abertas, padrões e documentação oficial.
2. **Científica:** artigos originais, proceedings e documentação de datasets/métodos.
3. **Canônica:** livros e material de autores reconhecidos pela contribuição ao tema.
4. **Industrial:** DORA, CNCF, GitHub, Stack Overflow e relatórios com metodologia pública.
5. **Específica de fornecedor:** somente para comportamento do produto/adaptador daquele fornecedor.
6. **Secundária:** tutoriais e blogs apenas como apoio; nunca como única evidência de uma afirmação importante.

## 3. Famílias de fontes obrigatórias

| Tema | Fontes primárias/canônicas de partida |
|---|---|
| Python | Python Language Reference, PEPs, typing specification, PyPA |
| APIs | IETF RFCs, OpenAPI, JSON Schema, AsyncAPI, CloudEvents, gRPC |
| Banco e dados | PostgreSQL, SQLAlchemy, Alembic e especificações dos formatos usados |
| Containers/plataforma | OCI, Kubernetes, OpenTelemetry, CNCF, Terraform/OpenTofu quando usados |
| Entrega e confiabilidade | DORA, Google SRE, Continuous Delivery, Resilience Engineering |
| Segurança | OWASP ASVS/API/LLM/Agentic, NIST SSDF/AI RMF, SLSA, Sigstore |
| ML/IA | papers originais, PyTorch, Hugging Face/model cards e documentação do modelo |
| Protocolos de agentes | MCP e A2A em suas especificações versionadas e fundações neutras |
| Arquitetura | autores originais dos padrões e obras canônicas, com contrapontos atuais |

## 4. Registro mínimo por fonte

Cada módulo deve manter uma seção `Fontes e versões` contendo:

- título e organização/autores;
- URL direta;
- tipo: normativa, científica, canônica, industrial ou fornecedor;
- versão/data consultada;
- bloco e afirmação sustentada;
- data de última verificação;
- risco de obsolescência: baixo, médio ou alto.

Não basta listar uma bibliografia ao final. A matriz precisa permitir descobrir qual fonte sustenta cada competência versionável.

## 5. Contrato de neutralidade

Todo componente de IA do capstone deve separar:

```text
domínio → porta Python (Protocol) → adapter → SDK/API do fornecedor
                ↓
        fake determinístico
                ↓
     suíte única de contrato/evals
```

Requisitos:

- modelos internos normalizam mensagens, uso, erros, finish reasons e tool calls;
- schemas de entrada/saída são expressos em JSON Schema quando cruzam processos;
- telemetria usa OpenTelemetry e atributos estáveis do projeto;
- retry, timeout, quota e circuit breaker ficam fora do SDK proprietário;
- prompts e datasets possuem versão independente do modelo;
- um adapter pode ser removido sem alterar regras de domínio;
- testes obrigatórios não exigem rede nem crédito de fornecedor;
- testes live são marcados e comparam pelo menos duas implementações quando o orçamento permitir;
- recursos exclusivos de fornecedor são opcionais e documentam o custo de lock-in.

## 6. Regra para frameworks

Frameworks podem reduzir trabalho mecânico, mas o módulo deve primeiro implementar ou explicar a primitiva subjacente. Para cada framework adotado, registrar:

1. problema que resolve;
2. abstração adicionada;
3. comportamento escondido;
4. formato de estado e portabilidade;
5. modo de falha;
6. estratégia de saída.

O curso não terá um “framework oficial de IA”. Haverá uma arquitetura oficial do capstone baseada em portas, adapters, contratos, evals e telemetria.

## 7. Evidência e números

- métricas de custo, qualidade, latência e produtividade devem ser medidas no laboratório;
- números ilustrativos devem estar marcados como exemplo, nunca como resultado alcançado;
- comparações de modelos exigem dataset, versão, parâmetros e ambiente registrados;
- `LLM-as-judge` não substitui conjunto humano de calibração;
- uma afirmação temporalmente instável deve registrar data de validade.

## 8. Checklist editorial

- [ ] A explicação começa pelo conceito, não por uma empresa?
- [ ] O exemplo canônico é Python e usa contratos próprios?
- [ ] Existe caminho sem o framework mostrado?
- [ ] O resultado foi medido ou está claramente identificado como exemplo?
- [ ] A fonte é primária ou a limitação da fonte secundária foi registrada?
- [ ] O conteúdo separa padrão aberto de extensão proprietária?
- [ ] O módulo informa versão e data para APIs/protocolos mutáveis?
- [ ] O exercício testa troca de adapter ou degradação da dependência?

## 9. Evidência de prática vigente

Dados de mercado ajudam a decidir quais exemplos de ferramentas e fluxos merecem aparecer no curso. Eles não definem os fundamentos nem autorizam uma recomendação universal.

- usar pesquisa com método e população declarados, relatório público de ecossistema, telemetria agregada ou estudo acadêmico/industrial reprodutível;
- registrar data de coleta/publicação, população, método e limite de generalização;
- tratar catálogo de fornecedor e contagem de repositórios como sinais parciais, nunca como medida de empregabilidade, qualidade, segurança ou custo;
- cruzar o sinal de adoção com documentação oficial antes de ensinar comportamento do produto;
- separar o que é prática generalizável do adapter citado como exemplo;
- revalidar em até 90 dias qualquer ranking, versão, preço, quota, suporte ou declaração de adoção.
