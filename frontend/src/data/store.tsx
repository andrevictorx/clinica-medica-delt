import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import type {
  Banco, Consulta, EstadoConsulta, Especialidade, Paciente, Profissional, Sala, Turno,
} from "../types";
import { BLOQUEIO_PACIENTE_ID } from "../types";
import { seed } from "./seed";
import { diaSemana, gerarSlots, timeToMin } from "../lib/datetime";

const STORAGE_KEY = "clinica-delt-banco-v2";
const ATIVOS: EstadoConsulta[] = ["Agendada", "Realizada"];

export type SlotStatus = "livre" | "ocupado" | "bloqueado";
export interface SlotInfo {
  horario: string;
  status: SlotStatus;
  consulta?: Consulta;
}

export interface AgendarPayload {
  profissionalID: number;
  pacienteID: number;
  data: string;
  horario: string;
  salaID?: number; // se omitido, escolhe a primeira sala livre
}
export interface Resultado {
  ok: boolean;
  error?: string;
  consulta?: Consulta;
}

interface StoreCtx {
  banco: Banco;
  // catálogos
  profissionalById: (id: number) => Profissional | undefined;
  pacienteById: (id: number) => Paciente | undefined;
  salaById: (id: number) => Sala | undefined;
  especialidadeById: (id: number) => Especialidade | undefined;
  especialidadeDoProf: (profId: number) => Especialidade | undefined;
  turnoById: (nome: string) => Turno | undefined;
  // consultas
  consultasDoProfissional: (profId: number) => Consulta[];
  proximasDoPaciente: (pacId: number, fromISO: string) => Consulta[];
  historicoDoPaciente: (pacId: number) => Consulta[];
  // disponibilidade / slots
  turnosDoDia: (profId: number, iso: string) => Turno[];
  slotsDoDia: (profId: number, iso: string) => SlotInfo[];
  isBloqueio: (c: Consulta) => boolean;
  // mutações
  agendar: (p: AgendarPayload) => Resultado;
  alterarStatus: (consultaId: number, estado: EstadoConsulta, descricao?: string) => void;
  addDisponibilidade: (profId: number, dia: string, turno: string) => boolean;
  removeDisponibilidade: (dispId: number) => void;
  addBloqueio: (profId: number, iso: string, horario: string) => Resultado;
  removerConsulta: (consultaId: number) => void;
  resetar: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);

