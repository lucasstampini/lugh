"use client";

import { useActionState, useState } from "react";
import { confirmCandidate } from "@/app/onboarding/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AREA_OPTIONS } from "@/lib/interviewer-options";

export function ConfirmNameForm({ initialName }: { initialName: string }) {
  const [state, formAction, pending] = useActionState(confirmCandidate, null);
  const [bioLength, setBioLength] = useState(0);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-bold">
          Seu nome
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={initialName}
          required
          maxLength={120}
          autoFocus
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="preferredName" className="text-sm font-bold">
          Nome de preferência
        </label>
        <Input
          id="preferredName"
          name="preferredName"
          maxLength={60}
          placeholder="Como quer ser chamado"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="experienceYears" className="text-sm font-bold">
          Experiência (anos)
        </label>
        <Input
          id="experienceYears"
          name="experienceYears"
          type="number"
          min={0}
          max={60}
          placeholder="Ex: 2"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">Funções principais</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {AREA_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm"
            >
              <input type="checkbox" name="areas" value={option.value} />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="targetRole" className="text-sm font-bold">
          Vaga ou cargo alvo
        </label>
        <Input
          id="targetRole"
          name="targetRole"
          maxLength={80}
          placeholder="Ex: Backend Sênior"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="bio" className="text-sm font-bold">
            Bio
          </label>
          <span className="text-muted-foreground text-xs">{bioLength}/500</span>
        </div>
        <Textarea
          id="bio"
          name="bio"
          maxLength={500}
          rows={3}
          onChange={(event) => setBioLength(event.target.value.length)}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="linkedin" className="text-sm font-bold">
          LinkedIn
        </label>
        <Input
          id="linkedin"
          name="linkedin"
          placeholder="linkedin.com/in/seu-usuario"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="github" className="text-sm font-bold">
          GitHub
        </label>
        <Input
          id="github"
          name="github"
          placeholder="github.com/seu-usuario"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {state?.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground flex h-11 w-full items-center justify-center rounded-lg text-sm font-bold disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Confirmar"}
      </button>
    </form>
  );
}
