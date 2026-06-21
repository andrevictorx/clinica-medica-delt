"""Camada de regras de negócio da Clínica Médica DELT.

Aqui ficam as validações exigidas pela especificação: conflitos de
agenda, disponibilidade do profissional e transições de status. A
camada não imprime nada — ela levanta ``RegraNegocioError`` quando uma
regra é violada e devolve dados estruturados em caso de sucesso.
"""
from __future__ import annotations

import re
import sqlite3
from dataclasses import dataclass, field
from datetime import date

from . import repositories as repo

# Segunda=0 ... Domingo=6 -> abreviações usadas em Disponibilidade.dia
DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]
ESTADOS_VALIDOS = ("Agendada", "Realizada", "Cancelada", "Faltou")

_RE_DATA = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_RE_HORA = re.compile(r"^\d{2}:\d{2}$")


class RegraNegocioError(Exception):
    """Erro de validação de regra de negócio (mensagem amigável ao usuário)."""


# ---------------------------------------------------------------------
# Helpers de data/hora
# ---------------------------------------------------------------------
def dia_da_semana(data_iso: str) -> str:
    ano, mes, dia = (int(p) for p in data_iso.split("-"))
    return DIAS_SEMANA[date(ano, mes, dia).weekday()]


def validar_data(data_iso: str) -> None:
    if not _RE_DATA.match(data_iso):
        raise RegraNegocioError("Data inválida. Use o formato AAAA-MM-DD.")
    try:
        ano, mes, dia = (int(p) for p in data_iso.split("-"))
        date(ano, mes, dia)
    except ValueError:
        raise RegraNegocioError("Data inexistente no calendário.")


def validar_horario(horario: str) -> None:
    if not _RE_HORA.match(horario):
        raise RegraNegocioError("Horário inválido. Use o formato HH:MM.")
    h, m = (int(p) for p in horario.split(":"))
    if not (0 <= h < 24 and 0 <= m < 60):
        raise RegraNegocioError("Horário fora do intervalo válido.")


@dataclass
class RelatorioProfissional:
    profissional_id: int
    nome: str
    total: int
    realizadas: int
    canceladas: int
    faltas: int
    futuras: list = field(default_factory=list)  # linhas (data, horario, paciente)


