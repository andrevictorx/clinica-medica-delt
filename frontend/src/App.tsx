import { useState } from "react";
import { StoreProvider } from "./data/store";
import { ToastProvider } from "./components/Toast";
import { RoleGate, type Session } from "./features/RoleGate";
import { PatientApp } from "./features/patient/PatientApp";
import { DoctorApp } from "./features/doctor/DoctorApp";

/** Deep-link de demonstração: ?perfil=medico|paciente&id=1&tour=0 */
function sessaoInicial(): Session | null {
  const p = new URLSearchParams(window.location.search);
  const perfil = p.get("perfil");
  if (p.get("tour") === "0") { localStorage.setItem("tour-paciente", "1"); localStorage.setItem("tour-medico", "1"); }
  if (perfil === "medico" || perfil === "paciente")
    return { role: perfil, userId: Number(p.get("id")) || 1 };
  return null;
}

function Shell() {
  const [session, setSession] = useState<Session | null>(sessaoInicial);

  if (!session) return <RoleGate onEnter={setSession} />;
  if (session.role === "paciente")
    return <PatientApp userId={session.userId} onExit={() => setSession(null)} />;
  return <DoctorApp profId={session.userId} onExit={() => setSession(null)} />;
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  );
}
