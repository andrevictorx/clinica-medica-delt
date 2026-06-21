"""Testes da alteração de status de consulta (funcionalidade 4)."""
import pytest

from clinica import repositories as repo
from clinica.services import RegraNegocioError


def test_marcar_como_realizada_exige_observacoes(service):
    # Consulta #9 está 'Agendada'.
    with pytest.raises(RegraNegocioError, match="observações"):
        service.alterar_status(9, "Realizada", observacoes=None)


def test_marcar_como_realizada_salva_observacoes(service, db):
    service.alterar_status(9, "Realizada", observacoes="Consulta concluída sem intercorrências.")
    consulta = repo.buscar_consulta(db.conn, 9)
    assert consulta["estado"] == "Realizada"
    assert consulta["descricao"] == "Consulta concluída sem intercorrências."


def test_consulta_realizada_nao_pode_ser_alterada(service):
    # Consulta #1 já está 'Realizada' no seed.
    with pytest.raises(RegraNegocioError, match="não pode mais ser alterada"):
        service.alterar_status(1, "Cancelada")


def test_cancelar_consulta(service, db):
    service.alterar_status(9, "Cancelada")
    assert repo.buscar_consulta(db.conn, 9)["estado"] == "Cancelada"


def test_estado_invalido(service):
    with pytest.raises(RegraNegocioError, match="Estado inválido"):
        service.alterar_status(9, "Pendente")


def test_consulta_inexistente(service):
    with pytest.raises(RegraNegocioError, match="não encontrada"):
        service.alterar_status(9999, "Cancelada")


def test_cancelar_libera_horario_para_novo_agendamento(service):
    # Cancelar a #9 (prof1, 2026-06-22 09:00, sala1) deve liberar o slot.
    service.alterar_status(9, "Cancelada")
    novo = service.agendar_consulta(
        paciente_id=4, profissional_id=1, data="2026-06-22", horario="09:00", sala_id=1
    )
    assert novo > 0