class ClinicaService:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn

    # -----------------------------------------------------------------
    # 1) Agendar nova consulta
    # -----------------------------------------------------------------
    def agendar_consulta(self, paciente_id: int, profissional_id: int,
                         data: str, horario: str, sala_id: int) -> int:
        """Valida todas as regras e insere a consulta com estado 'Agendada'.

        Levanta ``RegraNegocioError`` no primeiro conflito encontrado.
        Retorna o ID da consulta criada.
        """
        validar_data(data)
        validar_horario(horario)

        # O horário precisa cair dentro de algum turno cadastrado.
        turno = repo.turno_do_horario(self.conn, horario)
        if turno is None:
            raise RegraNegocioError(
                "O horário informado não pertence a nenhum turno de atendimento."
            )
        turno_nome = turno["turnoNome"]
        dia = dia_da_semana(data)

        # Regra 1: o profissional precisa ter disponibilidade no dia e turno.
        if not repo.profissional_disponivel(self.conn, profissional_id, dia, turno_nome):
            raise RegraNegocioError(
                f"O profissional não atende em {dia} no turno da {turno_nome}."
            )

        # Regra 2: o profissional não pode ter outra consulta ativa no horário.
        if repo.conflito_profissional(self.conn, profissional_id, data, horario):
            raise RegraNegocioError(
                "O profissional já possui uma consulta nesse dia e horário."
            )

        # Regra 3: a sala não pode estar ocupada no horário.
        if repo.conflito_sala(self.conn, sala_id, data, horario):
            raise RegraNegocioError("A sala já está ocupada nesse dia e horário.")

        # Regra 4: o paciente não pode ter outra consulta no mesmo horário.
        if repo.conflito_paciente(self.conn, paciente_id, data, horario):
            raise RegraNegocioError(
                "O paciente já possui uma consulta nesse dia e horário."
            )

        return repo.inserir_consulta(
            self.conn, data, horario, profissional_id, paciente_id, sala_id
        )

    # -----------------------------------------------------------------
    # 2) Listar consultas do dia
    # -----------------------------------------------------------------
    def listar_consultas_dia(self, data: str) -> list[sqlite3.Row]:
        validar_data(data)
        return repo.consultas_do_dia(self.conn, data)

    # -----------------------------------------------------------------
    # 3) Histórico de um paciente (por CPF)
    # -----------------------------------------------------------------
    def historico_paciente(self, cpf: str) -> list[sqlite3.Row]:
        paciente = repo.buscar_paciente_por_cpf(self.conn, cpf)
        if paciente is None:
            raise RegraNegocioError("Nenhum paciente encontrado com esse CPF.")
        return repo.historico_por_cpf(self.conn, cpf)

    # -----------------------------------------------------------------
    # 4) Alterar status de uma consulta
    # -----------------------------------------------------------------
    def alterar_status(self, consulta_id: int, novo_estado: str,
                       observacoes: str | None = None) -> None:
        if novo_estado not in ESTADOS_VALIDOS:
            raise RegraNegocioError(f"Estado inválido: {novo_estado!r}.")

        consulta = repo.buscar_consulta(self.conn, consulta_id)
        if consulta is None:
            raise RegraNegocioError("Consulta não encontrada.")

        # Consultas já realizadas não podem mais ser modificadas.
        if consulta["estado"] == "Realizada":
            raise RegraNegocioError(
                "Esta consulta já foi realizada e não pode mais ser alterada."
            )

        descricao = consulta["descricao"]
        if novo_estado == "Realizada":
            if not observacoes or not observacoes.strip():
                raise RegraNegocioError(
                    "Para marcar como 'Realizada' é obrigatório informar as "
                    "observações médicas."
                )
            descricao = observacoes.strip()

        repo.atualizar_status(self.conn, consulta_id, novo_estado, descricao)

    # -----------------------------------------------------------------
    # 5) Relatório de atendimentos por profissional
    # -----------------------------------------------------------------
    def relatorio_profissionais(self, hoje: str) -> list[RelatorioProfissional]:
        relatorios: list[RelatorioProfissional] = []
        for linha in repo.estatisticas_por_profissional(self.conn):
            futuras = repo.consultas_futuras_do_profissional(
                self.conn, linha["profissionalID"], hoje
            )
            relatorios.append(
                RelatorioProfissional(
                    profissional_id=linha["profissionalID"],
                    nome=linha["nome"],
                    total=linha["total"] or 0,
                    realizadas=linha["realizadas"] or 0,
                    canceladas=linha["canceladas"] or 0,
                    faltas=linha["faltas"] or 0,
                    futuras=list(futuras),
                )
            )
        return relatorios

    # -----------------------------------------------------------------
    # Funcionalidades bônus (cadastros)
    # -----------------------------------------------------------------
    def cadastrar_paciente(self, nome: str, cpf: str,
                           email: str | None, celular: str | None) -> int:
        if not nome.strip() or not cpf.strip():
            raise RegraNegocioError("Nome e CPF são obrigatórios.")
        if repo.buscar_paciente_por_cpf(self.conn, cpf):
            raise RegraNegocioError("Já existe um paciente com esse CPF.")
        return repo.inserir_paciente(self.conn, nome.strip(), cpf.strip(),
                                     email, celular)

    def cadastrar_profissional(self, nome: str, crm: str,
                               celular: str | None, especialidade_id: int) -> int:
        if not nome.strip() or not crm.strip():
            raise RegraNegocioError("Nome e CRM são obrigatórios.")
        return repo.inserir_profissional(self.conn, nome.strip(), crm.strip(),
                                         celular, especialidade_id)
