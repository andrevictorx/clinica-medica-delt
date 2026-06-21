import type { ReactNode } from "react";
import { HeartPulse, RefreshCw, LogOut } from "lucide-react";
import { Avatar, cx } from "./ui";

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid place-items-center size-9 rounded-xl bg-primary-600 text-white shadow-sm">
        <HeartPulse className="size-5" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-semibold text-ink text-[15px]">Clínica Médica <span className="text-primary-600">DELT</span></p>
          <p className="text-[11px] text-ink-soft -mt-0.5">UFPR · Engenharia Elétrica</p>
        </div>
      )}
    </div>
  );
}

export interface Tab { id: string; label: string; icon: ReactNode; tourId?: string }

export function TopBar({ roleLabel, userName, tabs, active, onSelect, onReset, onExit }: {
  roleLabel: string;
  userName: string;
  tabs: Tab[];
  active: string;
  onSelect: (id: string) => void;
  onReset: () => void;
  onExit: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-surface-2">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Logo />
          <div className="flex items-center gap-2">
            <button onClick={onReset} title="Restaurar dados de teste"
              className="hidden sm:grid place-items-center size-9 rounded-lg text-ink-soft hover:bg-surface-2 transition-colors">
              <RefreshCw className="size-4" />
            </button>
            <div data-tour="trocar-perfil" className="flex items-center gap-2.5 pl-1 pr-1.5 py-1 rounded-full border border-surface-2 bg-white">
              <Avatar nome={userName} className="size-8 text-xs" />
              <div className="hidden sm:block leading-tight pr-1">
                <p className="text-sm font-medium text-ink max-w-[160px] truncate">{userName}</p>
                <p className="text-[11px] text-ink-soft -mt-0.5">{roleLabel}</p>
              </div>
              <button onClick={onExit} title="Trocar perfil"
                className="grid place-items-center size-7 rounded-full text-ink-soft hover:bg-surface-2 transition-colors">
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              data-tour={t.tourId}
              onClick={() => onSelect(t.id)}
              className={cx(
                "relative flex items-center gap-2 px-4 h-11 text-sm font-medium whitespace-nowrap transition-colors",
                active === t.id ? "text-primary-700" : "text-ink-soft hover:text-ink",
              )}>
              {t.icon}
              {t.label}
              {active === t.id && <span className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-primary-600" />}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4 py-6 animate-[var(--animate-fade-in)]">{children}</main>;
}
