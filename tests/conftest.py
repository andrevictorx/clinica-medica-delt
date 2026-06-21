"""Configuração compartilhada dos testes (pytest)."""
import sys
from pathlib import Path

import pytest

# Torna o pacote `clinica` importável (layout src/).
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from clinica.database import create_in_memory  # noqa: E402
from clinica.services import ClinicaService     # noqa: E402


@pytest.fixture
def db():
    """Banco SQLite em memória, já com esquema + dados de teste."""
    database = create_in_memory(seed=True)
    yield database
    database.close()


@pytest.fixture
def service(db):
    return ClinicaService(db.conn)
