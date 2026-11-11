"use client";

import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteAvailabilityBlock } from "./actions";

export function DeleteBlockButton({ id, description }: { id: string; description: string }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const label = failed
    ? `Não deu para remover o bloco de ${description}. Tentar de novo`
    : `Remover bloco de ${description}`;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteAvailabilityBlock(id);
          setFailed(Boolean(result.error));
        })
      }
      className={`hover:bg-card flex size-9 items-center justify-center rounded-[7px] disabled:opacity-50 ${
        failed ? "text-destructive" : "text-foreground"
      }`}
    >
      <X aria-hidden="true" size={14} strokeWidth={2.4} />
    </button>
  );
}
