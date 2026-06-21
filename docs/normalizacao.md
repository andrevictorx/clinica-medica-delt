# Análise de Normalização — Clínica Médica DELT

Avaliação do banco quanto às três primeiras formas normais (1FN, 2FN e 3FN),
com base no esquema em [`sql/schema.sql`](../sql/schema.sql).

> **Resumo:** o banco **atende** à 1FN, à 2FN e à 3FN.

---

## a) Primeira Forma Normal (1FN) — **SIM**

> *Uma tabela está na 1FN se todos os campos contêm valores atômicos
> (indivisíveis) e não há grupos repetidos.*

Todas as sete tabelas (`Especialidade`, `Profissional`, `Turno`,
`Disponibilidade`, `Paciente`, `Sala`, `Consulta`) possuem chave primária
definida e **somente atributos atômicos**:

- Não há colunas multivaloradas nem listas embutidas. Por exemplo, em vez de
  guardar várias disponibilidades de um médico em um único campo, cada par
  *(dia, turno)* é uma **linha** distinta na tabela `Disponibilidade`. A relação
  1:N entre `Profissional` e `Disponibilidade` elimina o grupo repetido.
- Campos como `Paciente.cpf`, `Paciente.celular`, `Profissional.crm` e
  `Consulta.horario` armazenam **um único valor** cada.
- Não existem colunas do tipo `telefone1`, `telefone2`… (que caracterizariam
  grupos repetidos).

Portanto, não há grupos repetidos e todos os valores são atômicos → **1FN atendida**.

---

## b) Segunda Forma Normal (2FN) — **SIM**

> *Uma tabela está na 2FN se está na 1FN e todos os atributos não-chave
> dependem da chave primária inteira (sem dependências parciais).*

Toda dependência parcial pressupõe uma **chave primária composta**. No nosso
projeto, **todas as tabelas têm chave primária simples** (um único atributo):

| Tabela | Chave primária |
|---|---|
| Especialidade | `especialidadeID` |
| Profissional | `profissionalID` |
| Turno | `turnoNome` |
| Disponibilidade | `disponibilidadeID` |
| Paciente | `pacienteID` |
| Sala | `salaID` |
| Consulta | `consultaID` |

Como não há chave composta, **não pode existir dependência parcial** — todo
atributo não-chave depende da chave inteira por construção. Em `Consulta`, por
exemplo, `data`, `horario`, `estado` e `descricao` dependem unicamente de
`consultaID`; as FKs `profissionalID`, `pacienteID` e `salaID` apenas referenciam
outras tabelas, sem formar chave composta → **2FN atendida**.

---

## c) Terceira Forma Normal (3FN) — **SIM**

> *Uma tabela está na 3FN se está na 2FN e nenhum atributo não-chave depende
> transitivamente da chave primária (não há dependência entre atributos não-chave).*

Verificamos cada tabela e **não há dependências transitivas**, porque dados que
pertencem a outra entidade foram extraídos para a sua própria tabela e
referenciados por chave estrangeira, em vez de duplicados:

- **Profissional** — `nome`, `crm`, `celular` dependem apenas de
  `profissionalID`. O nome da especialidade **não** é repetido aqui: guarda-se
  apenas `especialidadeID` (FK) e o nome fica em `Especialidade`. Sem
  dependência transitiva.
- **Consulta** — `data`, `horario`, `estado`, `descricao` dependem só de
  `consultaID`. **Não** se armazena o nome do paciente, do profissional, da
  especialidade ou da sala dentro de `Consulta`; tudo é obtido via JOIN pelas
  FKs. Assim evita-se, por exemplo, a dependência transitiva
  `consultaID → profissionalID → nomeProfissional`.
- **Disponibilidade** — `dia`, `turnoNome`, `profissionalID` dependem de
  `disponibilidadeID`. Os horários do turno **não** são copiados para cá; ficam
  em `Turno` e são referenciados por `turnoNome` (FK).
- **Turno** — `horarioInicio` e `horarioFim` dependem diretamente de
  `turnoNome`. Como `turnoNome` é a chave, a dependência é direta, não transitiva.
- **Especialidade**, **Paciente** e **Sala** — atributos descritivos dependem
  diretamente de suas chaves; não há atributo não-chave determinando outro.

Logo, nenhum atributo não-chave depende de outro atributo não-chave → **3FN atendida**.

---

### Conclusão

O modelo foi projetado de forma normalizada desde a fase de modelagem: cada
entidade do domínio (especialidade, profissional, turno, disponibilidade,
paciente, sala, consulta) tornou-se uma tabela própria, com chaves simples e
relacionamentos por chave estrangeira. Isso elimina redundância e anomalias de
inserção/atualização/exclusão, satisfazendo **1FN, 2FN e 3FN**.
