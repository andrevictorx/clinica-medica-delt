import { useEffect, useLayoutEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui";

export interface TourStep {
  selector: string;   // [data-tour="..."]
  title: string;
  body: string;
}

interface Rect { top: number; left: number; width: number; height: number }

/**
 * Tour guiado: destaca o elemento alvo (anel + backdrop escurecido via classe
 * .tour-highlight) e posiciona um tooltip ao lado. Controlado por `open`.
 */
export function Tour({ steps, open, onClose }: {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => { if (open) setI(0); }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const step = steps[i];
    const el = step ? document.querySelector<HTMLElement>(`[data-tour="${step.selector}"]`) : null;

    function measure() {
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("tour-highlight");
      measure();
      const t = setTimeout(measure, 320); // após o scroll suave
      window.addEventListener("resize", measure);
      window.addEventListener("scroll", measure, true);
      return () => {
        clearTimeout(t);
        window.removeEventListener("resize", measure);
        window.removeEventListener("scroll", measure, true);
        el.classList.remove("tour-highlight");
      };
    } else {
      setRect(null);
    }
  }, [open, i, steps]);

  if (!open || steps.length === 0) return null;
  const step = steps[i];
  const last = i === steps.length - 1;

  // Posição do tooltip: abaixo do alvo, ou acima se não couber.
  const margin = 12;
  const tipW = 320;
  let style: React.CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + margin;
    const placeBelow = below + 170 < window.innerHeight;
    const top = placeBelow ? below : Math.max(margin, rect.top - 170 - margin);
    let left = rect.left + rect.width / 2 - tipW / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tipW - margin));
    style = { top, left, width: tipW };
  } else {
    style = { top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: tipW };
  }

  return (
    <div className="fixed inset-0 z-[80]">
      {/* backdrop quando não há alvo (a classe .tour-highlight já escurece o resto) */}
      {!rect && <div className="absolute inset-0 bg-primary-900/55" />}
      <div className="fixed rounded-2xl bg-white shadow-[var(--shadow-pop)] p-5 animate-[var(--animate-slide-up)]" style={style}>
        <button onClick={onClose} className="absolute top-3 right-3 text-ink-soft hover:text-ink">
          <X className="size-4" />
        </button>
        <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">
          Passo {i + 1} de {steps.length}
        </p>
        <h4 className="font-semibold text-ink mb-1.5 pr-4">{step.title}</h4>
        <p className="text-sm text-ink-soft leading-relaxed mb-4">{step.body}</p>
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-ink-soft hover:text-ink transition-colors">Pular tour</button>
          <div className="flex gap-2">
            {i > 0 && <Button variant="secondary" size="sm" onClick={() => setI(i - 1)}>Anterior</Button>}
            <Button size="sm" onClick={() => (last ? onClose() : setI(i + 1))}>
              {last ? "Concluir" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
