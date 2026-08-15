# Nova prioridade — M00, M01, M02 e engenharia de software sênior 2026

**Definida em:** 14/08/2026 · **Última revisão:** 15/08/2026 · **Ordem:** após o lote R2.2-A do M13

## Decisão

1. Auditar e melhorar M00. **EM REVISÃO — conteúdo e lab produzidos.**
2. Auditar e melhorar M01. **VERIFICADO; G0–G6 APROVADOS; apresentação alinhada ao M00.**
3. Auditar e melhorar M02. **VERIFICADO; G0–G6 APROVADOS; 51 testes em Windows/3.14t/Linux; 38 AT verificados.**
4. Produzir **M02A · Engenharia de Software Sênior em 2026**. **G0 APROVADO; G1 em produção; G2–G6 pendentes.**
5. Retomar M12/M13 e os demais marcos com os bloqueios já registrados.

M02A tem 15 blocos/30h aprovados em G0. Com a ampliação do M02 de 12h para 16h e a inclusão formal do M02A, o currículo-base passa a **152 blocos/304h**. Python 3.14 é canônico; .NET 10/C# moderno aparece somente num corte vertical comparativo necessário à transferência profissional. Conceitos, arquitetura e critérios permanecem agnósticos.

## Baseline da auditoria

| Módulo | Palavras | Blocos de código | Resultados observáveis | Links externos | Prioridade |
|---|---:|---:|---:|---:|---|
| M00 | 2.968 | 10 | 0 | 4 | P0 — aprofundar, neutralizar e executar |
| M01 | 9.167 | 18 | 21 | 20 no HTML / 14 destinos | CONCLUÍDO — G0–G6 verificados |
| M02 | 9.060 | 36 | 8 callouts de resultado | 20 destinos | CONCLUÍDO — G0–G6 e 38 AT verificados |

## Auditoria de profundidade

A régua N1–N5 e o backlog de M01–M13 estão em `docs/AUDITORIA-APROFUNDAMENTO-M01-M13.md`. A decisão central é: prática descrita sem código e saída executados não comprova implementação. M01 atingiu N4 nas competências centrais; M02 comprovou N4 e transferência N5 no próprio escopo, com portabilidade e gate visual fechados.

## M02A · quinze blocos aprovados em G0

1. Papel sênior em 2026: produto, risco, sistemas sociotécnicos e decisão por evidência.
2. Requisitos, especificações, ADRs, RFCs, C4 e arquitetura evolutiva.
3. Coesão, acoplamento, modularidade, SOLID com crítica, DDD e arquitetura hexagonal.
4. Contratos de API/eventos, compatibilidade, versionamento e integração.
5. Modelagem de dados, transações, índices, concorrência e evolução de schema.
6. Processos, memória, I/O, threads, async, paralelismo e backpressure.
7. Sistemas distribuídos: tempo, falhas parciais, consistência, filas, idempotência e sagas.
8. Estratégia de testes: unitário, integração, contrato, propriedade, mutação, carga e E2E.
9. Secure SDLC, threat modeling, ASVS, secrets, privacidade e supply chain/SLSA.
10. Observabilidade, OpenTelemetry, SLI/SLO, incidentes, runbooks e postmortems.
11. Complexidade, estruturas de dados, performance, profiling, capacidade, caching e custo.
12. Git, modernização incremental de legado e entrega: change seams, strangler, expand-contract, CI/CD, flags e rollback.
13. Python 3.14 sênior: runtime, typing, packaging, concorrência, profiling e interoperabilidade.
14. .NET 10/C# moderno: runtime, async, DI, hosting, observabilidade e ponte conceitual com Python.
15. Engenharia AI-native: uso responsável de agentes, evals, revisão, governança, liderança e projeto comparativo final.

## Prática obrigatória

- implementar o produto completo em Python e somente uma capability pequena em .NET, comparando contratos, concorrência, DI, testes, telemetria e publicação;
- produzir design doc, ADRs e threat model antes do código;
- executar falhas locais determinísticas de SQLite, fila bounded e dependência probabilística fake; banco, broker e rede reais permanecem em M03/LT01/LT02;
- criar suíte de testes em camadas, incluindo contrato e mutation/property test;
- medir latência, throughput, saturação, custo e qualidade;
- conduzir code review assistido por IA com defeitos semeados;
- executar incidente, rollback e postmortem;
- defender trade-offs sem apelar para framework ou fornecedor.

## Fontes-base já confirmadas

- [Python 3.14](https://docs.python.org/3.14/whatsnew/3.14.html), release estável de 07/10/2025;
- [.NET 10](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/overview), documentação oficial para a ponte específica;
- [DORA 2025](https://dora.dev/research/2025/dora-report/) para entrega assistida por IA;
- [NIST SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final), [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/) e [SLSA 1.2](https://slsa.dev/spec/v1.2/);
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/), [C4 Model](https://c4model.com/) e [Google SRE Books](https://sre.google/books/).

A especificação G0 acrescenta fontes primárias/canônicas de dados, sistemas distribuídos, testing, arquitetura, FinOps, segurança, supply chain e engenharia de IA, com versão/data e risco de obsolescência: [`docs/especificacoes/M02A-ESPECIFICACAO.md`](especificacoes/M02A-ESPECIFICACAO.md).
