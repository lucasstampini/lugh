"use client";

import { useState, useTransition } from "react";
import { FieldError } from "@/components/form-field";
import { Button } from "@/components/ui/button";
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
      <Button
        type="button"
        onClick={handleClick}
        disabled={pending}
        variant={isPaused ? "default" : "outline"}
        className="h-12 px-5"
      >
        {pending ? "Salvando..." : isPaused ? "Reativar perfil" : "Pausar perfil"}
      </Button>
      <FieldError message={error} />
    </div>
  );
}
