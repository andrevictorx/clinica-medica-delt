.PHONY: run test der dump clean

PY ?= python3
DB ?= clinica_medica.db

run:          ## Executa a aplicação (cria/popula o banco se necessário)
	$(PY) main.py

test:         ## Roda os testes
	$(PY) -m pytest -q

der:          ## Regenera docs/der.svg e converte para PNG (precisa de LibreOffice)
	$(PY) docs/gerar_der.py
	soffice --headless --convert-to png --outdir docs docs/der.svg

dump:         ## Recria o banco a partir do SQL e exporta os INSERTs em sql/dump.sql
	rm -f $(DB)
	sqlite3 $(DB) ".read sql/schema.sql" ".read sql/seed.sql"
	sqlite3 $(DB) ".dump" > sql/dump.sql
	@echo "INSERTs exportados em sql/dump.sql"

clean:        ## Remove o banco e artefatos temporários
	rm -f $(DB) sql/dump.sql
	find . -type d -name __pycache__ -exec rm -rf {} +
	rm -rf .pytest_cache
