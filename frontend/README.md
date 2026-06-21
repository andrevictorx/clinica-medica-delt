# Frontend — Clínica Médica DELT

Interface web do sistema de gestão clínica, construída como SPA profissional e
responsiva. Dois perfis (Paciente e Médico), onboarding guiado, e regras de
agendamento aplicadas em tempo real.

> **Stack:** React 19 + TypeScript + Vite + **Tailwind CSS v4** (CSS-first,
> tokens em `@theme`) + lucide-react. Sem backend nesta fase: os dados são
> simulados (mock) em `src/data/`, espelhando **exatamente** o esquema do banco.

## Identidade visual

- Azul-marinho UFPR `#0054A6` (primário), fundos off-white, cinzas de apoio.
- **Verde** = horário livre · **Vermelho** = ocupado/bloqueado (alto contraste).
- Cantos arredondados, espaçamento generoso, skeleton loaders e toasts.

## Como rodar

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # build de produção (tsc + vite)
npm run preview  # serve o build
```

### Deep-links de demonstração

| URL | Abre |
|-----|------|
| `/` | Tela de escolha de perfil |
| `/?perfil=paciente&id=1` | App do paciente (id do paciente) |
| `/?perfil=medico&id=1` | App do médico (id do profissional) |
| `…&tab=agendar` / `…&tab=horarios` | Abre uma aba específica |
| `…&tour=0` | Pula o tour de onboarding |

## Arquitetura

```
src/
├── types.ts            # tipos espelhando as 7 tabelas do banco
├── data/
│   ├── seed.ts         # dados de teste (alinhados a sql/seed.sql)
│   └── store.tsx       # estado + regras de negócio + persistência (localStorage)
├── lib/datetime.ts     # dias da semana, slots de 30min, formatação
├── components/         # UI base (Button, Card, Toast, Modal, Skeleton...),
│                       # Autocomplete, Calendar, Tour, AppShell
└── features/
    ├── RoleGate.tsx        # landing / escolha de perfil
    ├── patient/            # dashboard, fluxo de agendamento
    └── doctor/             # agenda semanal, setup de horários
```

## Integridade com o banco (regra crítica)

Nada no frontend altera o esquema. Tudo se mapeia às 7 tabelas existentes:

- **Padrão semanal do médico** → linhas em `Disponibilidade` (dia + turno).
- **Bloqueios pontuais** → não há tabela própria; são `Consulta` reservadas a um
  paciente interno **"— Bloqueio de Agenda —"** (`pacienteID = 99`), ocupando o slot.
- **Agendamento** → `INSERT` em `Consulta` com `estado = 'Agendada'`, após as mesmas
  validações do backend (turno/disponibilidade e conflitos de profissional, sala e paciente).
- **Slots disponíveis** = interseção da `Disponibilidade` do médico no dia com os
  horários **não ocupados** por consultas ativas (Agendada/Realizada).

Na integração final, o `store.tsx` é o único ponto a trocar por chamadas reais
(SQLite via API) — a UI permanece igual.
