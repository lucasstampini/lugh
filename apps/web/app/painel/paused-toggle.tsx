"use client";

import { useState, useTransition } from "react";
import { togglePaused } from "./actions";

export function PausedToggle({ paused }: { paused: boolean }) {
  const [isPaused, setIsPaused] = useState(paused);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    const next = !isPaused;
    startTransition(async () => {
      const result = await togglePaused(next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsPaused(next);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`flex h-11 items-center justify-center rounded-lg px-5 text-sm font-bold disabled:opacity-60 ${
          isPaused
            ? "bg-primary text-primary-foreground"
            : "border-border border bg-transparent text-foreground"
        }`}
      >
        {pending ? "Salvando..." : isPaused ? "Retomar perfil" : "Pausar perfil"}
      </button>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
