# Roteiro do vídeo de entrega — Clínica Médica DELT

Demonstração para a avaliação (`FormEntrega_TrabClinicaMedica.docx` +
`Rubrica_BD_ClinicaMedica.pdf`). **Duração-alvo: ~10 min** (8 ±2).

> **Narrativa central (decore esta frase):** *"O coração do projeto é o banco
> SQLite. Sobre o MESMO banco e as MESMAS queries existem duas interfaces: o
> programa em console — que implementa as 5 funcionalidades da rubrica — e um
> frontend web que consome exatamente a mesma estrutura de 7 tabelas."*
>
> Cada funcionalidade é mostrada **três vezes**: (1) a **query SQL** que a
> resolve, (2) o **programa console** executando, (3) o **frontend** consumindo
> a mesma estrutura. O foco da fala é sempre **o banco**.

## Como o vídeo prova cada exigência da rubrica

| Item da rubrica | O que o avaliador quer ver | Onde mostramos |
|---|---|---|
| DER (1,0) | DER no início, correto, explicado (entidades/atributos/relacionamentos + escolhas) | Cap. 1 |
| 1. Agendar (2,0) | pede paciente/profissional/data/horário/sala; valida disponibilidade + 3 conflitos; impede inválido; status "Agendada"; SELECT+INSERT | Cap. 4 |
| 2. Listar do dia (1,5) | por data; horário/paciente/profissional/sala/status; ordenado por horário; JOIN | Cap. 5 |
| 3. Histórico (2,0) | por **CPF**; data/horário/profissional/especialidade/sala/status/observações; ordem decrescente; JOIN | Cap. 6 |
| 4. Alterar status (2,0) | lista, seleciona; 4 estados; "Realizada" pede observações; realizada vira imutável; UPDATE | Cap. 7 |
| 5. Relatório (1,5) | por profissional: total/realizadas/cancelamentos/faltas/futuras; GROUP BY + COUNT + JOIN | Cap. 8 |

---

## Pré-gravação (deixar aberto)

- **Janela 1 — DER:** `docs/der.png` em tela cheia.
- **Janela 2 — Editor (VS Code):** abrir `sql/schema.sql`, `src/clinica/repositories.py`,
  `src/clinica/services.py` e, do frontend, `src/data/store.tsx`.
- **Janela 3 — Terminal A (programa):** na raiz, pronto para `python main.py`.
- **Janela 4 — Terminal B (SQLite):** `sqlite3 clinica_medica.db` aberto, com
  `.headers on` e `.mode column` já digitados (banco responde "ao vivo").
- **Janela 5 — Navegador:** `npm run dev` no frontend, em `localhost:5173`.

## Índice de capítulos (colar na descrição do YouTube — o 1º item deve ser 00:00)

```
00:00 Apresentação da equipe e da arquitetura
00:40 Diagrama Entidade-Relacionamento (DER) e normalização
02:30 Visão geral do código (camadas) e o banco SQLite
03:30 1. Agendar consulta — validações, SELECT e INSERT
05:10 2. Listar consultas do dia — JOIN + ORDER BY
05:55 3. Histórico do paciente por CPF — múltiplos JOIN
06:50 4. Alterar status — UPDATE e regra de imutabilidade
07:45 5. Relatório por profissional — GROUP BY + COUNT
08:40 Frontend web: como a interface conversa com o banco
09:40 Funcionalidades bônus e encerramento
```

## Divisão entre os integrantes (todos falam)

| Capítulos | Responsável |
|---|---|
| 0–2 (abertura, DER, normalização) | **André Victor** |
| 3–5 (camadas + Agendar + Listar) | **Gabriel Silverio** |
| 6–10 (Histórico, Status, Relatório, Frontend, bônus) | **Patrick Henrique** |

---

# Roteiro detalhado (Tela ▸ Fala ▸ Query/Código)

## 00:00 — Abertura · *André*
- **[TELA]** Frontend na tela de escolha de perfil (visual bonito) → depois `docs/der.png`.
- **[FALA]** "Somos André, Gabriel e Patrick. Desenvolvemos a Clínica Médica DELT:
  um banco de dados SQLite com 7 tabelas e duas interfaces sobre ele — um programa
  em Python no console e um frontend web. **Tudo gira em torno do banco**: as duas
  interfaces usam a mesma modelagem e as mesmas regras."

