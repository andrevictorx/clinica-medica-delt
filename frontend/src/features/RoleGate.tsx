import { useState } from "react";
import { Stethoscope, User, ArrowRight, HeartPulse } from "lucide-react";
import { useStore } from "../data/store";
import { BLOQUEIO_PACIENTE_ID } from "../types";
import { Button, cx } from "../components/ui";

export type Role = "paciente" | "medico";
export interface Session { role: Role; userId: number }

export function RoleGate({ onEnter }: { onEnter: (s: Session) => void }) {
  const { banco } = useStore();
  const [role, setRole] = useState<Role>("paciente");
  const pacientes = banco.pacientes.filter(p => p.pacienteID !== BLOQUEIO_PACIENTE_ID);
  const [pacId, setPacId] = useState(pacientes[0]?.pacienteID ?? 1);
  const [medId, setMedId] = useState(banco.profissionais[0]?.profissionalID ?? 1);

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Lado da marca */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-primary-700 text-white overflow-hidden">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary-600/50 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-primary-800/60 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid place-items-center size-11 rounded-xl bg-white/15"><HeartPulse className="size-6" /></div>
          <div>
            <p className="font-semibold text-lg">Clínica Médica DELT</p>
            <p className="text-sm text-white/70">UFPR · Engenharia Elétrica</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">Agendamento clínico simples, rápido e seguro.</h1>
          <p className="mt-4 text-white/80 leading-relaxed">
            Pacientes encontram o médico ideal e marcam consultas em segundos.
            Médicos gerenciam sua agenda semanal e disponibilidade em um só lugar.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[--color-livre]" /> Horários sempre atualizados em tempo real</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[--color-livre]" /> Verde = livre · Vermelho = ocupado/bloqueado</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[--color-livre]" /> Agenda semanal em blocos de 30 minutos</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">Protótipo de interface · dados de teste simulados</p>
      </div>

      {/* Lado da escolha */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-ink">Entrar na plataforma</h2>
          <p className="text-ink-soft mt-1 mb-6">Escolha como deseja acessar a demonstração.</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <RoleCard active={role === "paciente"} onClick={() => setRole("paciente")}
              icon={<User className="size-5" />} title="Sou Paciente" desc="Buscar e agendar" />
            <RoleCard active={role === "medico"} onClick={() => setRole("medico")}
              icon={<Stethoscope className="size-5" />} title="Sou Médico" desc="Gerenciar agenda" />
          </div>

          <label className="block text-sm font-medium text-ink mb-1.5">
            {role === "paciente" ? "Identifique-se como paciente" : "Identifique-se como médico"}
          </label>
          {role === "paciente" ? (
            <select value={pacId} onChange={e => setPacId(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl bg-white border border-surface-2 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100">
              {pacientes.map(p => <option key={p.pacienteID} value={p.pacienteID}>{p.nome} — {p.cpf}</option>)}
            </select>
          ) : (
            <select value={medId} onChange={e => setMedId(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl bg-white border border-surface-2 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100">
              {banco.profissionais.map(m => <option key={m.profissionalID} value={m.profissionalID}>{m.nome} — {m.crm}</option>)}
            </select>
          )}

          <Button className="w-full mt-6" size="lg"
            onClick={() => onEnter({ role, userId: role === "paciente" ? pacId : medId })}>
            Entrar <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, icon, title, desc }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <button onClick={onClick}
      className={cx("flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all",
        active ? "border-primary-500 bg-primary-50 ring-2 ring-primary-100" : "border-surface-2 bg-white hover:border-primary-200")}>
      <span className={cx("grid place-items-center size-10 rounded-xl", active ? "bg-primary-600 text-white" : "bg-surface-2 text-ink-soft")}>{icon}</span>
      <span className="font-semibold text-ink">{title}</span>
      <span className="text-xs text-ink-soft -mt-1">{desc}</span>
    </button>
  );
}
