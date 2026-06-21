-- =========================================================
--  Clínica Médica DELT — Esquema do banco (DDL)
--  TE 901 — Banco de Dados para Sistemas Embarcados (UFPR)
--
--  SGBD: SQLite 3
--  Convenção: nomes de tabela em PascalCase, colunas em
--  camelCase, mantendo o modelo lógico entregue na fase de
--  modelagem (ver docs/dicionario-dados.md).
-- =========================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------
-- Especialidade médica (Cardiologia, Pediatria, ...)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS Especialidade (
    especialidadeID INTEGER PRIMARY KEY,
    nome            TEXT NOT NULL
);

-- ---------------------------------------------------------
-- Profissional de saúde. Cada profissional pertence a uma
-- única especialidade (1:N a partir de Especialidade).
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS Profissional (
    profissionalID  INTEGER PRIMARY KEY,
    nome            TEXT NOT NULL,
    crm             TEXT NOT NULL,
    celular         TEXT,
    especialidadeID INTEGER NOT NULL,
    FOREIGN KEY (especialidadeID) REFERENCES Especialidade (especialidadeID)
);

-- ---------------------------------------------------------
-- Turno de trabalho. A PK é o próprio nome do turno
-- (ex.: "Manha", "Tarde"); define a faixa de horário.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS Turno (
    turnoNome      TEXT PRIMARY KEY,
    horarioInicio  TEXT NOT NULL,
    horarioFim     TEXT NOT NULL
);

-- ---------------------------------------------------------
-- Disponibilidade semanal do profissional: em qual dia da
-- semana e em qual turno ele atende. (Profissional 1:N) e
-- (Turno 1:N).
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS Disponibilidade (
    disponibilidadeID INTEGER PRIMARY KEY,
    dia               TEXT NOT NULL,
    turnoNome         TEXT NOT NULL,
    profissionalID    INTEGER NOT NULL,
    FOREIGN KEY (turnoNome)      REFERENCES Turno (turnoNome),
    FOREIGN KEY (profissionalID) REFERENCES Profissional (profissionalID)
);

-- ---------------------------------------------------------
-- Paciente da clínica.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS Paciente (
    pacienteID  INTEGER PRIMARY KEY,
    nome        TEXT NOT NULL,
    cpf         TEXT NOT NULL,
    email       TEXT,
    celular     TEXT
);

-- ---------------------------------------------------------
-- Sala de atendimento.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS Sala (
    salaID  INTEGER PRIMARY KEY,
    nome    TEXT NOT NULL
);

-- ---------------------------------------------------------
-- Consulta: associa profissional, paciente e sala em uma
-- data/horário, com estado e observações do médico.
-- Estados possíveis: Agendada, Realizada, Cancelada, Faltou.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS Consulta (
    consultaID     INTEGER PRIMARY KEY,
    data           TEXT NOT NULL,
    horario        TEXT NOT NULL,
    estado         TEXT NOT NULL DEFAULT 'Agendada'
                   CHECK (estado IN ('Agendada', 'Realizada', 'Cancelada', 'Faltou')),
    descricao      TEXT,
    profissionalID INTEGER NOT NULL,
    pacienteID     INTEGER NOT NULL,
    salaID         INTEGER NOT NULL,
    FOREIGN KEY (profissionalID) REFERENCES Profissional (profissionalID),
    FOREIGN KEY (pacienteID)     REFERENCES Paciente     (pacienteID),
    FOREIGN KEY (salaID)         REFERENCES Sala         (salaID)
);
