import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, hoje, inicioSemana, nomeMesAno, parseISO, toISO } from "../lib/datetime";
import { cx } from "./ui";

const DOW = ["S", "T", "Q", "Q", "S", "S", "D"]; // Seg..Dom

/**
 * Date picker mensal expansível. `marcados` recebe ISOs com disponibilidade
 * (recebem um ponto verde). Datas passadas ficam desabilitadas.
 */
export function Calendar({ value, onChange, marcados }: {
  value: string;
  onChange: (iso: string) => void;
  marcados?: Set<string>;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = parseISO(value || hoje());
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const today = hoje();

  const first = toISO(cursor);
  const gridStart = inicioSemana(first);
  const days: string[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));

  function shiftMonth(delta: number) {
    setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-ink">{nomeMesAno(first)}</span>
        <div className="flex gap-1">
          <button onClick={() => shiftMonth(-1)} className="grid place-items-center size-8 rounded-lg text-ink-soft hover:bg-surface-2 transition-colors">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => shiftMonth(1)} className="grid place-items-center size-8 rounded-lg text-ink-soft hover:bg-surface-2 transition-colors">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map((d, i) => <div key={i} className="text-center text-[11px] font-medium text-ink-soft py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(iso => {
          const d = parseISO(iso);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isPast = iso < today;
          const isSel = iso === value;
          const isToday = iso === today;
          const tem = marcados?.has(iso);
          return (
            <button
              key={iso}
              disabled={isPast}
              onClick={() => onChange(iso)}
              className={cx(
                "relative h-9 rounded-lg text-sm transition-all",
                !inMonth && "text-ink-soft/40",
                inMonth && !isSel && "text-ink hover:bg-primary-50",
                isPast && "opacity-30 pointer-events-none",
                isSel && "bg-primary-600 text-white font-semibold shadow-sm",
                isToday && !isSel && "ring-1 ring-primary-300",
              )}>
              {d.getDate()}
              {tem && !isSel && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[--color-livre]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
