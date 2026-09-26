# M12-B02-L · evidência (exemplo variável, não medição)

- python: 3.14.7 via `uv run python --version`
- comandos: `uv sync --frozen` · `ruff check .` OK · `ruff format --check .` OK
  · `mypy --strict src` OK (10 arquivos, 0 issues) · `pytest -q`
- resultado: 62 passed, 1 skipped (`test_tenancy_postgres.py`: grupo postgres
  não instalado / Docker ausente — BLOCKED, não conta como verde)
- AT-002: `tests/test_security.py` (traversal, allowlist, SSRF) +
  `tests/test_b02_bridge.py::test_at002_denies_symlink_escape_before_io`
  (symlink real fora da raiz → `SEC_PATH_OUTSIDE_WORKSPACE` antes de I/O) +
  `test_at002_denies_ssrf_variants_without_network` (10 variantes: credencial
  embutida/`http`/fora da allowlist/lit. IPv4/IPv6 privado, loopback,
  link-local, reservado, multicast, unspecified e forma inválida — só
  allowlist + `ipaddress` literal, sem DNS/resolução real)
- AT-003: `tests/test_security.py` (email/aws_key/connection_string) +
  `test_b02_bridge.py::test_at003_redacts_private_key_with_marker`
  (`[REDACTED:private_key]` + categorias) +
  `test_at003_exporter_drops_non_allowlist_and_marks_redacted`
  (`SafeSpanExporter` descarta fora da allowlist, redige e marca
  `security.outcome=redacted`; `repr` sem valor); payload codificado passa
  intacto — limite declarado, fronteira segue em schema/allowlist/minimização
- AT-004: `tests/test_runtime_telemetry.py` (enum/campo extra/ausente) +
  `test_b02_bridge.py::test_at004_rejects_unregistered_tool_before_effect`
  (`TOOL_NOT_REGISTERED`, 0 auditorias) +
  `test_at004_rejects_extra_argument_enum_and_missing_field`
  (`TOOL_ARGUMENTS_INVALID`)
- limites: DNS/egress na boundary real, payload codificado além de padrões de
  alta confiança, exporter real do Capstone, suíte PostgreSQL 18 e E2E
  pendentes (PG = BLOCKED, nunca skip verde); sem segredo real, valores de
  exemplo variável
- junit bruto: `junit.xml` neste diretório
