import { useEffect, useState } from "react";
import { CalendarPlus, CalendarClock, Clock, MapPin, Stethoscope, CalendarX2, History } from "lucide-react";
import { useStore } from "../../data/store";
import { useToast } from "../../components/Toast";
import { Avatar, Button, Card, EmptyState, EstadoBadge, SectionTitle, Skeleton, cx } from "../../components/ui";
import { formatDataLongoBR, hoje } from "../../lib/datetime";

export function PatientDashboard({ userId, onAgendar }: { userId: number; onAgendar: () => void }) {
  const store = useStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 650); return () => clearTimeout(t); }, []);

  const paciente = store.pacienteById(userId);
  const proximas = store.proximasDoPaciente(userId, hoje());
  const historico = store.historicoDoPaciente(userId).filter(c => c.estado !== "Agendada").slice(0, 4);

  const primeiroNome = paciente?.nome.split(" ")[0] ?? "Paciente";

  function cancelar(id: number) {
    store.alterarStatus(id, "Cancelada");
    toast("info", "Consulta cancelada.");
  }

  return (
    <div className="space-y-6">
      {/* Saudação + CTA */}
      <Card className="p-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm">{formatDataLongoBR(hoje())}</p>
            <h1 className="text-2xl font-semibold mt-0.5">Olá, {primeiroNome} 👋</h1>
            <p className="text-white/80 mt-1 text-sm">Pronto para cuidar da sua saúde? Agende sua próxima consulta.</p>
          </div>
          <Button variant="secondary" size="lg" onClick={onAgendar} className="shrink-0">
            <CalendarPlus className="size-5" /> Agendar consulta
          </Button>
        </div>
      </Card>

      {/* Próximas consultas */}
      <section data-tour="proximas">
        <SectionTitle icon={<CalendarClock className="size-5" />} title="Próximas consultas"
          subtitle="Seus atendimentos agendados" />
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[0, 1].map(i => <Card key={i} className="p-5"><Skeleton className="h-5 w-40 mb-3" /><Skeleton className="h-4 w-56 mb-2" /><Skeleton className="h-4 w-32" /></Card>)}
          </div>
        ) : proximas.length === 0 ? (
          <Card><EmptyState icon={<CalendarX2 className="size-6" />} title="Nenhuma consulta agendada"
            hint="Quando você agendar uma consulta, ela aparecerá aqui." /></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {proximas.map(c => {
              const prof = store.profissionalById(c.profissionalID);
              const esp = store.especialidadeDoProf(c.profissionalID);
              const sala = store.salaById(c.salaID);
              return (
                <Card key={c.consultaID} className="p-5 hover:shadow-[var(--shadow-pop)] transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar nome={prof?.nome ?? "?"} className="size-11 text-sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{prof?.nome}</p>
                        <p className="text-xs text-ink-soft flex items-center gap-1"><Stethoscope className="size-3" />{esp?.nome}</p>
                      </div>
                    </div>
                    <EstadoBadge estado={c.estado} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Info icon={<CalendarClock className="size-4" />} text={formatDataLongoBR(c.data).split(",")[0] + ", " + c.data.split("-").reverse().slice(0, 2).join("/")} />
                    <Info icon={<Clock className="size-4" />} text={c.horario} />
                    <Info icon={<MapPin className="size-4" />} text={sala?.nome ?? "-"} />
                  </div>
                  <div className="mt-4 pt-3 border-t border-surface-2 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => cancelar(c.consultaID)} className="text-[--color-ocupado] hover:bg-[--color-ocupado-soft]">
                      Cancelar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Histórico recente */}
      {!loading && historico.length > 0 && (
        <section>
          <SectionTitle icon={<History className="size-5" />} title="Histórico recente" />
          <Card className="divide-y divide-surface-2">
            {historico.map(c => {
              const prof = store.profissionalById(c.profissionalID);
              return (
                <div key={c.consultaID} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={cx("grid place-items-center size-9 rounded-lg shrink-0",
                    c.estado === "Realizada" ? "bg-[--color-livre-soft] text-[--color-livre]" : "bg-surface-2 text-ink-soft")}>
                    <CalendarClock className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{prof?.nome}</p>
                    <p className="text-xs text-ink-soft">{c.data.split("-").reverse().join("/")} · {c.horario}</p>
                  </div>
                  <EstadoBadge estado={c.estado} />
                </div>
              );
            })}
          </Card>
        </section>
      )}
    </div>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <span className="flex items-center gap-1.5 text-ink-soft"><span className="text-primary-500">{icon}</span><span className="text-ink truncate">{text}</span></span>;
}
