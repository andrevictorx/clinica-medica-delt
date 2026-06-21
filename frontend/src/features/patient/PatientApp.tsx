import { useEffect, useState } from "react";
import { LayoutDashboard, CalendarPlus } from "lucide-react";
import { Page, TopBar, type Tab } from "../../components/AppShell";
import { Tour, type TourStep } from "../../components/Tour";
import { useStore } from "../../data/store";
import { useToast } from "../../components/Toast";
import { PatientDashboard } from "./PatientDashboard";
import { BookingFlow } from "./BookingFlow";

const TABS: Tab[] = [
  { id: "inicio", label: "Início", icon: <LayoutDashboard className="size-4" /> },
  { id: "agendar", label: "Agendar consulta", icon: <CalendarPlus className="size-4" />, tourId: "nav-agendar" },
];

const STEPS: TourStep[] = [
  { selector: "nav-agendar", title: "Agende sua consulta", body: "Clique aqui para buscar um médico por nome ou especialidade e escolher o melhor horário." },
  { selector: "proximas", title: "Suas próximas consultas", body: "Seus atendimentos confirmados aparecem aqui, com data, horário, profissional e sala." },
  { selector: "trocar-perfil", title: "Troque de perfil quando quiser", body: "Use este menu para sair ou alternar entre paciente e médico durante a demonstração." },
];

export function PatientApp({ userId, onExit }: { userId: number; onExit: () => void }) {
  const store = useStore();
  const toast = useToast();
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get("tab") ?? "inicio");
  const [tour, setTour] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("tour-paciente")) {
      const t = setTimeout(() => setTour(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  function fecharTour() { setTour(false); localStorage.setItem("tour-paciente", "1"); }
  function reset() { store.resetar(); toast("info", "Dados de teste restaurados."); }

  const user = store.pacienteById(userId);

  return (
    <div className="min-h-dvh">
      <TopBar roleLabel="Paciente" userName={user?.nome ?? "Paciente"} tabs={TABS}
        active={tab} onSelect={setTab} onReset={reset} onExit={onExit} />
      <Page>
        {tab === "inicio"
          ? <PatientDashboard userId={userId} onAgendar={() => setTab("agendar")} />
          : <BookingFlow userId={userId} />}
      </Page>
      <Tour steps={STEPS} open={tour} onClose={fecharTour} />
    </div>
  );
}
