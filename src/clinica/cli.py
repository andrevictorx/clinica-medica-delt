"""Laço do menu principal — orquestra UI + Service."""
from __future__ import annotations

from datetime import date

from . import repositories as repo
from . import ui
from .services import ClinicaService, RegraNegocioError


class App:
    def __init__(self, conn) -> None:
        self.conn = conn
        self.service = ClinicaService(conn)

    # =================================================================
    # Menu
    # =================================================================
    def run(self) -> None:
        acoes = {
            "1": self.agendar,
            "2": self.listar_dia,
            "3": self.historico,
            "4": self.alterar_status,
            "5": self.relatorio,
            "6": self.cadastrar_paciente,      # bônus
            "7": self.cadastrar_profissional,  # bônus
            "8": self.listar_especialidades,   # bônus
        }
        while True:
            self._menu()
            opcao = ui.ler_texto("Opção:")
            if opcao == "0":
                ui.info("Encerrando. Até logo!")
                return
            acao = acoes.get(opcao)
            if acao is None:
                ui.erro("Opção inválida.")
                continue
            try:
                acao()
            except RegraNegocioError as e:
                ui.erro(str(e))
            ui.pausar()

    def _menu(self) -> None:
        ui.titulo("Clínica Médica DELT — Menu Principal")
        print(f"  {ui.BOLD}1{ui.RESET}. Agendar nova consulta")
        print(f"  {ui.BOLD}2{ui.RESET}. Listar consultas do dia")
        print(f"  {ui.BOLD}3{ui.RESET}. Consultar histórico de um paciente")
        print(f"  {ui.BOLD}4{ui.RESET}. Alterar status de uma consulta")
        print(f"  {ui.BOLD}5{ui.RESET}. Relatório de atendimentos por profissional")
        print(f"  {ui.DIM}6. [bônus] Cadastrar paciente{ui.RESET}")
        print(f"  {ui.DIM}7. [bônus] Cadastrar profissional{ui.RESET}")
        print(f"  {ui.DIM}8. [bônus] Listar especialidades{ui.RESET}")
        print(f"  {ui.BOLD}0{ui.RESET}. Sair")

    # =================================================================
    # 1) Agendar
    # =================================================================
    def agendar(self) -> None:
        ui.titulo("Agendar nova consulta")

        self._mostrar_pacientes()
        paciente_id = ui.ler_inteiro("ID do paciente:")

        self._mostrar_profissionais()
        profissional_id = ui.ler_inteiro("ID do profissional:")

        data = ui.ler_texto("Data (AAAA-MM-DD):")
        horario = ui.ler_texto("Horário (HH:MM):")

        self._mostrar_salas()
        sala_id = ui.ler_inteiro("ID da sala:")

        if None in (paciente_id, profissional_id, sala_id):
            raise RegraNegocioError("É necessário informar paciente, profissional e sala.")

        consulta_id = self.service.agendar_consulta(
            paciente_id, profissional_id, data, horario, sala_id
        )
        ui.sucesso(f"Consulta #{consulta_id} agendada com status 'Agendada'.")

    # =================================================================
    # 2) Listar consultas do dia
    # =================================================================
    def listar_dia(self) -> None:
        ui.titulo("Consultas do dia")
        data = ui.ler_texto("Data (AAAA-MM-DD):")
        linhas = self.service.listar_consultas_dia(data)
        ui.info(f"{len(linhas)} consulta(s) em {data}:\n")
        ui.tabela(
            ["Horário", "Paciente", "Profissional", "Sala", "Status"],
            [[r["horario"], r["paciente"], r["profissional"], r["sala"],
              ui.estado_colorido(r["estado"])] for r in linhas],
        )

    # =================================================================
    # 3) Histórico do paciente
    # =================================================================
    def historico(self) -> None:
        ui.titulo("Histórico do paciente")
        cpf = ui.ler_texto("CPF do paciente:")
        linhas = self.service.historico_paciente(cpf)
        ui.info(f"{len(linhas)} consulta(s) no histórico:\n")
        ui.tabela(
            ["Data", "Horário", "Profissional", "Especialidade", "Sala", "Status", "Observações"],
            [[r["data"], r["horario"], r["profissional"], r["especialidade"],
              r["sala"], ui.estado_colorido(r["estado"]), r["descricao"] or "—"]
             for r in linhas],
        )

    # =================================================================
    # 4) Alterar status
    # =================================================================
    def alterar_status(self) -> None:
        ui.titulo("Alterar status de uma consulta")
        self._mostrar_consultas()
        consulta_id = ui.ler_inteiro("ID da consulta:")
        if consulta_id is None:
            raise RegraNegocioError("Informe o ID da consulta.")

        print("\nNovo status:")
        opcoes = {"1": "Agendada", "2": "Realizada", "3": "Cancelada", "4": "Faltou"}
        for k, v in opcoes.items():
            print(f"  {k}. {v}")
        escolha = ui.ler_texto("Opção:")
        novo = opcoes.get(escolha)
        if novo is None:
            raise RegraNegocioError("Status inválido.")

        observacoes = None
        if novo == "Realizada":
            observacoes = ui.ler_texto("Observações médicas:")

        self.service.alterar_status(consulta_id, novo, observacoes)
        ui.sucesso(f"Status da consulta #{consulta_id} alterado para '{novo}'.")

    # =================================================================
    # 5) Relatório por profissional
    # =================================================================
    def relatorio(self) -> None:
        ui.titulo("Relatório de atendimentos por profissional")
        hoje = date.today().isoformat()
        relatorios = self.service.relatorio_profissionais(hoje)
        ui.tabela(
            ["Profissional", "Total", "Realizadas", "Canceladas", "Faltas", "Futuras"],
            [[r.nome, r.total, r.realizadas, r.canceladas, r.faltas, len(r.futuras)]
             for r in relatorios],
        )
        for r in relatorios:
            if r.futuras:
                print(f"\n{ui.BOLD}{r.nome}{ui.RESET} — próximas consultas agendadas:")
                ui.tabela(
                    ["Data", "Horário", "Paciente"],
                    [[f["data"], f["horario"], f["paciente"]] for f in r.futuras],
                )

    # =================================================================
    # 6-8) Bônus
    # =================================================================
    def cadastrar_paciente(self) -> None:
        ui.titulo("[bônus] Cadastrar paciente")
        nome = ui.ler_texto("Nome:")
        cpf = ui.ler_texto("CPF:")
        email = ui.ler_opcional("E-mail (opcional):")
        celular = ui.ler_opcional("Celular (opcional):")
        pid = self.service.cadastrar_paciente(nome, cpf, email, celular)
        ui.sucesso(f"Paciente #{pid} cadastrado.")

    def cadastrar_profissional(self) -> None:
        ui.titulo("[bônus] Cadastrar profissional")
        self.listar_especialidades()
        nome = ui.ler_texto("Nome:")
        crm = ui.ler_texto("CRM:")
        celular = ui.ler_opcional("Celular (opcional):")
        esp = ui.ler_inteiro("ID da especialidade:")
        if esp is None:
            raise RegraNegocioError("Informe a especialidade.")
        pid = self.service.cadastrar_profissional(nome, crm, celular, esp)
        ui.sucesso(f"Profissional #{pid} cadastrado.")

    def listar_especialidades(self) -> None:
        linhas = repo.listar_especialidades(self.conn)
        ui.tabela(["ID", "Especialidade"],
                  [[r["especialidadeID"], r["nome"]] for r in linhas])

    # =================================================================
    # Auxiliares de listagem
    # =================================================================
    def _mostrar_pacientes(self) -> None:
        ui.tabela(["ID", "Nome", "CPF"],
                  [[r["pacienteID"], r["nome"], r["cpf"]]
                   for r in repo.listar_pacientes(self.conn)])

    def _mostrar_profissionais(self) -> None:
        ui.tabela(["ID", "Nome", "Especialidade"],
                  [[r["profissionalID"], r["nome"], r["especialidade"]]
                   for r in repo.listar_profissionais(self.conn)])

    def _mostrar_salas(self) -> None:
        ui.tabela(["ID", "Sala"],
                  [[r["salaID"], r["nome"]] for r in repo.listar_salas(self.conn)])

    def _mostrar_consultas(self) -> None:
        ui.tabela(
            ["ID", "Data", "Horário", "Paciente", "Profissional", "Sala", "Status"],
            [[r["consultaID"], r["data"], r["horario"], r["paciente"],
              r["profissional"], r["sala"], ui.estado_colorido(r["estado"])]
             for r in repo.listar_consultas(self.conn)],
        )
