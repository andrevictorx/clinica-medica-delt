/**
 * Dados de teste (seed) — alinhados ao sql/seed.sql do projeto.
 * Datas de referência: junho/2026 (2026-06-21 é domingo).
 * Acrescenta o paciente interno de bloqueio e alguns bloqueios pontuais,
 * sempre dentro da estrutura das 7 tabelas.
 */
import type { Banco } from "../types";
import { BLOQUEIO_PACIENTE_ID } from "../types";

export const seed: Banco = {
  especialidades: [
    { especialidadeID: 1, nome: "Cardiologia" },
    { especialidadeID: 2, nome: "Pediatria" },
    { especialidadeID: 3, nome: "Dermatologia" },
    { especialidadeID: 4, nome: "Ortopedia" },
    { especialidadeID: 5, nome: "Clínica Geral" },
  ],
  profissionais: [
    { profissionalID: 1, nome: "Dra. Helena Marques", crm: "CRM/PR 12345", celular: "(41) 99100-0001", especialidadeID: 1 },
    { profissionalID: 2, nome: "Dr. Rafael Lima", crm: "CRM/PR 23456", celular: "(41) 99100-0002", especialidadeID: 2 },
    { profissionalID: 3, nome: "Dra. Beatriz Souza", crm: "CRM/PR 34567", celular: "(41) 99100-0003", especialidadeID: 3 },
    { profissionalID: 4, nome: "Dr. Thiago Nunes", crm: "CRM/PR 45678", celular: "(41) 99100-0004", especialidadeID: 4 },
    { profissionalID: 5, nome: "Dra. Camila Rocha", crm: "CRM/PR 56789", celular: "(41) 99100-0005", especialidadeID: 5 },
  ],
  turnos: [
    { turnoNome: "Manha", horarioInicio: "08:00", horarioFim: "12:00" },
    { turnoNome: "Tarde", horarioInicio: "13:00", horarioFim: "18:00" },
  ],
  salas: [
    { salaID: 1, nome: "Sala 101" },
    { salaID: 2, nome: "Sala 102" },
    { salaID: 3, nome: "Sala 201" },
    { salaID: 4, nome: "Sala 202" },
  ],
  pacientes: [
    { pacienteID: 1, nome: "João Pereira", cpf: "111.111.111-11", email: "joao.pereira@email.com", celular: "(41) 98800-1001" },
    { pacienteID: 2, nome: "Maria Oliveira", cpf: "222.222.222-22", email: "maria.oliveira@email.com", celular: "(41) 98800-1002" },
    { pacienteID: 3, nome: "Carlos Santos", cpf: "333.333.333-33", email: "carlos.santos@email.com", celular: "(41) 98800-1003" },
    { pacienteID: 4, nome: "Ana Costa", cpf: "444.444.444-44", email: "ana.costa@email.com", celular: "(41) 98800-1004" },
    { pacienteID: 5, nome: "Pedro Almeida", cpf: "555.555.555-55", email: "pedro.almeida@email.com", celular: "(41) 98800-1005" },
    { pacienteID: 6, nome: "Juliana Ferreira", cpf: "666.666.666-66", email: "juliana.ferreira@email.com", celular: "(41) 98800-1006" },
    { pacienteID: 7, nome: "Lucas Martins", cpf: "777.777.777-77", email: "lucas.martins@email.com", celular: "(41) 98800-1007" },
    { pacienteID: 8, nome: "Fernanda Ribeiro", cpf: "888.888.888-88", email: "fernanda.ribeiro@email.com", celular: "(41) 98800-1008" },
    // Paciente interno usado para representar bloqueios pontuais de agenda.
    { pacienteID: BLOQUEIO_PACIENTE_ID, nome: "— Bloqueio de Agenda —", cpf: "000.000.000-00", email: null, celular: null },
  ],
  disponibilidades: [
    { disponibilidadeID: 1, dia: "Seg", turnoNome: "Manha", profissionalID: 1 },
    { disponibilidadeID: 2, dia: "Qua", turnoNome: "Manha", profissionalID: 1 },
    { disponibilidadeID: 3, dia: "Sex", turnoNome: "Tarde", profissionalID: 1 },
    { disponibilidadeID: 4, dia: "Ter", turnoNome: "Manha", profissionalID: 2 },
    { disponibilidadeID: 5, dia: "Qui", turnoNome: "Manha", profissionalID: 2 },
    { disponibilidadeID: 6, dia: "Seg", turnoNome: "Tarde", profissionalID: 2 },
    { disponibilidadeID: 7, dia: "Qua", turnoNome: "Tarde", profissionalID: 3 },
    { disponibilidadeID: 8, dia: "Sex", turnoNome: "Manha", profissionalID: 3 },
    { disponibilidadeID: 9, dia: "Seg", turnoNome: "Manha", profissionalID: 4 },
    { disponibilidadeID: 10, dia: "Ter", turnoNome: "Tarde", profissionalID: 4 },
    { disponibilidadeID: 11, dia: "Qui", turnoNome: "Tarde", profissionalID: 4 },
    { disponibilidadeID: 12, dia: "Seg", turnoNome: "Tarde", profissionalID: 5 },
    { disponibilidadeID: 13, dia: "Qua", turnoNome: "Manha", profissionalID: 5 },
    { disponibilidadeID: 14, dia: "Qui", turnoNome: "Manha", profissionalID: 5 },
    { disponibilidadeID: 15, dia: "Sex", turnoNome: "Tarde", profissionalID: 5 },
  ],
  consultas: [
    // Passado (estados finais)
    { consultaID: 1, data: "2026-06-08", horario: "09:00", estado: "Realizada", descricao: "Paciente com quadro estável; manter medicação e retorno em 60 dias.", profissionalID: 1, pacienteID: 2, salaID: 1 },
    { consultaID: 2, data: "2026-06-10", horario: "10:00", estado: "Realizada", descricao: "Exame de rotina sem alterações relevantes.", profissionalID: 1, pacienteID: 3, salaID: 1 },
    { consultaID: 3, data: "2026-06-09", horario: "08:30", estado: "Faltou", descricao: null, profissionalID: 2, pacienteID: 4, salaID: 2 },
    { consultaID: 4, data: "2026-06-11", horario: "11:00", estado: "Cancelada", descricao: null, profissionalID: 2, pacienteID: 5, salaID: 2 },
    { consultaID: 5, data: "2026-06-12", horario: "09:00", estado: "Realizada", descricao: "Lesão tratada topicamente; retorno em 30 dias.", profissionalID: 3, pacienteID: 6, salaID: 3 },
    { consultaID: 6, data: "2026-06-15", horario: "08:00", estado: "Realizada", descricao: "Entorse leve; fisioterapia recomendada por 2 semanas.", profissionalID: 4, pacienteID: 7, salaID: 4 },
    { consultaID: 7, data: "2026-06-16", horario: "15:00", estado: "Cancelada", descricao: null, profissionalID: 4, pacienteID: 8, salaID: 4 },
    { consultaID: 8, data: "2026-06-17", horario: "09:00", estado: "Realizada", descricao: "Check-up anual concluído; resultados dentro da normalidade.", profissionalID: 5, pacienteID: 1, salaID: 2 },
    // Futuro (Agendada)
    { consultaID: 9, data: "2026-06-22", horario: "09:00", estado: "Agendada", descricao: null, profissionalID: 1, pacienteID: 1, salaID: 1 },
    { consultaID: 10, data: "2026-06-24", horario: "10:00", estado: "Agendada", descricao: null, profissionalID: 1, pacienteID: 2, salaID: 1 },
    { consultaID: 11, data: "2026-06-23", horario: "08:30", estado: "Agendada", descricao: null, profissionalID: 2, pacienteID: 3, salaID: 2 },
    { consultaID: 12, data: "2026-06-25", horario: "11:00", estado: "Agendada", descricao: null, profissionalID: 2, pacienteID: 4, salaID: 2 },
    { consultaID: 13, data: "2026-06-24", horario: "14:00", estado: "Agendada", descricao: null, profissionalID: 3, pacienteID: 5, salaID: 3 },
    { consultaID: 14, data: "2026-06-26", horario: "09:00", estado: "Agendada", descricao: null, profissionalID: 3, pacienteID: 6, salaID: 3 },
    { consultaID: 15, data: "2026-06-22", horario: "08:00", estado: "Agendada", descricao: null, profissionalID: 4, pacienteID: 7, salaID: 4 },
    { consultaID: 16, data: "2026-06-25", horario: "15:00", estado: "Agendada", descricao: null, profissionalID: 4, pacienteID: 8, salaID: 4 },
    { consultaID: 17, data: "2026-06-22", horario: "14:00", estado: "Agendada", descricao: null, profissionalID: 5, pacienteID: 1, salaID: 2 },
    // Bloqueios pontuais (Consulta reservada ao paciente interno de bloqueio)
    { consultaID: 18, data: "2026-06-22", horario: "10:00", estado: "Agendada", descricao: "Reunião clínica", profissionalID: 1, pacienteID: BLOQUEIO_PACIENTE_ID, salaID: 1 },
    { consultaID: 19, data: "2026-06-22", horario: "10:30", estado: "Agendada", descricao: "Reunião clínica", profissionalID: 1, pacienteID: BLOQUEIO_PACIENTE_ID, salaID: 1 },
  ],
};
