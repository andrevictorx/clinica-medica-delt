import { useMemo, useState } from "react";
import { CalendarCog, Sun, Sunset, Ban, Trash2, Plus } from "lucide-react";
import { useStore } from "../../data/store";
import { useToast } from "../../components/Toast";
import { Button, Card, EmptyState, SectionTitle, cx } from "../../components/ui";
import { DIAS_SEMANA } from "../../types";
import { hoje, diaSemana } from "../../lib/datetime";

const DIAS_UTEIS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab"] as const;

export function DoctorSchedule({ profId }: { profId: number }) {
  const store = useStore();
  const toast = useToast();

  const disponibilidades = store.banco.disponibilidades.filter(d => d.profissionalID === profId);

  function dispDe(dia: string, turno: string) {
    return disponibilidades.find(d => d.dia === dia && d.turnoNome === turno);
  }

  function toggle(dia: string, turno: string) {
    const existente = dispDe(dia, turno);
    if (existente) { store.removeDisponibilidade(existente.disponibilidadeID); toast("info", `${dia} (${turno}) removido do padrão.`); }
    else { store.addDisponibilidade(profId, dia, turno); toast("success", `${dia} (${turno}) adicionado ao padrão.`); }
  }

  return (
    <div className="space-y-6">
      <SectionTitle icon={<CalendarCog className="size-5" />} title="Meus horários"
        subtitle="Defina seu padrão semanal de atendimento e bloqueios pontuais." />

      {/* Padrão semanal */}
      <Card className="p-6" >
        <h3 className="font-semibold text-ink mb-1">Padrão semanal de atendimento</h3>
        <p className="text-sm text-ink-soft mb-5">Ative os turnos em que você atende. Isso define os horários que os pacientes podem agendar.</p>

        <div className="space-y-2">
          {DIAS_UTEIS.map(dia => (
            <div key={dia} className="grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr] items-center gap-3">
              <span className="text-sm font-medium text-ink">{nomeDia(dia)}</span>
              <div className="grid grid-cols-2 gap-2">
                {store.banco.turnos.map(t => {
                  const ativo = !!dispDe(dia, t.turnoNome);
                  return (
                    <button key={t.turnoNome} onClick={() => toggle(dia, t.turnoNome)}
                      className={cx("flex items-center justify-between gap-2 h-11 px-3 rounded-xl border text-sm transition-all",
                        ativo ? "bg-primary-50 border-primary-300 text-primary-700 ring-1 ring-primary-100" : "bg-white border-surface-2 text-ink-soft hover:border-primary-200")}>
                      <span className="flex items-center gap-2">
                        {t.turnoNome === "Manha" ? <Sun className="size-4" /> : <Sunset className="size-4" />}
                        {t.turnoNome === "Manha" ? "Manhã" : "Tarde"}
                        <span className="text-xs opacity-70 hidden sm:inline">{t.horarioInicio}–{t.horarioFim}</span>
                      </span>
                      <span className={cx("size-4 rounded-full border-2 grid place-items-center transition-colors",
                        ativo ? "border-primary-600 bg-primary-600" : "border-slate-300")}>
                        {ativo && <span className="size-1.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-soft mt-4 bg-surface rounded-lg p-2.5">
          Cada turno ativo é uma linha em <b>Disponibilidade</b> (dia + turno), exatamente como no banco — sem alterar o esquema.
        </p>
      </Card>

      <BloqueiosSection profId={profId} />
    </div>
  );
}

function BloqueiosSection({ profId }: { profId: number }) {
  const store = useStore();
  const toast = useToast();
  const [data, setData] = useState(hoje());
  const [horario, setHorario] = useState("");

  const bloqueios = store.consultasDoProfissional(profId)
    .filter(c => store.isBloqueio(c) && c.estado !== "Cancelada")
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));

  const livres = useMemo(() => store.slotsDoDia(profId, data).filter(s => s.status === "livre").map(s => s.horario), [store, profId, data]);

  function adicionar() {
    if (!horario) { toast("error", "Selecione um horário livre."); return; }
    const r = store.addBloqueio(profId, data, horario);
    toast(r.ok ? "success" : "error", r.ok ? "Bloqueio adicionado." : r.error ?? "Erro.");
    if (r.ok) setHorario("");
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-ink mb-1">Bloqueios pontuais</h3>
      <p className="text-sm text-ink-soft mb-5">Reserve horários específicos (reuniões, ausências). Eles ficam indisponíveis aos pacientes.</p>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-5">
        <div className="flex-1">
          <label className="block text-xs font-medium text-ink-soft mb-1.5">Data</label>
          <input type="date" value={data} min={hoje()} onChange={e => { setData(e.target.value); setHorario(""); }}
            className="w-full h-11 px-3 rounded-xl bg-white border border-surface-2 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-ink-soft mb-1.5">Horário livre ({diaSemana(data)})</label>
          <select value={horario} onChange={e => setHorario(e.target.value)} disabled={livres.length === 0}
            className="w-full h-11 px-3 rounded-xl bg-white border border-surface-2 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:opacity-50">
            <option value="">{livres.length ? "Selecione..." : "Sem horários livres neste dia"}</option>
            {livres.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <Button onClick={adicionar} className="sm:w-auto"><Plus className="size-4" /> Bloquear</Button>
      </div>

      {bloqueios.length === 0 ? (
        <EmptyState icon={<Ban className="size-6" />} title="Nenhum bloqueio cadastrado" hint="Adicione bloqueios pontuais acima ou clicando em horários livres na agenda." />
      ) : (
        <ul className="divide-y divide-surface-2 -mb-2">
          {bloqueios.map(c => (
            <li key={c.consultaID} className="flex items-center gap-3 py-3">
              <span className="grid place-items-center size-9 rounded-lg bg-[--color-ocupado-soft] text-[--color-ocupado] shrink-0"><Ban className="size-4" /></span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{c.data.split("-").reverse().join("/")} · {c.horario}</p>
                <p className="text-xs text-ink-soft">{c.descricao ?? "Bloqueio de agenda"}</p>
              </div>
              <button onClick={() => { store.removerConsulta(c.consultaID); toast("info", "Bloqueio removido."); }}
                className="grid place-items-center size-9 rounded-lg text-ink-soft hover:bg-[--color-ocupado-soft] hover:text-[--color-ocupado] transition-colors">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function nomeDia(d: string) {
  const i = DIAS_SEMANA.indexOf(d as typeof DIAS_SEMANA[number]);
  return ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"][i] ?? d;
}
