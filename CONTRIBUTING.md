# Contribuindo

Projeto acadêmico (TE 901 — UFPR). Mesmo assim, seguimos boas práticas de um
projeto real.

## Ambiente

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Padrões

- **Camadas:** mantenha o SQL em `repositories.py`, as regras em `services.py`
  e a apresentação em `ui.py`/`cli.py`. A UI nunca executa SQL diretamente.
- **Testes:** toda regra de negócio nova deve ter teste em `tests/`. Rode
  `pytest -q` antes de abrir um PR — a CI exige tudo verde.
- **Estilo:** type hints, docstrings em português e nomes de tabela/coluna
  conforme o dicionário de dados.

## Fluxo

1. Crie um branch a partir de `main`.
2. Faça commits pequenos e descritivos.
3. Garanta `pytest -q` verde.
4. Abra o Pull Request descrevendo a mudança.
