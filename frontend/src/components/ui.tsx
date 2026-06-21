import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ----------------------------- Button ---------------------------------- */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm",
  secondary: "bg-white text-primary-700 border border-primary-200 hover:bg-primary-50",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-2",
  danger: "bg-[--color-ocupado] text-white hover:brightness-95 shadow-sm",
  success: "bg-[--color-livre] text-white hover:brightness-95 shadow-sm",
};
const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function Button({
  variant = "primary", size = "md", className, children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant], SIZES[size], className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Card ----------------------------------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-2xl bg-white border border-surface-2 shadow-[var(--shadow-card)]", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ icon, title, subtitle, action }: {
  icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        {icon && <div className="grid place-items-center size-10 rounded-xl bg-primary-50 text-primary-600">{icon}</div>}
        <div>
          <h2 className="text-lg font-semibold text-ink leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Badge ---------------------------------- */
const ESTADO_STYLE: Record<string, string> = {
  Agendada: "bg-primary-50 text-primary-700 ring-primary-200",
  Realizada: "bg-[--color-livre-soft] text-[--color-livre] ring-[color-mix(in_srgb,var(--color-livre)_30%,white)]",
  Cancelada: "bg-surface-2 text-ink-soft ring-slate-200",
  Faltou: "bg-[--color-ocupado-soft] text-[--color-ocupado] ring-[color-mix(in_srgb,var(--color-ocupado)_30%,white)]",
  Bloqueio: "bg-[--color-ocupado-soft] text-[--color-ocupado] ring-[color-mix(in_srgb,var(--color-ocupado)_30%,white)]",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
      ESTADO_STYLE[estado] ?? ESTADO_STYLE.Cancelada)}>
      {estado}
    </span>
  );
}

/* ----------------------------- Skeleton -------------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("rounded-lg bg-surface-2 animate-[var(--animate-shimmer)]", className)} />;
}

/* ----------------------------- Spinner --------------------------------- */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ----------------------------- Avatar ---------------------------------- */
export function Avatar({ nome, className }: { nome: string; className?: string }) {
  const initials = nome.replace(/^(Dr\.|Dra\.)\s*/i, "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className={cx("grid place-items-center rounded-full bg-primary-100 text-primary-700 font-semibold select-none", className ?? "size-10 text-sm")}>
      {initials}
    </div>
  );
}

/* --------------------------- EmptyState -------------------------------- */
export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon && <div className="grid place-items-center size-14 rounded-2xl bg-surface-2 text-ink-soft mb-3">{icon}</div>}
      <p className="font-medium text-ink">{title}</p>
      {hint && <p className="text-sm text-ink-soft mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}
