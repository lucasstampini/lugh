"use client";

import { X } from "lucide-react";
import { useTransition } from "react";
import { deleteAvailabilityBlock } from "./actions";

export function DeleteBlockButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Apagar bloco"
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          void deleteAvailabilityBlock(id);
        })
      }
      className="text-primary hover:text-destructive disabled:opacity-50"
    >
      <X aria-hidden="true" size={14} />
    </button>
  );
}
