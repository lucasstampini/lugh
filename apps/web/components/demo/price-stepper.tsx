"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";

// Preço de exemplo da landing: a pessoa mexe no valor e vê quanto fica com
// ela. Só demonstração, nada é salvo. Valores em centavos, como no produto.
const STEP_CENTS = 1000;
const MIN_CENTS = 3000;
const MAX_CENTS = 50000;
// O Lugh retém 20%: 80% do valor da sessão vai para quem entrevista.
const INTERVIEWER_SHARE = 0.8;

export function PriceStepper() {
  const [priceCents, setPriceCents] = useState(10000);

  return (
    <div className="edge bg-card flex flex-wrap items-center justify-between gap-4 rounded-[18px] p-5">
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground font-mono text-xs">seu preço por sessão</span>
        <span
          aria-live="polite"
          className="font-heading text-[clamp(28px,3vw,38px)] leading-none font-extrabold tabular-nums"
        >
          {formatPrice(priceCents)}
        </span>
        <span className="text-muted-foreground text-sm">
          Você recebe{" "}
          <strong className="text-foreground font-extrabold tabular-nums">
            {formatPrice(Math.round(priceCents * INTERVIEWER_SHARE))}
          </strong>{" "}
          por sessão concluída.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Diminuir o preço em R$ 10"
          disabled={priceCents <= MIN_CENTS}
          onClick={() => setPriceCents((value) => Math.max(MIN_CENTS, value - STEP_CENTS))}
        >
          <Minus aria-hidden="true" strokeWidth={2.6} />
        </Button>
        <Button
          type="button"
          size="icon"
          aria-label="Aumentar o preço em R$ 10"
          disabled={priceCents >= MAX_CENTS}
          onClick={() => setPriceCents((value) => Math.min(MAX_CENTS, value + STEP_CENTS))}
        >
          <Plus aria-hidden="true" strokeWidth={2.6} />
        </Button>
      </div>
    </div>
  );
}
