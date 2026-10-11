# M12 · Produção segura, multi-tenant, billing e SRE para sistemas de IA

> **EM PRODUÇÃO / NÃO PROMOVIDO PARA ESTUDO:** o material foi regenerado e os gates determinísticos estão verdes. Ainda falta executar a suíte PostgreSQL 18 em container e concluir G1–G6.

## Resultado do módulo

Em nove blocos e aproximadamente 18 horas, o aluno transforma o Capstone em um serviço com controles determinísticos em torno da IA, isolamento multi-tenant verificável, efeitos externos reconciliáveis, medição financeira auditável e operação orientada por SLO.

- [Material completo de estudo](M12.html)
- [Especificação e critérios de aceitação](../../docs/especificacoes/M12-ESPECIFICACAO.md)
- [Laboratório executável](lab/README.md)
- [Registro de fontes primárias verificadas](FONTES.md)

Python é a linguagem canônica. PostgreSQL 18 é a boundary real de referência para RLS. O domínio usa contratos próprios e fake determinístico; Stripe aparece somente como possível adapter test-mode, sem definir a arquitetura.

## Nove blocos

1. Threat modeling para aplicações agênticas.
2. Dados não confiáveis, secrets, PII e contenção de execução.
3. Identidade, autorização, policy-as-code e aprovação humana.
4. Multi-tenancy e RLS como propriedade verificável.
5. Idempotência durável e efeitos externos.
6. Quotas, rate limits, token budgets e circuit breaker financeiro.
7. Metering, billing e unit economics sem lock-in.
8. SRE para sistemas de IA e operação assistida.
9. Hardening, red team e checkpoint M12.

## Executar o laboratório

```powershell
cd lab
uv sync --group dev --python 3.14
uv run ruff check .
uv run mypy .
uv run pytest -m "not postgres"
```

Com Docker disponível:

```powershell
uv sync --group postgres
uv run pytest -m postgres -vv
```

Estado verificado em 14/08/2026:

- Python 3.14.7;
- Ruff: aprovado;
- mypy strict: aprovado em 12 arquivos;
- pytest determinístico: 41 aprovados;
- PostgreSQL/Testcontainers: 1 teste ignorado porque Docker não está instalado no ambiente atual.

Um `skip` de PostgreSQL é aceitável durante produção local, mas bloqueia o gate G2 e a promoção do módulo.

## Critérios editoriais medidos

- 9 blocos curriculares;
- aproximadamente 13 mil palavras visíveis;
- 28 blocos de código, SQL ou configuração;
- 27 resultados esperados observáveis;
- 15 linhas de diagnóstico;
- 14 perguntas no checkpoint;
- 24 cenários de aceitação rastreados.

## Próxima ação

Disponibilizar Docker, executar a suíte PostgreSQL 18, revisar o HTML e os links, fechar a matriz de cobertura M12-AT-001..060 e decidir G1–G6. Somente então remover o bloqueio de estudo e marcar R2.1 como concluída.