function carregar(): Banco {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Banco;
  } catch { /* ignore */ }
  return structuredClone(seed);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [banco, setBanco] = useState<Banco>(carregar);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banco));
  }, [banco]);

  // ---- catálogos -------------------------------------------------------
  const profissionalById = useCallback((id: number) => banco.profissionais.find(p => p.profissionalID === id), [banco.profissionais]);
  const pacienteById = useCallback((id: number) => banco.pacientes.find(p => p.pacienteID === id), [banco.pacientes]);
  const salaById = useCallback((id: number) => banco.salas.find(s => s.salaID === id), [banco.salas]);
  const especialidadeById = useCallback((id: number) => banco.especialidades.find(e => e.especialidadeID === id), [banco.especialidades]);
  const especialidadeDoProf = useCallback((profId: number) => {
    const p = banco.profissionais.find(x => x.profissionalID === profId);
    return p ? banco.especialidades.find(e => e.especialidadeID === p.especialidadeID) : undefined;
  }, [banco.profissionais, banco.especialidades]);
  const turnoById = useCallback((nome: string) => banco.turnos.find(t => t.turnoNome === nome), [banco.turnos]);

  const isBloqueio = useCallback((c: Consulta) => c.pacienteID === BLOQUEIO_PACIENTE_ID, []);

  // ---- consultas -------------------------------------------------------
  const consultasDoProfissional = useCallback(
    (profId: number) => banco.consultas.filter(c => c.profissionalID === profId),
    [banco.consultas]);

  const proximasDoPaciente = useCallback((pacId: number, fromISO: string) =>
    banco.consultas
      .filter(c => c.pacienteID === pacId && c.estado === "Agendada" && c.data >= fromISO)
      .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario)),
    [banco.consultas]);

  const historicoDoPaciente = useCallback((pacId: number) =>
    banco.consultas
      .filter(c => c.pacienteID === pacId)
      .sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario)),
    [banco.consultas]);

  // ---- disponibilidade / slots ----------------------------------------
  const turnosDoDia = useCallback((profId: number, iso: string): Turno[] => {
    const dia = diaSemana(iso);
    const nomes = banco.disponibilidades
      .filter(d => d.profissionalID === profId && d.dia === dia)
      .map(d => d.turnoNome);
    return banco.turnos
      .filter(t => nomes.includes(t.turnoNome))
      .sort((a, b) => timeToMin(a.horarioInicio) - timeToMin(b.horarioInicio));
  }, [banco.disponibilidades, banco.turnos]);

  /**
   * REGRA CRÍTICA: só existem slots que cruzam a disponibilidade ativa do
   * médico. Cada slot de 30min recebe status livre / ocupado / bloqueado
   * conforme as consultas ativas (Agendada/Realizada) daquele profissional.
   */
  const slotsDoDia = useCallback((profId: number, iso: string): SlotInfo[] => {
    const turnos = turnosDoDia(profId, iso);
    const consultas = banco.consultas.filter(
      c => c.profissionalID === profId && c.data === iso && ATIVOS.includes(c.estado));
    const porHora = new Map(consultas.map(c => [c.horario, c]));
    const out: SlotInfo[] = [];
    for (const t of turnos) {
      for (const h of gerarSlots(t.horarioInicio, t.horarioFim, 30)) {
        const c = porHora.get(h);
        if (!c) out.push({ horario: h, status: "livre" });
        else if (c.pacienteID === BLOQUEIO_PACIENTE_ID) out.push({ horario: h, status: "bloqueado", consulta: c });
        else out.push({ horario: h, status: "ocupado", consulta: c });
      }
    }
    return out;
  }, [banco.consultas, turnosDoDia]);

  // ---- mutações --------------------------------------------------------
  const proximoId = (cs: Consulta[]) => cs.reduce((m, c) => Math.max(m, c.consultaID), 0) + 1;

  const conflito = (cs: Consulta[], campo: keyof Consulta, valor: number, data: string, horario: string) =>
    cs.some(c => c[campo] === valor && c.data === data && c.horario === horario && ATIVOS.includes(c.estado));

  const agendar = useCallback((p: AgendarPayload): Resultado => {
    const turno = banco.turnos.find(t => p.horario >= t.horarioInicio && p.horario < t.horarioFim);
    if (!turno) return { ok: false, error: "O horário não pertence a nenhum turno de atendimento." };

    const dia = diaSemana(p.data);
    const disponivel = banco.disponibilidades.some(d => d.profissionalID === p.profissionalID && d.dia === dia && d.turnoNome === turno.turnoNome);
    if (!disponivel) return { ok: false, error: `O profissional não atende em ${dia} no turno da ${turno.turnoNome}.` };

    if (conflito(banco.consultas, "profissionalID", p.profissionalID, p.data, p.horario))
      return { ok: false, error: "O profissional já possui uma consulta nesse horário." };
    if (conflito(banco.consultas, "pacienteID", p.pacienteID, p.data, p.horario))
      return { ok: false, error: "O paciente já possui uma consulta nesse horário." };

    let salaID = p.salaID;
    if (salaID == null) {
      const livre = banco.salas.find(s => !conflito(banco.consultas, "salaID", s.salaID, p.data, p.horario));
      if (!livre) return { ok: false, error: "Não há salas livres nesse horário." };
      salaID = livre.salaID;
    } else if (conflito(banco.consultas, "salaID", salaID, p.data, p.horario)) {
      return { ok: false, error: "A sala já está ocupada nesse horário." };
    }

    const nova: Consulta = {
      consultaID: proximoId(banco.consultas),
      data: p.data, horario: p.horario, estado: "Agendada", descricao: null,
      profissionalID: p.profissionalID, pacienteID: p.pacienteID, salaID,
    };
    setBanco(b => ({ ...b, consultas: [...b.consultas, nova] }));
    return { ok: true, consulta: nova };
  }, [banco.turnos, banco.disponibilidades, banco.consultas, banco.salas]);

  const alterarStatus = useCallback((id: number, estado: EstadoConsulta, descricao?: string) => {
    setBanco(b => ({
      ...b,
      consultas: b.consultas.map(c =>
        c.consultaID === id ? { ...c, estado, descricao: descricao ?? c.descricao } : c),
    }));
  }, []);

  const addDisponibilidade = useCallback((profId: number, dia: string, turno: string): boolean => {
    let added = false;
    setBanco(b => {
      if (b.disponibilidades.some(d => d.profissionalID === profId && d.dia === dia && d.turnoNome === turno)) return b;
      added = true;
      const id = b.disponibilidades.reduce((m, d) => Math.max(m, d.disponibilidadeID), 0) + 1;
      return { ...b, disponibilidades: [...b.disponibilidades, { disponibilidadeID: id, dia, turnoNome: turno, profissionalID: profId }] };
    });
    return added;
  }, []);

  const removeDisponibilidade = useCallback((dispId: number) => {
    setBanco(b => ({ ...b, disponibilidades: b.disponibilidades.filter(d => d.disponibilidadeID !== dispId) }));
  }, []);

  const addBloqueio = useCallback((profId: number, iso: string, horario: string): Resultado => {
    if (conflito(banco.consultas, "profissionalID", profId, iso, horario))
      return { ok: false, error: "Já existe uma consulta ou bloqueio nesse horário." };
    const sala = banco.salas[0]?.salaID ?? 1;
    const nova: Consulta = {
      consultaID: proximoId(banco.consultas), data: iso, horario, estado: "Agendada",
      descricao: "Bloqueio de agenda", profissionalID: profId, pacienteID: BLOQUEIO_PACIENTE_ID, salaID: sala,
    };
    setBanco(b => ({ ...b, consultas: [...b.consultas, nova] }));
    return { ok: true, consulta: nova };
  }, [banco.consultas, banco.salas]);

  const removerConsulta = useCallback((id: number) => {
    setBanco(b => ({ ...b, consultas: b.consultas.filter(c => c.consultaID !== id) }));
  }, []);

  const resetar = useCallback(() => setBanco(structuredClone(seed)), []);

  const value = useMemo<StoreCtx>(() => ({
    banco, profissionalById, pacienteById, salaById, especialidadeById, especialidadeDoProf, turnoById,
    consultasDoProfissional, proximasDoPaciente, historicoDoPaciente,
    turnosDoDia, slotsDoDia, isBloqueio,
    agendar, alterarStatus, addDisponibilidade, removeDisponibilidade, addBloqueio, removerConsulta, resetar,
  }), [banco, profissionalById, pacienteById, salaById, especialidadeById, especialidadeDoProf, turnoById,
    consultasDoProfissional, proximasDoPaciente, historicoDoPaciente, turnosDoDia, slotsDoDia, isBloqueio,
    agendar, alterarStatus, addDisponibilidade, removeDisponibilidade, addBloqueio, removerConsulta, resetar]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}
