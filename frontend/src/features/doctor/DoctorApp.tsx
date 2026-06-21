import { useEffect, useState } from "react";
import { CalendarRange, CalendarCog } from "lucide-react";
import { Page, TopBar, type Tab } from "../../components/AppShell";
import { Tour, type TourStep } from "../../components/Tour";
import { useStore } from "../../data/store";
import { useToast } from "../../components/Toast";
import { DoctorAgenda } from "./DoctorAgenda";
import { DoctorSchedule } from "./DoctorSchedule";

const TABS: Tab[] = [
  { id: "agenda", label: "Agenda", icon: <CalendarRange className="size-4" /> },
  { id: "horarios", label: "Meus horários", icon: <CalendarCog className="size-4" />, tourId: "nav-horarios" },
];

const STEPS: TourStep[] = [
  { selector: "nav-horarios", title: "Defina seus horários", body: "Aqui você cadastra seu padrão semanal de atendimento e insere bloqueios pontuais na agenda." },
  { selector: "agenda-semana", title: "Sua agenda da semana", body: "Visualize a semana em blocos de 30 minutos. Consultas aparecem como cartões clicáveis com ações rápidas." },
  { selector: "trocar-perfil", title: "Troque de perfil quando quiser", body: "Use este menu para sair ou alternar entre médico e paciente durante a demonstração." },
];

export function DoctorApp({ profId, onExit }: { profId: number; onExit: () => void }) {
  const store = useStore();
  const toast = useToast();
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get("tab") ?? "agenda");
  const [tour, setTour] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("tour-medico")) {
      const t = setTimeout(() => setTour(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  function fecharTour() { setTour(false); localStorage.setItem("tour-medico", "1"); }
  function reset() { store.resetar(); toast("info", "Dados de teste restaurados."); }

  const prof = store.profissionalById(profId);

  return (
    <div className="min-h-dvh">
      <TopBar roleLabel={store.especialidadeDoProf(profId)?.nome ?? "Médico"} userName={prof?.nome ?? "Médico"}
        tabs={TABS} active={tab} onSelect={setTab} onReset={reset} onExit={onExit} />
      <Page>
        {tab === "agenda" ? <DoctorAgenda profId={profId} /> : <DoctorSchedule profId={profId} />}
      </Page>
      <Tour steps={STEPS} open={tour} onClose={fecharTour} />
    </div>
  );
}
