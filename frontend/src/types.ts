/**
 * Tipos que espelham EXATAMENTE o esquema do banco (sql/schema.sql).
 * Proibido alterar tabelas/colunas/chaves — o frontend apenas consome e
 * insere dados respeitando esta estrutura.
 */

export interface Especialidade {
  especialidadeID: number;
  nome: string;
}

export interface Profissional {
  profissionalID: number;
  nome: string;
  crm: string;
  celular: string | null;
  especialidadeID: number;
}

export interface Turno {
  turnoNome: string;       // PK (ex.: "Manha", "Tarde")
  horarioInicio: string;   // "HH:MM"
  horarioFim: string;      // "HH:MM"
}

export interface Disponibilidade {
  disponibilidadeID: number;
  dia: string;             // dia da semana: Seg, Ter, Qua, Qui, Sex, Sab, Dom
  turnoNome: string;       // FK -> Turno
  profissionalID: number;  // FK -> Profissional
}

export interface Paciente {
  pacienteID: number;
  nome: string;
  cpf: string;
  email: string | null;
  celular: string | null;
}

export interface Sala {
  salaID: number;
  nome: string;
}

export type EstadoConsulta = "Agendada" | "Realizada" | "Cancelada" | "Faltou";

export interface Consulta {
  consultaID: number;
  data: string;            // "AAAA-MM-DD"
  horario: string;         // "HH:MM"
  estado: EstadoConsulta;
  descricao: string | null;
  profissionalID: number;  // FK
  pacienteID: number;      // FK
  salaID: number;          // FK
}

export interface Banco {
  especialidades: Especialidade[];
  profissionais: Profissional[];
  turnos: Turno[];
  disponibilidades: Disponibilidade[];
  pacientes: Paciente[];
  salas: Sala[];
  consultas: Consulta[];
}

/**
 * Bloqueios pontuais de agenda NÃO têm tabela própria (não se altera o
 * esquema). São representados como uma Consulta reservada para um paciente
 * interno "— Bloqueio de Agenda —". Este ID identifica esse paciente.
 */
export const BLOQUEIO_PACIENTE_ID = 99;

/** Dias da semana na convenção de Disponibilidade.dia (segunda = índice 0). */
export const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];
