import { useMemo, useState } from "react";
import { Stethoscope, CalendarDays, Clock, UserSearch, CheckCircle2, Info as InfoIcon } from "lucide-react";
import { useStore } from "../../data/store";
import { useToast } from "../../components/Toast";
import { Autocomplete, type Option } from "../../components/Autocomplete";
import { Calendar } from "../../components/Calendar";
import { Modal } from "../../components/Modal";
import { Avatar, Button, Card, EmptyState, SectionTitle, cx } from "../../components/ui";
import { addDays, formatDataLongoBR, hoje, diaSemana } from "../../lib/datetime";
import type { SlotInfo } from "../../data/store";

export function BookingFlow({ userId }: { userId: number }) {
  const store = useStore();
  const toast = useToast();

  const [espId, setEspId] = useState<number | null>(null);
  const [profId, setProfId] = useState<number | null>(null);
  const [data, setData] = useState<string>("");
  const [confirm, setConfirm] = useState<SlotInfo | null>(null);

  // opções de médico filtradas por especialidade
  const docOptions: Option[] = useMemo(() => store.banco.profissionais
    .filter(p => espId == null || p.especialidadeID === espId)
    .map(p => ({ id: p.profissionalID, label: p.nome, sublabel: store.especialidadeById(p.especialidadeID)?.nome })),
    [store, espId]);

  // datas (próximos 60 dias) em que o médico tem disponibilidade
  const marcados = useMemo(() => {
    const s = new Set<string>();
    if (profId == null) return s;
    for (let i = 0; i < 60; i++) {
      const iso = addDays(hoje(), i);
      if (store.turnosDoDia(profId, iso).length > 0) s.add(iso);
    }
    return s;
  }, [store, profId]);

  const slots = useMemo(() => (profId && data ? store.slotsDoDia(profId, data) : []), [store, profId, data]);
  const prof = profId ? store.profissionalById(profId) : undefined;

  function selecionarEsp(id: number | null) { setEspId(id); setProfId(null); setData(""); }
  function selecionarProf(id: number | null) { setProfId(id); setData(""); }

  function confirmar() {
    if (!confirm || !profId) return;
    const r = store.agendar({ profissionalID: profId, pacienteID: userId, data, horario: confirm.horario });
    if (r.ok) {
      const sala = r.consulta ? store.salaById(r.consulta.salaID)?.nome : "";
      toast("success", `Consulta confirmada para ${data.split("-").reverse().join("/")} às ${confirm.horario} (${sala}).`);
    } else {
      toast("error", r.error ?? "Não foi possível agendar.");
    }
    setConfirm(null);
  }

  // prévia da sala que será atribuída
  const salaPreview = useMemo(() => {
    if (!confirm || !profId) return null;
    const ocupadas = store.banco.consultas.filter(c => c.data === data && c.horario === confirm.horario && (c.estado === "Agendada" || c.estado === "Realizada")).map(c => c.salaID);
    return store.banco.salas.find(s => !ocupadas.includes(s.salaID)) ?? null;
  }, [confirm, profId, data, store]);

  return (
    <div className="space-y-6">
      <SectionTitle icon={<CalendarDays className="size-5" />} title="Agendar consulta"
        subtitle="Busque um profissional, escolha a data e selecione um horário livre." />

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Passo 1 — profissional */}
        <Card className="p-5">
          <Step n={1} label="Escolha o profissional" />
          <label className="block text-xs font-medium text-ink-soft mt-4 mb-1.5">Especialidade</label>
          <div data-tour="filtro-especialidade" className="flex flex-wrap gap-1.5">
            <Chip active={espId == null} onClick={() => selecionarEsp(null)}>Todas</Chip>
            {store.banco.especialidades.map(e => (
              <Chip key={e.especialidadeID} active={espId === e.especialidadeID} onClick={() => selecionarEsp(e.especialidadeID)}>
                {e.nome}
              </Chip>
            ))}
          </div>

          <label className="block text-xs font-medium text-ink-soft mt-4 mb-1.5">Médico</label>
          <div data-tour="buscar-medico">
            <Autocomplete options={docOptions} value={profId} onChange={selecionarProf} placeholder="Buscar por nome do médico..." />
          </div>

          {prof && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-primary-50">
              <Avatar nome={prof.nome} className="size-11 text-sm" />
              <div className="min-w-0">
                <p className="font-semibold text-ink text-sm truncate">{prof.nome}</p>
                <p className="text-xs text-ink-soft flex items-center gap-1">
                  <Stethoscope className="size-3" />{store.especialidadeById(prof.especialidadeID)?.nome} · {prof.crm}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Passo 2 e 3 — data e horário */}
        <div className="space-y-6">
          {!profId ? (
            <Card><EmptyState icon={<UserSearch className="size-6" />} title="Selecione um profissional"
              hint="Use o filtro por especialidade e a busca para encontrar o médico desejado." /></Card>
          ) : (
            <>
              <Card className="p-5" >
                <Step n={2} label="Escolha a data" />
                <div data-tour="calendario" className="mt-4 max-w-sm">
                  <Calendar value={data} onChange={setData} marcados={marcados} />
                  <p className="flex items-center gap-1.5 text-xs text-ink-soft mt-3">
                    <span className="size-1.5 rounded-full bg-[--color-livre]" /> dias com atendimento do profissional
                  </p>
                </div>
              </Card>

              {data && (
                <Card className="p-5">
                  <Step n={3} label={`Horários · ${formatDataLongoBR(data)}`} />
                  <Legend />
                  {slots.length === 0 ? (
                    <EmptyState icon={<Clock className="size-6" />} title="Sem atendimento neste dia"
                      hint={`O profissional não atende em ${diaSemana(data)}. Escolha um dia destacado no calendário.`} />
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
                      {slots.map(s => <SlotButton key={s.horario} slot={s} onPick={() => setConfirm(s)} />)}
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmação */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Confirmar agendamento" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setConfirm(null)}>Voltar</Button>
          <Button onClick={confirmar}><CheckCircle2 className="size-4" /> Confirmar</Button>
        </>}>
        {confirm && prof && (
          <div className="space-y-3">
            <Row label="Profissional" value={prof.nome} />
            <Row label="Especialidade" value={store.especialidadeById(prof.especialidadeID)?.nome ?? "-"} />
            <Row label="Data" value={formatDataLongoBR(data)} />
            <Row label="Horário" value={confirm.horario} />
            <Row label="Sala" value={salaPreview?.nome ?? "atribuição automática"} />
            <p className="flex items-start gap-2 text-xs text-ink-soft bg-surface rounded-lg p-2.5">
              <InfoIcon className="size-4 shrink-0 text-primary-500 mt-px" />
              A consulta será criada com status <b className="text-ink">Agendada</b>, respeitando as validações de conflito.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center size-6 rounded-full bg-primary-600 text-white text-xs font-semibold">{n}</span>
      <h3 className="font-semibold text-ink">{label}</h3>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={cx("px-3 h-8 rounded-full text-xs font-medium transition-colors border",
        active ? "bg-primary-600 text-white border-primary-600" : "bg-white text-ink-soft border-surface-2 hover:border-primary-200")}>
      {children}
    </button>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 mt-3 text-xs text-ink-soft">
      <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[--color-livre-soft] ring-1 ring-[--color-livre]" /> Livre</span>
      <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[--color-ocupado-soft] ring-1 ring-[--color-ocupado]" /> Ocupado</span>
      <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-surface-2 ring-1 ring-slate-300" /> Bloqueado</span>
    </div>
  );
}

function SlotButton({ slot, onPick }: { slot: SlotInfo; onPick: () => void }) {
  if (slot.status === "livre") {
    return (
      <button onClick={onPick}
        className="h-10 rounded-lg text-sm font-medium bg-[--color-livre-soft] text-[--color-livre] ring-1 ring-inset ring-[color-mix(in_srgb,var(--color-livre)_35%,white)] hover:bg-[--color-livre] hover:text-white transition-colors">
        {slot.horario}
      </button>
    );
  }
  const blocked = slot.status === "bloqueado";
  return (
    <span title={blocked ? "Bloqueado" : "Ocupado"}
      className={cx("h-10 rounded-lg text-sm font-medium grid place-items-center ring-1 ring-inset cursor-not-allowed",
        blocked ? "bg-surface-2 text-ink-soft ring-slate-300 line-through" : "bg-[--color-ocupado-soft] text-[--color-ocupado] ring-[color-mix(in_srgb,var(--color-ocupado)_30%,white)]")}>
      {slot.horario}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink text-right">{value}</span>
    </div>
  );
}