## 00:40 — DER e normalização · *André* · (rubrica DER, 1,0)
- **[TELA]** `docs/der.png` (Crow's Foot). Ir apontando com o cursor cada entidade.
- **[FALA — entidades]** "Sete entidades: **Especialidade, Profissional, Turno,
  Disponibilidade, Paciente, Sala e Consulta**. A entidade central é **Consulta**,
  que conecta um profissional, um paciente e uma sala em uma data e horário."
- **[FALA — relacionamentos 1:N]** "Os relacionamentos são todos 1:N:
  uma Especialidade tem vários Profissionais; um Profissional tem várias
  Disponibilidades e várias Consultas; um Turno aparece em várias Disponibilidades;
  Paciente e Sala também se ligam a várias Consultas. Repare na notação pé-de-galinha:
  o lado 'muitos' fica em Consulta e Disponibilidade."
- **[FALA — escolha de modelagem]** "Decisão importante: **disponibilidade** é
  modelada como *(dia da semana + turno)* — por isso existe a tabela `Turno`, que
  define a faixa de horário. Isso evita repetir horários e é o que permite validar
  o agendamento depois."
- **[FALA — normalização]** "O banco está em **1FN** (todos os campos atômicos,
  sem grupos repetidos — cada disponibilidade é uma linha), **2FN** (todas as
  chaves primárias são simples, então não há dependência parcial) e **3FN**
  (nenhum dado de outra entidade é duplicado: guardamos `especialidadeID` em
  Profissional, não o nome; em Consulta guardamos as FKs, não nomes)."
- **[TELA]** Mostrar rapidamente `docs/normalizacao.md` rolando.

## 02:30 — Camadas e o banco · *Gabriel*
- **[TELA]** Estrutura de pastas no VS Code; abrir `sql/schema.sql`.
- **[FALA]** "O banco é criado por `sql/schema.sql`. Note os `FOREIGN KEY` e o
  `CHECK(estado IN ('Agendada','Realizada','Cancelada','Faltou'))` — a integridade
  é garantida no próprio SQLite, não só no código."
- **[TELA]** Abrir `src/clinica/` e mostrar os arquivos.
- **[FALA]** "O código é em camadas: **`repositories.py`** concentra TODO o SQL,
  **`services.py`** tem as regras de negócio, e `cli.py`/`ui.py` a interface. Isso
  é proposital: a mesma regra pode ser usada pelo console e, no futuro, por uma API
  para o frontend. Vou mostrar cada funcionalidade pela query e pelo programa rodando."
- **[TELA]** `python main.py` no Terminal A → menu aparece.

## 03:30 — 1. Agendar consulta · *Gabriel* · (rubrica 1, 2,0)
- **[TELA]** Menu → opção **1**. Preencher paciente, profissional, data, horário, sala.
- **[FALA — o que valida]** "Antes de inserir, o sistema faz **quatro validações**,
  todas como `SELECT` no banco."
- **[TELA]** Abrir `repositories.py` e mostrar, nesta ordem:
  - `turno_do_horario` → `SELECT turnoNome FROM Turno WHERE horarioInicio <= ? AND ? < horarioFim`
  - `profissional_disponivel` → `SELECT 1 FROM Disponibilidade WHERE profissionalID=? AND dia=? AND turnoNome=?`
  - `conflito_profissional/_sala/_paciente` → `... FROM Consulta WHERE <campo>=? AND data=? AND horario=? AND estado IN ('Agendada','Realizada')`
- **[FALA]** "Primeiro, qual turno contém o horário. Depois, se o profissional
  **atende** naquele dia da semana e turno (tabela Disponibilidade). Por fim, três
  checagens de conflito — profissional, sala e paciente — considerando só consultas
  **ativas** (Agendada ou Realizada)."
- **[TELA]** Provocar um conflito de propósito (ex.: horário já ocupado) → mostrar a
  mensagem de bloqueio. Depois fazer um agendamento **válido**.
- **[FALA]** "Conflito → o sistema **impede** e explica o motivo. Válido → executa o
  `INSERT` com estado inicial **'Agendada'**."
- **[TELA]** `repositories.inserir_consulta` (o `INSERT ... VALUES (?, ?, 'Agendada', ...)`).
- **[TELA — banco ao vivo · Terminal B]** Rodar
  `SELECT consultaID, data, horario, estado FROM Consulta ORDER BY consultaID DESC LIMIT 1;`
  e mostrar a consulta recém-criada com estado 'Agendada'.

## 05:10 — 2. Listar consultas do dia · *Gabriel* · (rubrica 2, 1,5)
- **[TELA]** Menu → opção **2** → informar `2026-06-22`.
- **[FALA]** "Listagem por data, com **JOIN** entre Consulta, Paciente, Profissional
  e Sala, **ordenada por horário**."
- **[TELA]** `repositories.consultas_do_dia` — destacar os `JOIN` e o `ORDER BY c.horario`.
- **[TELA — Terminal B]** Rodar a mesma query no sqlite3 para o banco responder ao vivo.

