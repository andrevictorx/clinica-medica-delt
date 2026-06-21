import { useEffect, useId, useRef, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cx } from "./ui";

export interface Option {
  id: number;
  label: string;
  sublabel?: string;
}

export function Autocomplete({ options, value, onChange, placeholder = "Buscar...", id }: {
  options: Option[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  id?: string;
}) {
  const auto = useId();
  const inputId = id ?? auto;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.id === value) ?? null;
  const filtered = query.trim()
    ? options.filter(o => (o.label + " " + (o.sublabel ?? "")).toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(optId: number) {
    onChange(optId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative" ref={ref}>
      <div className={cx("flex items-center gap-2 h-11 px-3 rounded-xl bg-white border transition-colors",
        open ? "border-primary-400 ring-2 ring-primary-100" : "border-surface-2")}>
        <Search className="size-4 text-ink-soft shrink-0" />
        <input
          id={inputId}
          className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-soft"
          placeholder={placeholder}
          value={open ? query : selected?.label ?? ""}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
            else if (e.key === "Enter" && filtered[active]) { e.preventDefault(); choose(filtered[active].id); }
            else if (e.key === "Escape") setOpen(false);
          }}
          autoComplete="off"
        />
        <ChevronDown className={cx("size-4 text-ink-soft transition-transform", open && "rotate-180")} />
      </div>

      {open && (
        <ul className="absolute z-30 mt-1.5 w-full max-h-72 overflow-auto rounded-xl bg-white border border-surface-2 shadow-[var(--shadow-pop)] p-1.5 animate-[var(--animate-fade-in)]">
          {filtered.length === 0 && <li className="px-3 py-2.5 text-sm text-ink-soft">Nenhum resultado.</li>}
          {filtered.map((o, i) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o.id)}
                className={cx("w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                  i === active ? "bg-primary-50" : "hover:bg-surface")}>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink truncate">{o.label}</span>
                  {o.sublabel && <span className="block text-xs text-ink-soft truncate">{o.sublabel}</span>}
                </span>
                {o.id === value && <Check className="size-4 text-primary-600 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
