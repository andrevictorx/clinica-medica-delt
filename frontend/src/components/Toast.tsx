import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cx } from "./ui";

type ToastType = "success" | "error" | "info";
interface Toast { id: number; type: ToastType; message: string }

const ToastCtx = createContext<(t: ToastType, message: string) => void>(() => {});

const STYLE: Record<ToastType, { bar: string; icon: ReactNode }> = {
  success: { bar: "bg-[--color-livre]", icon: <CheckCircle2 className="size-5 text-[--color-livre]" /> },
  error: { bar: "bg-[--color-ocupado]", icon: <XCircle className="size-5 text-[--color-ocupado]" /> },
  info: { bar: "bg-primary-500", icon: <Info className="size-5 text-primary-600" /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);

  const dismiss = (id: number) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,360px)]">
        {toasts.map(t => (
          <div key={t.id}
            className="relative flex items-start gap-3 overflow-hidden rounded-xl bg-white border border-surface-2 shadow-[var(--shadow-pop)] p-3.5 pl-4 animate-[var(--animate-slide-up)]">
            <span className={cx("absolute left-0 top-0 h-full w-1", STYLE[t.type].bar)} />
            {STYLE[t.type].icon}
            <p className="text-sm text-ink flex-1 leading-snug">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-ink-soft hover:text-ink transition-colors">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastCtx);
}
