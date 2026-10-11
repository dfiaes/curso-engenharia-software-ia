# P01 lab: deploying an LLM service to Azure, checked offline

- `src/llm_service`: FastAPI service (health, readiness, `/v1/complete`, SSE `/v1/stream`), a fake LLM
  by default and a keyless Azure OpenAI adapter (Entra ID bearer token, no API key).
- `Dockerfile`, `infra/main.bicep`, `ci/deploy.yml`: the artifacts to deploy it (Container Apps, managed
  identity, Key Vault, Log Analytics, App Insights, GitHub Actions with OIDC).
- `src/deploycheck`: static checker for those three artifacts (rules `XR001`-`XR012`).

```
uv sync
uv run pytest -q
uv run deploycheck --strict --dockerfile Dockerfile --bicep infra/main.bicep --workflow ci/deploy.yml
uv run uvicorn --factory llm_service.app:create_app_from_env --port 8000
```

No Azure account is needed. `deploycheck` is a text-level linter (not a Bicep or YAML semantic
validator): `az bicep build` and `az deployment group what-if` remain the source of truth.
`python create_working_copy.py` makes a disposable copy to experiment on.
