"""Camada de acesso a dados (Repository).

Concentra todo o SQL da aplicação. As funções recebem uma
``sqlite3.Connection`` e devolvem ``sqlite3.Row`` (ou listas delas),
sem aplicar regras de negócio — isso é responsabilidade de ``services``.
"""
from __future__ import annotations

import sqlite3
from typing import Optional

ESTADOS_ATIVOS = ("Agendada", "Realizada")


# =====================================================================
# Catálogos simples
# =====================================================================
def listar_especialidades(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT especialidadeID, nome FROM Especialidade ORDER BY nome;"
    ).fetchall()


def listar_profissionais(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT p.profissionalID, p.nome, p.crm, p.celular, e.nome AS especialidade
        FROM Profissional p
        JOIN Especialidade e ON e.especialidadeID = p.especialidadeID
        ORDER BY p.nome;
        """
    ).fetchall()


def listar_pacientes(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT pacienteID, nome, cpf, email, celular FROM Paciente ORDER BY nome;"
    ).fetchall()


def listar_salas(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute("SELECT salaID, nome FROM Sala ORDER BY nome;").fetchall()


def listar_turnos(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT turnoNome, horarioInicio, horarioFim FROM Turno ORDER BY horarioInicio;"
    ).fetchall()


# =====================================================================
# Buscas pontuais
# =====================================================================
def buscar_paciente_por_cpf(conn: sqlite3.Connection, cpf: str) -> Optional[sqlite3.Row]:
    return conn.execute(
        "SELECT * FROM Paciente WHERE cpf = ?;", (cpf,)
    ).fetchone()


def buscar_profissional(conn: sqlite3.Connection, profissional_id: int) -> Optional[sqlite3.Row]:
    return conn.execute(
        "SELECT * FROM Profissional WHERE profissionalID = ?;", (profissional_id,)
    ).fetchone()


def turno_do_horario(conn: sqlite3.Connection, horario: str) -> Optional[sqlite3.Row]:
    """Devolve o turno cuja faixa [horarioInicio, horarioFim) contém o horário."""
    return conn.execute(
        """
        SELECT turnoNome FROM Turno
        WHERE horarioInicio <= ? AND ? < horarioFim;
        """,
        (horario, horario),
    ).fetchone()


def profissional_disponivel(conn: sqlite3.Connection, profissional_id: int,
                            dia_semana: str, turno: str) -> bool:
    row = conn.execute(
        """
        SELECT 1 FROM Disponibilidade
        WHERE profissionalID = ? AND dia = ? AND turnoNome = ?
        LIMIT 1;
        """,
        (profissional_id, dia_semana, turno),
    ).fetchone()
    return row is not None


# =====================================================================
# Detecção de conflitos de agenda (consultas ativas no mesmo horário)
# =====================================================================
def _conflito(conn: sqlite3.Connection, coluna: str, valor: int,
              data: str, horario: str) -> Optional[sqlite3.Row]:
    placeholders = ",".join("?" for _ in ESTADOS_ATIVOS)
    sql = (
        f"SELECT consultaID FROM Consulta "
        f"WHERE {coluna} = ? AND data = ? AND horario = ? "
        f"AND estado IN ({placeholders}) LIMIT 1;"
    )
    return conn.execute(sql, (valor, data, horario, *ESTADOS_ATIVOS)).fetchone()


def conflito_profissional(conn, profissional_id, data, horario):
    return _conflito(conn, "profissionalID", profissional_id, data, horario)


def conflito_sala(conn, sala_id, data, horario):
    return _conflito(conn, "salaID", sala_id, data, horario)


def conflito_paciente(conn, paciente_id, data, horario):
    return _conflito(conn, "pacienteID", paciente_id, data, horario)


# =====================================================================
# Operações sobre Consulta
# =====================================================================
def inserir_consulta(conn: sqlite3.Connection, data: str, horario: str,
                     profissional_id: int, paciente_id: int, sala_id: int) -> int:
    cur = conn.execute(
        """
        INSERT INTO Consulta (data, horario, estado, profissionalID, pacienteID, salaID)
        VALUES (?, ?, 'Agendada', ?, ?, ?);
        """,
        (data, horario, profissional_id, paciente_id, sala_id),
    )
    conn.commit()
    return int(cur.lastrowid)


def buscar_consulta(conn: sqlite3.Connection, consulta_id: int) -> Optional[sqlite3.Row]:
    return conn.execute(
        "SELECT * FROM Consulta WHERE consultaID = ?;", (consulta_id,)
    ).fetchone()


def atualizar_status(conn: sqlite3.Connection, consulta_id: int,
                     estado: str, descricao: Optional[str]) -> None:
    conn.execute(
        "UPDATE Consulta SET estado = ?, descricao = ? WHERE consultaID = ?;",
        (estado, descricao, consulta_id),
    )
    conn.commit()


def consultas_do_dia(conn: sqlite3.Connection, data: str) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT c.horario, pa.nome AS paciente, pr.nome AS profissional,
               s.nome AS sala, c.estado
        FROM Consulta c
        JOIN Paciente     pa ON pa.pacienteID     = c.pacienteID
        JOIN Profissional pr ON pr.profissionalID = c.profissionalID
        JOIN Sala         s  ON s.salaID          = c.salaID
        WHERE c.data = ?
        ORDER BY c.horario;
        """,
        (data,),
    ).fetchall()


