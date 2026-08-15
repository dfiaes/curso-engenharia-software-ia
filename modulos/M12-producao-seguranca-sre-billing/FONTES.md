# Registro de fontes primárias do M12

**Baseline verificada:** 14/08/2026

Este registro separa padrões e referências agnósticas da documentação usada apenas por um adapter. Links foram reabertos na data da baseline. Mudanças de versão exigem revisão dos claims, exemplos e testes afetados.

| ID | Fonte primária | Versão/data observada | Sustenta | Escopo | Obsolescência |
|---|---|---|---|---|---|
| M12-SRC-01 | [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) | edição 2026, publicada 09/12/2025 | taxonomia ASI e threat modeling | agnóstico | média |
| M12-SRC-02 | [OWASP ASVS](https://github.com/OWASP/ASVS) | estável 5.0.0, maio/2025 | requisitos verificáveis de aplicação/API | agnóstico | média |
| M12-SRC-03 | [NIST AI 600-1](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) | publicada 26/07/2024 | gestão de risco GenAI | agnóstico | baixa |
| M12-SRC-04 | [NIST SP 800-218A](https://csrc.nist.gov/pubs/sp/800/218/a/final) | final, julho/2024 | desenvolvimento seguro de IA | agnóstico | baixa |
| M12-SRC-05 | [OAuth 2.0 Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html) | RFC 9700 / BCP 240 | segurança de authorization server/resource server | padrão aberto | baixa |
| M12-SRC-06 | [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html) | 1.0 com errata set 2 | identidade federada e claims | padrão aberto | média |
| M12-SRC-07 | [PostgreSQL 18 Row Security](https://www.postgresql.org/docs/18/ddl-rowsecurity.html) | PostgreSQL 18 | RLS, owner e bypass | tecnologia aberta de referência | média |
| M12-SRC-08 | [PostgreSQL 18 Administration Functions](https://www.postgresql.org/docs/18/functions-admin.html) | PostgreSQL 18 | `set_config` e `current_setting` | tecnologia aberta de referência | média |
| M12-SRC-09 | [Google SRE Workbook — Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/) | edição online consultada | burn rate e alertas multiwindow | referência profissional | baixa |
| M12-SRC-10 | [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/) | 1.44.0 | telemetria interoperável | padrão aberto | alta |
| M12-SRC-11 | [FinOps Unit Economics](https://www.finops.org/framework/capabilities/unit-economics/) | framework vigente em 14/08/2026 | custo por unidade e valor | fundação do setor | média |
| M12-SRC-12 | [RateLimit header fields](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/) | draft-11, Internet-Draft | panorama de headers; não tratado como RFC | work in progress | crítica |
| M12-SRC-13 | [HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) e [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585.html) | RFCs vigentes | `Retry-After` e `429` | padrão aberto | baixa |
| M12-SRC-14 | [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) e [ANPD](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes) | texto/orientações vigentes | contexto de privacidade no Brasil | fonte pública; não é parecer | média |
| M12-SRC-A01 | [Stripe Webhooks](https://docs.stripe.com/webhooks) | consultada 14/08/2026 | comportamento do adapter test-mode | fornecedor específico | alta |
| M12-SRC-A02 | [Stripe Idempotent Requests](https://docs.stripe.com/api/idempotent_requests) | consultada 14/08/2026 | comportamento do adapter test-mode | fornecedor específico | alta |
| M12-SRC-A03 | [Stripe Usage-based Billing](https://docs.stripe.com/billing/subscriptions/usage-based) | consultada 14/08/2026 | comportamento do adapter test-mode | fornecedor específico | alta |

## Regras de uso

- Fontes `M12-SRC-*` podem sustentar conceitos transversais.
- Fontes `M12-SRC-A*` sustentam somente o adapter correspondente.
- Um Internet-Draft deve continuar marcado como work in progress.
- Versão bleeding edge do ASVS não substitui a versão estável registrada.
- Nenhum texto sobre LGPD/ANPD é apresentado como aconselhamento jurídico.
- Conteúdo de modelos, SDKs e semantic conventions de alta obsolescência deve ser revisto antes de cada turma.
