# Dicionário de Dados — Clínica Médica DELT

Documentação das tabelas, atributos e relacionamentos do banco
(ver DDL em [`sql/schema.sql`](../sql/schema.sql) e o DER em [`der.png`](der.png)).

## A) Tabelas

| Tabela | Descrição |
|---|---|
| `Especialidade` | Especialidades médicas (Cardiologia, Pediatria…). |
| `Profissional` | Profissionais de saúde; cada um pertence a uma especialidade. |
| `Turno` | Faixas de horário de atendimento (Manhã, Tarde). |
| `Disponibilidade` | Dias da semana e turnos em que cada profissional atende. |
| `Paciente` | Pacientes da clínica. |
| `Sala` | Salas de atendimento. |
| `Consulta` | Consultas: ligam profissional, paciente e sala em data/horário, com estado e observações. |

## B) Atributos

| Tabela | Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|---|
| Especialidade | especialidadeID | INTEGER | PK | Identificador da especialidade. |
| | nome | TEXT | NOT NULL | Nome da especialidade. |
| Profissional | profissionalID | INTEGER | PK | Identificador do profissional. |
| | nome | TEXT | NOT NULL | Nome do profissional. |
| | crm | TEXT | NOT NULL | Registro no conselho (CRM). |
| | celular | TEXT | | Telefone de contato. |
| | especialidadeID | INTEGER | FK, NOT NULL | Especialidade do profissional. |
| Turno | turnoNome | TEXT | PK | Nome do turno (ex.: "Manha"). |
| | horarioInicio | TEXT | NOT NULL | Início do turno (HH:MM). |
| | horarioFim | TEXT | NOT NULL | Fim do turno (HH:MM). |
| Disponibilidade | disponibilidadeID | INTEGER | PK | Identificador da disponibilidade. |
| | dia | TEXT | NOT NULL | Dia da semana (Seg, Ter…). |
| | turnoNome | TEXT | FK, NOT NULL | Turno associado. |
| | profissionalID | INTEGER | FK, NOT NULL | Profissional associado. |
| Paciente | pacienteID | INTEGER | PK | Identificador do paciente. |
| | nome | TEXT | NOT NULL | Nome do paciente. |
| | cpf | TEXT | NOT NULL | CPF do paciente. |
| | email | TEXT | | E-mail do paciente. |
| | celular | TEXT | | Telefone do paciente. |
| Sala | salaID | INTEGER | PK | Identificador da sala. |
| | nome | TEXT | NOT NULL | Nome/identificação da sala. |
| Consulta | consultaID | INTEGER | PK | Identificador da consulta. |
| | data | TEXT | NOT NULL | Data da consulta (AAAA-MM-DD). |
| | horario | TEXT | NOT NULL | Horário da consulta (HH:MM). |
| | estado | TEXT | NOT NULL, CHECK | Agendada / Realizada / Cancelada / Faltou. |
| | descricao | TEXT | | Observações médicas. |
| | profissionalID | INTEGER | FK, NOT NULL | Profissional responsável. |
| | pacienteID | INTEGER | FK, NOT NULL | Paciente atendido. |
| | salaID | INTEGER | FK, NOT NULL | Sala da consulta. |

## C) Relacionamentos

| Relacionamento | Lado 1 (PK) | Lado N (FK) | Cardinalidade |
|---|---|---|---|
| possui | Especialidade | Profissional | 1 : N |
| pertence | Profissional | Disponibilidade | 1 : N |
| possui | Turno | Disponibilidade | 1 : N |
| pertence | Profissional | Consulta | 1 : N |
| possui | Paciente | Consulta | 1 : N |
| acontece em | Sala | Consulta | 1 : N |

## Regras de negócio principais

1. Uma consulta só é agendada se o profissional tiver **disponibilidade** no dia
   da semana e turno correspondentes ao horário pedido.
2. Não pode haver duas consultas ativas (Agendada/Realizada) no mesmo horário
   para o mesmo **profissional**, **sala** ou **paciente**.
3. Toda consulta nasce com estado **Agendada**.
4. Estados possíveis: **Agendada → Realizada / Cancelada / Faltou**. Ao marcar
   como **Realizada**, as observações médicas são obrigatórias e a consulta
   **não pode mais ser alterada**.
