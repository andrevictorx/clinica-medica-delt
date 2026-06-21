"""Testes da regra de agendamento (funcionalidade 1)."""
import pytest

from clinica import repositories as repo
from clinica.services import RegraNegocioError


def test_agendamento_valido_cria_consulta_agendada(service, db):
    # 2026-06-29 é uma segunda-feira; Dra. Helena (prof 1) atende Seg/Manhã.
    consulta_id = service.agendar_consulta(
        paciente_id=3, profissional_id=1, data="2026-06-29", horario="08:00", sala_id=3
    )
    assert consulta_id > 0
    consulta = repo.buscar_consulta(db.conn, consulta_id)
    assert consulta["estado"] == "Agendada"
    assert consulta["data"] == "2026-06-29"


def test_conflito_de_horario_do_profissional(service):
    # prof 1 já tem a consulta #9 em 2026-06-22 09:00 (Seg/Manhã).
    with pytest.raises(RegraNegocioError, match="profissional já possui"):
        service.agendar_consulta(
            paciente_id=4, profissional_id=1, data="2026-06-22", horario="09:00", sala_id=3
        )


def test_conflito_de_sala(service):
    # Sala 1 está ocupada em 2026-06-22 09:00. prof 4 atende Seg/Manhã.
    with pytest.raises(RegraNegocioError, match="sala já está ocupada"):
        service.agendar_consulta(
            paciente_id=5, profissional_id=4, data="2026-06-22", horario="09:00", sala_id=1
        )


def test_conflito_de_horario_do_paciente(service):
    # Paciente 1 já tem a consulta #9 em 2026-06-22 09:00.
    with pytest.raises(RegraNegocioError, match="paciente já possui"):
        service.agendar_consulta(
            paciente_id=1, profissional_id=4, data="2026-06-22", horario="09:00", sala_id=4
        )


def test_profissional_sem_disponibilidade(service):
    # 2026-06-23 é terça; Dra. Helena (prof 1) não atende às terças.
    with pytest.raises(RegraNegocioError, match="não atende"):
        service.agendar_consulta(
            paciente_id=2, profissional_id=1, data="2026-06-23", horario="09:00", sala_id=2
        )


def test_horario_fora_de_qualquer_turno(service):
    # 12:30 fica entre o turno da manhã (08-12) e da tarde (13-18).
    with pytest.raises(RegraNegocioError, match="não pertence a nenhum turno"):
        service.agendar_consulta(
            paciente_id=2, profissional_id=1, data="2026-06-22", horario="12:30", sala_id=2
        )


@pytest.mark.parametrize("data", ["2026/06/22", "22-06-2026", "abc"])
def test_data_invalida(service, data):
    with pytest.raises(RegraNegocioError):
        service.agendar_consulta(
            paciente_id=2, profissional_id=1, data=data, horario="09:00", sala_id=2
        )


@pytest.mark.parametrize("horario", ["9:00", "25:00", "08-00"])
def test_horario_invalido(service, horario):
    with pytest.raises(RegraNegocioError):
        service.agendar_consulta(
            paciente_id=2, profissional_id=1, data="2026-06-22", horario=horario, sala_id=2
        )
