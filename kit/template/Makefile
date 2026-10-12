# Comando único de verificação: humanos, agentes, hooks e CI chamam o MESMO alvo.
# Troque os comandos de exemplo (.NET) pelos da sua stack; mantenha os nomes dos alvos.
.PHONY: check lint test docs-check hooks-check run

BASE ?= origin/main

check: lint test docs-check hooks-check   ## verificação completa antes de qualquer PR

lint:
	# dotnet format --verify-no-changes
	@echo "lint: configure o comando da sua stack"

test:
	# dotnet test --nologo
	@echo "test: configure o comando da sua stack"

docs-check:
	python3 scripts/hooks/check_docs.py --base $(BASE)

hooks-check:
	python3 scripts/hooks/block_protected_paths.py --base $(BASE)
	python3 scripts/hooks/block_test_edits_in_fix.py --base $(BASE)
	python3 scripts/hooks/scan_secrets.py --base $(BASE)

run:
	# dotnet run --project src/App
	@echo "run: configure"