## 05:55 — 3. Histórico do paciente · *Patrick* · (rubrica 3, 2,0)
- **[TELA]** Menu → opção **3** → CPF `111.111.111-11`.
- **[FALA]** "Busca pelo **CPF**. Aqui há **quatro JOINs** — inclusive com
  `Especialidade` (via Profissional) — e a ordem é **cronológica decrescente**
  (`ORDER BY data DESC, horario DESC`). Mostramos data, horário, profissional,
  especialidade, sala, status e as **observações** do médico."
- **[TELA]** `repositories.historico_por_cpf` — apontar os JOINs e o ORDER BY.

## 06:50 — 4. Alterar status · *Patrick* · (rubrica 4, 2,0)
- **[TELA]** Menu → opção **4** → listar consultas → escolher uma 'Agendada' → marcar **Realizada**.
- **[FALA]** "São quatro estados. Ao marcar como **Realizada**, o sistema **exige as
  observações** médicas. E uma consulta já realizada **não pode mais ser alterada** —
  essa regra está em `services.alterar_status`."
- **[TELA]** Tentar alterar uma consulta já 'Realizada' → mostrar o bloqueio.
- **[TELA]** `repositories.atualizar_status` → `UPDATE Consulta SET estado=?, descricao=? WHERE consultaID=?`.
- **[TELA — Terminal B]** `SELECT estado, descricao FROM Consulta WHERE consultaID=<id>;` confirmando o UPDATE.

## 07:45 — 5. Relatório por profissional · *Patrick* · (rubrica 5, 1,5)
- **[TELA]** Menu → opção **5** → relatório.
- **[FALA]** "Relatório estatístico com **GROUP BY** por profissional, **COUNT** e
  `SUM(CASE WHEN ...)` para contar realizadas, cancelamentos e faltas, além das
  **consultas futuras** agendadas. Um `LEFT JOIN` garante que um profissional sem
  consultas também apareça (zerado)."
- **[TELA]** `repositories.estatisticas_por_profissional` (o SELECT com GROUP BY/COUNT/CASE)
  e `consultas_futuras_do_profissional`.
- **[TELA — Terminal B]** Rodar
  `SELECT estado, COUNT(*) FROM Consulta GROUP BY estado;` para o banco responder ao vivo.

## 08:40 — Frontend: como conversa com o banco · *Patrick*
- **[TELA]** Navegador → entrar como **Paciente**.
- **[FALA — relação com o banco]** "O frontend é a camada visual sobre o **mesmo
  banco**. A regra que mais importa: ao agendar, só aparecem horários que **cruzam a
  `Disponibilidade` do médico** e que **não estão ocupados** — exatamente a lógica do
  console. Verde = livre, vermelho = ocupado/bloqueado."
- **[TELA]** Buscar um médico (autocomplete) → filtrar por especialidade → escolher
  uma data no calendário → ver os slots de 30 min (verdes/vermelhos) → confirmar.
- **[TELA]** Abrir `frontend/src/data/store.tsx` → função `agendar` (mesmas 4
  validações) e `slotsDoDia` (interseção Disponibilidade × consultas ativas).
- **[FALA — integridade do esquema]** "Ponto importante para a modelagem: **não
  alteramos o esquema**. O *padrão semanal* do médico vira linhas em
  `Disponibilidade`; um agendamento é um `INSERT` em `Consulta` com estado
  'Agendada'. E os **bloqueios de agenda**, que não têm tabela própria, são
  `Consulta` reservadas a um paciente interno — o slot fica ocupado sem inventar
  tabela nova."
- **[TELA]** Entrar como **Médico** → agenda semanal em blocos de 30 min (cartões
  clicáveis) → aba "Meus horários": ligar/desligar turnos (Disponibilidade) e criar
  um bloqueio. Mostrar que o bloqueio deixa o horário vermelho/indisponível.
- **[FALA]** "Na integração final, só trocamos o `store` por chamadas a uma API que
  fala com o SQLite — a interface continua igual."

## 09:40 — Bônus e encerramento · *equipe*
- **[FALA]** "Como diferenciais: testes automatizados (`pytest`, 25 casos) cobrindo
  as regras, CI no GitHub Actions, o DER gerado por script, e funções extras de
  cadastro. Tudo público no repositório **github.com/andrevictorx/clinica-medica-delt**."
- **[TELA]** Rodar `pytest -q` (tudo verde) e mostrar o repositório.
- **[FALA]** Encerrar agradecendo e comentando o aprendizado (chaves, JOINs,
  normalização e integridade aplicada na prática).

---

### Checklist final antes de subir
- [ ] Vídeo **começa pelo DER**. ✔ exigência da rubrica
- [ ] As 5 funcionalidades aparecem **rodando** + **a query** + **o banco respondendo**.
- [ ] Os três integrantes falaram.
- [ ] Vídeo **público/não-listado**; testar o link em navegador deslogado.
- [ ] Índice de capítulos colado na descrição (primeiro item `00:00`).
