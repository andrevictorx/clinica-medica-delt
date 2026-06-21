import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, footer, size = "md" }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  if (!open) return null;
  const w = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4 animate-[var(--animate-fade-in)]">
      <div className="absolute inset-0 bg-primary-900/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative w-full ${w} rounded-2xl bg-white shadow-[var(--shadow-pop)] animate-[var(--animate-slide-up)]`}>
        <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-surface-2">
          <h3 className="font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="grid place-items-center size-8 rounded-lg text-ink-soft hover:bg-surface-2 transition-colors">
            <X className="size-5" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 px-5 py-4 border-t border-surface-2 bg-surface/50 rounded-b-2xl">{footer}</footer>}
      </div>
    </div>
  );
}
