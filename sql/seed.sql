-- =========================================================
--  Clínica Médica DELT — Dados de teste (povoamento)
--  TE 901 — Banco de Dados para Sistemas Embarcados (UFPR)
--
--  Datas de referência: junho/2026. 2026-06-21 é domingo.
--  Consultas anteriores a 21/06 já têm estado final
--  (Realizada / Cancelada / Faltou); as posteriores estão
--  "Agendada" e respeitam a disponibilidade do profissional.
-- =========================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------
-- Especialidades
-- ---------------------------------------------------------
INSERT INTO Especialidade (especialidadeID, nome) VALUES
    (1, 'Cardiologia'),
    (2, 'Pediatria'),
    (3, 'Dermatologia'),
    (4, 'Ortopedia'),
    (5, 'Clínica Geral');

-- ---------------------------------------------------------
-- Profissionais (cada um com uma especialidade)
-- ---------------------------------------------------------
INSERT INTO Profissional (profissionalID, nome, crm, celular, especialidadeID) VALUES
    (1, 'Dra. Helena Marques',  'CRM/PR 12345', '(41) 99100-0001', 1),
    (2, 'Dr. Rafael Lima',      'CRM/PR 23456', '(41) 99100-0002', 2),
    (3, 'Dra. Beatriz Souza',   'CRM/PR 34567', '(41) 99100-0003', 3),
    (4, 'Dr. Thiago Nunes',     'CRM/PR 45678', '(41) 99100-0004', 4),
    (5, 'Dra. Camila Rocha',    'CRM/PR 56789', '(41) 99100-0005', 5);

-- ---------------------------------------------------------
-- Turnos (definem as faixas de horário de atendimento)
-- ---------------------------------------------------------
INSERT INTO Turno (turnoNome, horarioInicio, horarioFim) VALUES
    ('Manha', '08:00', '12:00'),
    ('Tarde', '13:00', '18:00');

-- ---------------------------------------------------------
-- Salas
-- ---------------------------------------------------------
INSERT INTO Sala (salaID, nome) VALUES
    (1, 'Sala 101'),
    (2, 'Sala 102'),
    (3, 'Sala 201'),
    (4, 'Sala 202');

-- ---------------------------------------------------------
-- Pacientes
-- ---------------------------------------------------------
INSERT INTO Paciente (pacienteID, nome, cpf, email, celular) VALUES
    (1, 'João Pereira',      '111.111.111-11', 'joao.pereira@email.com',    '(41) 98800-1001'),
    (2, 'Maria Oliveira',    '222.222.222-22', 'maria.oliveira@email.com',  '(41) 98800-1002'),
    (3, 'Carlos Santos',     '333.333.333-33', 'carlos.santos@email.com',   '(41) 98800-1003'),
    (4, 'Ana Costa',         '444.444.444-44', 'ana.costa@email.com',       '(41) 98800-1004'),
    (5, 'Pedro Almeida',     '555.555.555-55', 'pedro.almeida@email.com',   '(41) 98800-1005'),
    (6, 'Juliana Ferreira',  '666.666.666-66', 'juliana.ferreira@email.com','(41) 98800-1006'),
    (7, 'Lucas Martins',     '777.777.777-77', 'lucas.martins@email.com',   '(41) 98800-1007'),
    (8, 'Fernanda Ribeiro',  '888.888.888-88', 'fernanda.ribeiro@email.com','(41) 98800-1008');

-- ---------------------------------------------------------
-- Disponibilidades (dia da semana + turno por profissional)
-- ---------------------------------------------------------
INSERT INTO Disponibilidade (disponibilidadeID, dia, turnoNome, profissionalID) VALUES
    (1,  'Seg', 'Manha', 1),
    (2,  'Qua', 'Manha', 1),
    (3,  'Sex', 'Tarde', 1),
    (4,  'Ter', 'Manha', 2),
    (5,  'Qui', 'Manha', 2),
    (6,  'Seg', 'Tarde', 2),
    (7,  'Qua', 'Tarde', 3),
    (8,  'Sex', 'Manha', 3),
    (9,  'Seg', 'Manha', 4),
    (10, 'Ter', 'Tarde', 4),
    (11, 'Qui', 'Tarde', 4),
    (12, 'Seg', 'Tarde', 5),
    (13, 'Qua', 'Manha', 5),
    (14, 'Qui', 'Manha', 5),
    (15, 'Sex', 'Tarde', 5);

-- ---------------------------------------------------------
-- Consultas
-- Passado (estados finais) — antes de 2026-06-21
-- ---------------------------------------------------------
INSERT INTO Consulta (consultaID, data, horario, estado, descricao, profissionalID, pacienteID, salaID) VALUES
    (1, '2026-06-08', '09:00', 'Realizada', 'Paciente com quadro estável; manter medicação e retorno em 60 dias.', 1, 2, 1),
    (2, '2026-06-10', '10:00', 'Realizada', 'Exame de rotina sem alterações relevantes.',                          1, 3, 1),
    (3, '2026-06-09', '08:30', 'Faltou',    NULL,                                                                  2, 4, 2),
    (4, '2026-06-11', '11:00', 'Cancelada', NULL,                                                                  2, 5, 2),
    (5, '2026-06-12', '09:00', 'Realizada', 'Lesão tratada topicamente; retorno em 30 dias.',                      3, 6, 3),
    (6, '2026-06-15', '08:00', 'Realizada', 'Entorse leve; fisioterapia recomendada por 2 semanas.',               4, 7, 4),
    (7, '2026-06-16', '15:00', 'Cancelada', NULL,                                                                  4, 8, 4),
    (8, '2026-06-17', '09:00', 'Realizada', 'Check-up anual concluído; resultados dentro da normalidade.',         5, 1, 2);

-- ---------------------------------------------------------
-- Futuro (Agendada) — a partir de 2026-06-22, respeitando
-- a disponibilidade (dia da semana + turno) de cada médico
-- ---------------------------------------------------------
INSERT INTO Consulta (consultaID, data, horario, estado, descricao, profissionalID, pacienteID, salaID) VALUES
    (9,  '2026-06-22', '09:00', 'Agendada', NULL, 1, 1, 1),  -- Seg/Manha
    (10, '2026-06-24', '10:00', 'Agendada', NULL, 1, 2, 1),  -- Qua/Manha
    (11, '2026-06-23', '08:30', 'Agendada', NULL, 2, 3, 2),  -- Ter/Manha
    (12, '2026-06-25', '11:00', 'Agendada', NULL, 2, 4, 2),  -- Qui/Manha
    (13, '2026-06-24', '14:00', 'Agendada', NULL, 3, 5, 3),  -- Qua/Tarde
    (14, '2026-06-26', '09:00', 'Agendada', NULL, 3, 6, 3),  -- Sex/Manha
    (15, '2026-06-22', '08:00', 'Agendada', NULL, 4, 7, 4),  -- Seg/Manha
    (16, '2026-06-25', '15:00', 'Agendada', NULL, 4, 8, 4),  -- Qui/Tarde
    (17, '2026-06-22', '14:00', 'Agendada', NULL, 5, 1, 2);  -- Seg/Tarde
