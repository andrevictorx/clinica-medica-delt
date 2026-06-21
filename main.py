#!/usr/bin/env python3
"""Ponto de entrada da aplicação da Clínica Médica DELT.

Uso:
    python main.py            # abre/cria o banco clinica_medica.db e roda o menu

Na primeira execução o banco é criado a partir de sql/schema.sql e
populado com sql/seed.sql automaticamente.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Permite executar sem instalar o pacote (layout src/).
sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from clinica.cli import App           # noqa: E402
from clinica.database import ensure_database  # noqa: E402


def main() -> None:
    db = ensure_database()
    try:
        App(db.conn).run()
    except (KeyboardInterrupt, EOFError):
        print("\nEncerrado pelo usuário.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
