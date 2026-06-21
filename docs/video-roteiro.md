# Roteiro do vídeo de entrega (~8 min) — Clínica Médica DELT

Demonstração exigida pelo `FormEntrega_TrabClinicaMedica.docx`. O vídeo deve
**começar pelo DER**, percorrer as 5 funcionalidades da rubrica, mostrar código
e o banco respondendo a uma query. **Todos os integrantes** devem falar.

> Antes de gravar: `python main.py` cria/popula o banco automaticamente. Tenha
> também um terminal aberto em `sqlite3 clinica_medica.db` para mostrar uma query.

## Índice de capítulos (cole na descrição do vídeo no YouTube)

Para criar o índice, o primeiro item **deve** ser `00:00`. Cole exatamente assim:

```
00:00 Apresentação da equipe e do projeto
00:30 Diagrama Entidade-Relacionamento (DER)
02:00 Visão geral do código (arquitetura em camadas)
03:00 1. Agendar nova consulta (e validações de conflito)
04:30 2. Listar consultas do dia
05:15 3. Consultar histórico de um paciente
06:00 4. Alterar status de uma consulta
07:00 5. Relatório de atendimentos por profissional
07:45 Banco respondendo a uma query (sqlite3) + bônus
08:15 Encerramento
```

## Divisão sugerida entre os integrantes

| Trecho | Responsável |
|---|---|
| Abertura + DER + normalização | **André Victor** |
| Arquitetura do código + funções 1 e 2 | **Gabriel Silverio** |
| Funções 3, 4, 5 + query no sqlite3 + bônus | **Patrick Henrique** |

## Roteiro detalhado

**00:00 — Abertura.** "Somos André, Gabriel e Patrick. Este é o projeto da
Clínica Médica DELT, um sistema de agendamento em Python + SQLite."

**00:30 — DER.** Mostrar `docs/der.png`. Explicar as 7 entidades e os
relacionamentos 1:N (Especialidade→Profissional, Profissional→Disponibilidade,
Turno→Disponibilidade, Profissional/Paciente/Sala→Consulta). Citar que o modelo
está em 1FN/2FN/3FN (resumir `docs/normalizacao.md`).

**02:00 — Código.** Abrir `src/clinica/` e explicar as camadas: `database`
(conexão + PRAGMA foreign_keys), `repositories` (todo o SQL), `services`
(regras de negócio) e `cli`/`ui` (menu e apresentação). Destacar que o SQL fica
isolado no repositório.

**03:00 — Agendar (rubrica 1).** No menu, opção 1. Mostrar um agendamento
**válido**. Depois provocar cada conflito: profissional sem disponibilidade no
dia, horário do profissional ocupado, sala ocupada, paciente já com consulta.
Mostrar a query `INSERT` em `repositories.inserir_consulta` e as validações em
`services.agendar_consulta`.

**04:30 — Listar do dia (rubrica 2).** Opção 2, informar `2026-06-22`. Mostrar a
listagem ordenada por horário e a query com **JOIN** em `consultas_do_dia`.

**05:15 — Histórico (rubrica 3).** Opção 3, CPF `111.111.111-11`. Mostrar ordem
cronológica decrescente, especialidade e observações; a query usa múltiplos
JOINs (`historico_por_cpf`).

**06:00 — Alterar status (rubrica 4).** Opção 4. Marcar uma consulta como
**Realizada** (pedir observações). Tentar alterar uma já Realizada e mostrar o
bloqueio. Destacar o `UPDATE` em `atualizar_status`.

**07:00 — Relatório (rubrica 5).** Opção 5. Mostrar total/realizadas/canceladas/
faltas por profissional e as consultas futuras. Apontar `GROUP BY`, `COUNT` e
`CASE` em `estatisticas_por_profissional`.

**07:45 — Query no banco + bônus.** No `sqlite3`, rodar por exemplo:
`SELECT estado, COUNT(*) FROM Consulta GROUP BY estado;`. Mostrar rapidamente as
funções bônus (cadastrar paciente/profissional, listar especialidades) e os
**testes** (`pytest -q`, 25 passando).

**08:15 — Encerramento.** Comentar aprendizados e uso de IA (ver formulário).

> **Lembrete:** o vídeo precisa estar **público** ou **não listado**. Teste o
> link em um navegador deslogado antes de colar no PDF de entrega.
