import { DIAS_SEMANA, type DiaSemana } from "../types";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS_LONGO = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

/** Cria um Date local a partir de "AAAA-MM-DD" (sem efeitos de fuso). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function hoje(): string {
  return toISO(new Date());
}

/** Dia da semana na convenção de Disponibilidade.dia (segunda = "Seg"). */
export function diaSemana(iso: string): DiaSemana {
  const js = parseISO(iso).getDay(); // 0=Dom..6=Sab
  return DIAS_SEMANA[(js + 6) % 7];
}

export function diaSemanaLongo(iso: string): string {
  const js = parseISO(iso).getDay();
  return DIAS_LONGO[(js + 6) % 7];
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Segunda-feira da semana que contém `iso`. */
export function inicioSemana(iso: string): string {
  const d = parseISO(iso);
  const js = d.getDay();
  const back = (js + 6) % 7;
  d.setDate(d.getDate() - back);
  return toISO(d);
}

export function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Slots de `step` minutos no intervalo [inicio, fim). */
export function gerarSlots(inicio: string, fim: string, step = 30): string[] {
  const out: string[] = [];
  for (let t = timeToMin(inicio); t < timeToMin(fim); t += step) out.push(minToTime(t));
  return out;
}

export function formatDataBR(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]}. ${d.getFullYear()}`;
}

export function formatDataLongoBR(iso: string): string {
  const d = parseISO(iso);
  return `${diaSemanaLongo(iso)}, ${d.getDate()} de ${MESES_LONGO[d.getMonth()]} de ${d.getFullYear()}`;
}

export function nomeMesAno(iso: string): string {
  const d = parseISO(iso);
  return `${MESES_LONGO[d.getMonth()][0].toUpperCase()}${MESES_LONGO[d.getMonth()].slice(1)} ${d.getFullYear()}`;
}

export { MESES, DIAS_LONGO };
