"use client";

import { useActionState } from "react";
import { FieldError, LABEL_CLASS } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { WEEKDAY_LABELS } from "@/lib/interviewer-options";
import { addAvailabilityBlock } from "./actions";

const formatHour = (hour: number) => `${hour.toString().padStart(2, "0")}:00`;

const START_HOURS = Array.from({ length: 24 }, (_, hour) => formatHour(hour));
// O fim vai de 01:00 a 24:00 (meia-noite), pra permitir o bloco 23:00 às 00:00.
const END_HOURS = Array.from({ length: 24 }, (_, hour) => formatHour(hour + 1));

const BLOCK_SELECT = "edge bg-card h-11 rounded-[9px] px-3 text-sm font-semibold";

export function AddBlockForm() {
  const [state, formAction, pending] = useActionState(addAvailabilityBlock, null);

  return (
    <form
      action={formAction}
      className="edge-dashed flex flex-wrap items-end gap-3 rounded-xl p-3.5"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="weekday" className={LABEL_CLASS}>
          Dia
        </label>
        <select id="weekday" name="weekday" defaultValue={1} className={BLOCK_SELECT}>
          {WEEKDAY_LABELS.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="start" className={LABEL_CLASS}>
          Início
        </label>
        <select id="start" name="start" defaultValue="09:00" className={`${BLOCK_SELECT} font-mono`}>
          {START_HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="end" className={LABEL_CLASS}>
          Fim
        </label>
        <select id="end" name="end" defaultValue="10:00" className={`${BLOCK_SELECT} font-mono`}>
          {END_HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour === "24:00" ? "00:00 (meia-noite)" : hour}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="ink" disabled={pending}>
        {pending ? "Adicionando..." : "Adicionar bloco"}
      </Button>

      {state?.error ? (
        <div className="w-full">
          <FieldError message={state.error} />
        </div>
      ) : null}
    </form>
  );
}