def historico_por_cpf(conn: sqlite3.Connection, cpf: str) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT c.data, c.horario, pr.nome AS profissional,
               e.nome AS especialidade, s.nome AS sala,
               c.estado, c.descricao
        FROM Consulta c
        JOIN Paciente     pa ON pa.pacienteID     = c.pacienteID
        JOIN Profissional pr ON pr.profissionalID = c.profissionalID
        JOIN Especialidade e ON e.especialidadeID = pr.especialidadeID
        JOIN Sala         s  ON s.salaID          = c.salaID
        WHERE pa.cpf = ?
        ORDER BY c.data DESC, c.horario DESC;
        """,
        (cpf,),
    ).fetchall()


def listar_consultas(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT c.consultaID, c.data, c.horario, c.estado,
               pa.nome AS paciente, pr.nome AS profissional, s.nome AS sala
        FROM Consulta c
        JOIN Paciente     pa ON pa.pacienteID     = c.pacienteID
        JOIN Profissional pr ON pr.profissionalID = c.profissionalID
        JOIN Sala         s  ON s.salaID          = c.salaID
        ORDER BY c.data, c.horario;
        """
    ).fetchall()


# =====================================================================
# Relatório agregado por profissional
# =====================================================================
def estatisticas_por_profissional(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT p.profissionalID, p.nome,
               COUNT(c.consultaID) AS total,
               SUM(CASE WHEN c.estado = 'Realizada' THEN 1 ELSE 0 END) AS realizadas,
               SUM(CASE WHEN c.estado = 'Cancelada' THEN 1 ELSE 0 END) AS canceladas,
               SUM(CASE WHEN c.estado = 'Faltou'    THEN 1 ELSE 0 END) AS faltas
        FROM Profissional p
        LEFT JOIN Consulta c ON c.profissionalID = p.profissionalID
        GROUP BY p.profissionalID, p.nome
        ORDER BY p.nome;
        """
    ).fetchall()


def consultas_futuras_do_profissional(conn: sqlite3.Connection,
                                      profissional_id: int,
                                      hoje: str) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT c.data, c.horario, pa.nome AS paciente
        FROM Consulta c
        JOIN Paciente pa ON pa.pacienteID = c.pacienteID
        WHERE c.profissionalID = ? AND c.estado = 'Agendada' AND c.data >= ?
        ORDER BY c.data, c.horario;
        """,
        (profissional_id, hoje),
    ).fetchall()


# =====================================================================
# Cadastros (funcionalidades bônus)
# =====================================================================
def inserir_paciente(conn: sqlite3.Connection, nome: str, cpf: str,
                     email: str | None, celular: str | None) -> int:
    cur = conn.execute(
        "INSERT INTO Paciente (nome, cpf, email, celular) VALUES (?, ?, ?, ?);",
        (nome, cpf, email, celular),
    )
    conn.commit()
    return int(cur.lastrowid)


def inserir_profissional(conn: sqlite3.Connection, nome: str, crm: str,
                         celular: str | None, especialidade_id: int) -> int:
    cur = conn.execute(
        """
        INSERT INTO Profissional (nome, crm, celular, especialidadeID)
        VALUES (?, ?, ?, ?);
        """,
        (nome, crm, celular, especialidade_id),
    )
    conn.commit()
    return int(cur.lastrowid)
