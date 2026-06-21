import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarRange, Ban, Plus, CheckCircle2, XCircle, UserX } from "lucide-react";
import { useStore } from "../../data/store";
import { useToast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import { Button, Card, EstadoBadge, SectionTitle, cx } from "../../components/ui";
import { addDays, diaSemana, gerarSlots, hoje, inicioSemana, parseISO } from "../../lib/datetime";
import type { Consulta, EstadoConsulta } from "../../types";

const DOW_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const GRID = gerarSlots("08:00", "18:00", 30); // 08:00 .. 17:30

export function DoctorAgenda({ profId }: { profId: number }) {
  const store = useStore();
  const toast = useToast();
  const [weekRef, setWeekRef] = useState(hoje());
  const [selected, setSelected] = useState<Consulta | null>(null);
  const [bloquear, setBloquear] = useState<{ data: string; horario: string } | null>(null);

  const weekStart = inicioSemana(weekRef);
  const dias = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // índice consultas ativas da semana: "data|horario" -> consulta
  const mapa = useMemo(() => {
    const m = new Map<string, Consulta>();
    for (const c of store.consultasDoProfissional(profId)) {
      if (c.estado === "Cancelada" || c.estado === "Faltou") continue;
      if (c.data >= dias[0] && c.data <= dias[5]) m.set(`${c.data}|${c.horario}`, c);
    }
    return m;
  }, [store, profId, dias]);

  function trabalha(diaISO: string, time: string): boolean {
    return store.turnosDoDia(profId, diaISO).some(t => time >= t.horarioInicio && time < t.horarioFim);
  }

  function abrirCelula(diaISO: string, time: string) {
    const c = mapa.get(`${diaISO}|${time}`);
    if (c) setSelected(c);
    else if (trabalha(diaISO, time) && `${diaISO}` >= hoje()) setBloquear({ data: diaISO, horario: time });
  }

  function criarBloqueio() {
    if (!bloquear) return;
    const r = store.addBloqueio(profId, bloquear.data, bloquear.horario);
    toast(r.ok ? "success" : "error", r.ok ? "Horário bloqueado." : r.error ?? "Erro.");
    setBloquear(null);
  }

  const semanaLabel = `${parseISO(dias[0]).getDate()}/${String(parseISO(dias[0]).getMonth() + 1).padStart(2, "0")} – ${parseISO(dias[5]).getDate()}/${String(parseISO(dias[5]).getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <SectionTitle icon={<CalendarRange className="size-5" />} title="Agenda da semana"
        subtitle="Blocos de 30 minutos · clique em um horário livre para bloquear ou em um cartão para agir."
        action={
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => setWeekRef(hoje())}>Hoje</Button>
            <button onClick={() => setWeekRef(addDays(weekStart, -7))} className="grid place-items-center size-9 rounded-lg text-ink-soft hover:bg-surface-2"><ChevronLeft className="size-4" /></button>
            <span className="text-sm font-medium text-ink w-28 text-center">{semanaLabel}</span>
            <button onClick={() => setWeekRef(addDays(weekStart, 7))} className="grid place-items-center size-9 rounded-lg text-ink-soft hover:bg-surface-2"><ChevronRight className="size-4" /></button>
          </div>
        } />

      <Card className="p-3 overflow-x-auto" >
        <div data-tour="agenda-semana" className="min-w-[760px]">
          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-[60px_repeat(6,1fr)] gap-1 mb-1">
            <div />
            {dias.map((d, i) => {
              const isToday = d === hoje();
              return (
                <div key={d} className={cx("text-center py-1.5 rounded-lg", isToday && "bg-primary-50")}>
                  <p className={cx("text-xs font-medium", isToday ? "text-primary-700" : "text-ink-soft")}>{DOW_LABEL[i]}</p>
                  <p className={cx("text-sm font-semibold", isToday ? "text-primary-700" : "text-ink")}>{parseISO(d).getDate()}</p>
                </div>
              );
            })}
          </div>

          {/* Linhas de horário */}
          {GRID.map(time => {
            const isHour = time.endsWith(":00");
            return (
              <div key={time} className="grid grid-cols-[60px_repeat(6,1fr)] gap-1">
                <div className={cx("text-right pr-2 text-[11px] tabular-nums h-9 flex items-start justify-end pt-0.5",
                  isHour ? "text-ink-soft font-medium" : "text-ink-soft/50")}>{time}</div>
                {dias.map(d => {
                  const c = mapa.get(`${d}|${time}`);
                  const working = trabalha(d, time);
                  const bloqueio = c && store.isBloqueio(c);
                  return (
                    <button key={d + time} onClick={() => abrirCelula(d, time)}
                      disabled={!working && !c}
                      className={cx("h-9 rounded-md text-left px-1.5 transition-colors group relative",
                        !working && !c && "bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#f1f4f8_5px,#f1f4f8_6px)] cursor-default",
                        working && !c && "bg-[--color-livre-soft]/40 hover:bg-[--color-livre-soft] ring-1 ring-inset ring-[color-mix(in_srgb,var(--color-livre)_18%,white)]",
                        c && !bloqueio && "bg-primary-600 text-white shadow-sm hover:bg-primary-700",
                        bloqueio && "bg-[--color-ocupado-soft] ring-1 ring-inset ring-[--color-ocupado]",
                      )}>
                      {c && !bloqueio && (
                        <span className="block text-[11px] font-semibold leading-tight truncate mt-0.5">
                          {store.pacienteById(c.pacienteID)?.nome.split(" ")[0]}
                        </span>
                      )}
                      {bloqueio && <span className="flex items-center gap-1 text-[10px] font-medium text-[--color-ocupado] mt-1"><Ban className="size-3" />Bloqueado</span>}
                      {working && !c && <Plus className="size-3.5 text-[--color-livre] opacity-0 group-hover:opacity-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>

      <Legend />

      <ConsultaModal consulta={selected} onClose={() => setSelected(null)} />

      <Modal open={!!bloquear} onClose={() => setBloquear(null)} title="Bloquear horário" size="sm"
        footer={<><Button variant="ghost" onClick={() => setBloquear(null)}>Cancelar</Button>
          <Button variant="danger" onClick={criarBloqueio}><Ban className="size-4" /> Bloquear</Button></>}>
        {bloquear && (
          <p className="text-sm text-ink-soft">
            Deseja bloquear <b className="text-ink">{diaSemana(bloquear.data)}, {bloquear.data.split("-").reverse().join("/")}</b> às <b className="text-ink">{bloquear.horario}</b>?
            O horário ficará indisponível para agendamentos.
          </p>
        )}
      </Modal>
    </div>
  );
}

function ConsultaModal({ consulta, onClose }: { consulta: Consulta | null; onClose: () => void }) {
  const store = useStore();
  const toast = useToast();
  const [obs, setObs] = useState("");
  const [modo, setModo] = useState<EstadoConsulta | null>(null);

  if (!consulta) return null;
  const isBloqueio = store.isBloqueio(consulta);
  const paciente = store.pacienteById(consulta.pacienteID);
  const realizada = consulta.estado === "Realizada";

  function aplicar(estado: EstadoConsulta) {
    if (estado === "Realizada" && !obs.trim()) { setModo("Realizada"); return; }
    store.alterarStatus(consulta!.consultaID, estado, estado === "Realizada" ? obs.trim() : undefined);
    toast("success", `Consulta marcada como ${estado}.`);
    reset();
  }
  function remover() { store.removerConsulta(consulta!.consultaID); toast("info", "Bloqueio removido."); reset(); }
  function reset() { setObs(""); setModo(null); onClose(); }

  if (isBloqueio) {
    return (
      <Modal open onClose={reset} title="Bloqueio de agenda" size="sm"
        footer={<><Button variant="ghost" onClick={reset}>Fechar</Button>
          <Button variant="danger" onClick={remover}><XCircle className="size-4" />Remover bloqueio</Button></>}>
        <p className="text-sm text-ink-soft">
          Horário bloqueado em <b className="text-ink">{consulta.data.split("-").reverse().join("/")}</b> às <b className="text-ink">{consulta.horario}</b>.
        </p>
      </Modal>
    );
  }

  return (
    <Modal open onClose={reset} title="Detalhes da consulta" size="sm"
      footer={!realizada ? <>
        <Button variant="ghost" onClick={() => aplicar("Cancelada")} className="text-[--color-ocupado]"><XCircle className="size-4" />Cancelar</Button>
        <Button variant="secondary" onClick={() => aplicar("Faltou")}><UserX className="size-4" />Faltou</Button>
        <Button onClick={() => aplicar("Realizada")}><CheckCircle2 className="size-4" />Realizada</Button>
      </> : <Button variant="ghost" onClick={reset}>Fechar</Button>}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink">{paciente?.nome}</p>
            <p className="text-xs text-ink-soft">{paciente?.cpf}</p>
          </div>
          <EstadoBadge estado={consulta.estado} />
        </div>
        <div className="text-sm text-ink-soft">
          {consulta.data.split("-").reverse().join("/")} · {consulta.horario} · {store.salaById(consulta.salaID)?.nome}
        </div>
        {realizada && consulta.descricao && (
          <p className="text-sm bg-surface rounded-lg p-3 text-ink">{consulta.descricao}</p>
        )}
        {modo === "Realizada" && !realizada && (
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Observações médicas (obrigatório)</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
              className="w-full rounded-xl border border-surface-2 p-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              placeholder="Descreva o atendimento..." />
          </div>
        )}
      </div>
    </Modal>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
      <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[--color-livre-soft] ring-1 ring-[color-mix(in_srgb,var(--color-livre)_30%,white)]" /> Disponível</span>
      <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary-600" /> Consulta agendada</span>
      <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[--color-ocupado-soft] ring-1 ring-[--color-ocupado]" /> Bloqueado</span>
      <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-surface-2" /> Fora do expediente</span>
    </div>
  );
}
