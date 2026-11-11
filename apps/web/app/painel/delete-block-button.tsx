"use client";

import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteAvailabilityBlock } from "./actions";

export function DeleteBlockButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const label = failed
    ? "Não deu para apagar o bloco. Tentar de novo"
    : "Apagar bloco";

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
      className={`hover:text-destructive disabled:opacity-50 ${
        failed ? "text-destructive" : "text-primary"
      }`}
    >
      <X aria-hidden="true" size={14} />
    </button>
  );
}
