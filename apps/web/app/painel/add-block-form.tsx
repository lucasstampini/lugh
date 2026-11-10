"use client";

import { useActionState } from "react";
import { WEEKDAY_LABELS } from "@/lib/interviewer-options";
import { addAvailabilityBlock } from "./actions";

const HOURS = Array.from({ length: 24 }, (_, hour) => {
  const value = `${hour.toString().padStart(2, "0")}:00`;
  return value;
});

export function AddBlockForm() {
  const [state, formAction, pending] = useActionState(addAvailabilityBlock, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="weekday" className="text-xs font-bold">
          Dia
        </label>
        <select
          id="weekday"
          name="weekday"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm"
        >
          {WEEKDAY_LABELS.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="start" className="text-xs font-bold">
          Início
        </label>
        <select
          id="start"
          name="start"
          defaultValue="09:00"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm"
        >
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="end" className="text-xs font-bold">
          Fim
        </label>
        <select
          id="end"
          name="end"
          defaultValue="10:00"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm"
        >
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground h-11 rounded-md px-5 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Adicionando..." : "Adicionar bloco"}
      </button>

      {state?.error ? (
        <p className="text-destructive w-full text-sm">{state.error}</p>
      ) : null}
    </form>
  );
}
