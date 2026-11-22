"use client";

import { Star } from "lucide-react";
import { useState } from "react";

// Nota em estrelas clicáveis. Por baixo são radios nativos (um por estrela),
// então setas do teclado, foco e envio do formulário funcionam sem JS extra.
// Quem usa envolve num role="radiogroup" com o rótulo do campo.
export function StarInput({
  name,
  values,
  value,
  onChange,
}: {
  name: string;
  // Notas possíveis, em ordem crescente (ex: 1 a 5).
  values: number[];
  value: number | null;
  onChange: (value: number) => void;
}) {
  // Passar o mouse mostra a nota que o clique daria.
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value ?? 0;
  const max = values[values.length - 1];

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex" onMouseLeave={() => setHovered(null)}>
        {values.map((step) => (
          <label
            key={step}
            onMouseEnter={() => setHovered(step)}
            className="lift has-focus-visible:outline-ring relative inline-flex size-11 cursor-pointer items-center justify-center rounded-[9px] has-focus-visible:outline-[3px]"
          >
            <input
              type="radio"
              name={name}
              value={step}
              checked={value === step}
              onChange={() => onChange(step)}
              className="sr-only"
            />
            <span className="sr-only">nota {step}</span>
            <Star
              aria-hidden="true"
              size={30}
              strokeWidth={1.6}
              className={`stroke-ink transition-colors duration-150 ${
                shown >= step ? "fill-primary" : "fill-card"
              }`}
            />
          </label>
        ))}
      </div>
      <span aria-hidden="true" className="w-9 font-mono text-sm font-bold tabular-nums">
        {value === null ? "" : `${value}/${max}`}
      </span>
    </div>
  );
}
