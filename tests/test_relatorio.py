"""Testes de relatório, histórico e listagem (funcionalidades 2, 3 e 5)."""
import pytest

from clinica.services import RegraNegocioError

HOJE = "2026-06-21"


def _por_nome(relatorios, nome):
    return next(r for r in relatorios if r.nome == nome)


def test_relatorio_agrega_por_profissional(service):
    relatorios = service.relatorio_profissionais(HOJE)
    helena = _por_nome(relatorios, "Dra. Helena Marques")
    assert helena.total == 4
    assert helena.realizadas == 2
    assert helena.canceladas == 0
    assert helena.faltas == 0
    assert len(helena.futuras) == 2  # consultas futuras agendadas


def test_relatorio_conta_faltas_e_cancelamentos(service):
    rafael = _por_nome(service.relatorio_profissionais(HOJE), "Dr. Rafael Lima")
    assert rafael.faltas == 1
    assert rafael.canceladas == 1
    assert len(rafael.futuras) == 2


def test_relatorio_inclui_profissional_sem_consultas(service, db):
    # Cadastra um profissional novo (sem consultas) e confere que aparece zerado.
    db.conn.execute(
        "INSERT INTO Profissional (nome, crm, celular, especialidadeID) "
        "VALUES ('Dr. Sem Agenda', 'CRM/PR 00000', NULL, 5);"
    )
    db.conn.commit()
    novo = _por_nome(service.relatorio_profissionais(HOJE), "Dr. Sem Agenda")
    assert novo.total == 0 and novo.futuras == []


def test_listar_consultas_do_dia_ordenado_por_horario(service):
    linhas = service.listar_consultas_dia("2026-06-22")
    assert len(linhas) == 3
    horarios = [l["horario"] for l in linhas]
    assert horarios == sorted(horarios)
    assert horarios[0] == "08:00"


def test_historico_por_cpf_ordem_cronologica_decrescente(service):
    linhas = service.historico_paciente("111.111.111-11")  # João Pereira
    assert len(linhas) == 3
    # Mais recente primeiro: 2026-06-22 14:00.
    assert linhas[0]["data"] == "2026-06-22"
    assert linhas[0]["horario"] == "14:00"
    assert "especialidade" in linhas[0].keys()


def test_historico_cpf_inexistente(service):
    with pytest.raises(RegraNegocioError, match="Nenhum paciente"):
        service.historico_paciente("000.000.000-00")
