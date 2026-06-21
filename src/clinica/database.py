"""Camada de conexão e inicialização do banco SQLite."""
from __future__ import annotations

import sqlite3
from pathlib import Path

# Raiz do projeto (.../clinica-medica-delt) — três níveis acima deste arquivo:
# src/clinica/database.py -> src/clinica -> src -> raiz
ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = ROOT / "sql" / "schema.sql"
SEED_PATH = ROOT / "sql" / "seed.sql"
DEFAULT_DB = ROOT / "clinica_medica.db"


class Database:
    """Encapsula a conexão SQLite com chaves estrangeiras habilitadas
    e ``sqlite3.Row`` como ``row_factory`` (acesso por nome de coluna)."""

    def __init__(self, db_path: str | Path = DEFAULT_DB) -> None:
        self.db_path = str(db_path)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON;")

    # -- inicialização ----------------------------------------------------
    def run_script(self, path: str | Path) -> None:
        """Executa um arquivo .sql inteiro."""
        sql = Path(path).read_text(encoding="utf-8")
        self.conn.executescript(sql)
        self.conn.commit()

    def initialize(self, schema: str | Path = SCHEMA_PATH,
                   seed: str | Path | None = None) -> None:
        """Cria as tabelas e, opcionalmente, popula com dados de teste."""
        self.run_script(schema)
        if seed is not None:
            self.run_script(seed)

    # -- ciclo de vida ----------------------------------------------------
    def close(self) -> None:
        self.conn.close()

    def __enter__(self) -> "Database":
        return self

    def __exit__(self, *exc) -> None:
        self.close()


def create_in_memory(seed: bool = True) -> Database:
    """Banco SQLite em memória já inicializado — usado pelos testes."""
    db = Database(":memory:")
    db.initialize(SCHEMA_PATH, SEED_PATH if seed else None)
    return db


def ensure_database(db_path: str | Path = DEFAULT_DB) -> Database:
    """Abre o banco em disco; se o arquivo não existir, cria o esquema e
    popula com os dados de teste antes de devolver a conexão."""
    path = Path(db_path)
    novo = not path.exists()
    db = Database(path)
    if novo:
        db.initialize(SCHEMA_PATH, SEED_PATH)
    return db
