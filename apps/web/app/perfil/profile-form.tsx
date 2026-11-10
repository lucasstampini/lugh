"use client";

import { useActionState, useState } from "react";
import { AREA_OPTIONS } from "@/lib/interviewer-options";
import { updateProfile } from "./actions";

export type ProfileFormDefaults = {
  name: string;
  preferredName: string;
  experienceYears: number | null;
  areas: string[];
  targetRole: string;
  bio: string;
  linkedin: string;
  github: string;
};

export function ProfileForm({
  defaultValues,
  submitLabel = "Salvar alterações",
}: {
  defaultValues: ProfileFormDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, null);
  const [bioLength, setBioLength] = useState(defaultValues.bio.length);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-bold">
          Seu nome
        </label>
        <input
          id="name"
          name="name"
          defaultValue={defaultValues.name}
          required
          maxLength={120}
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="preferredName" className="text-sm font-bold">
          Nome de preferência
        </label>
        <input
          id="preferredName"
          name="preferredName"
          defaultValue={defaultValues.preferredName}
          maxLength={60}
          placeholder="Como quer ser chamado"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="experienceYears" className="text-sm font-bold">
          Experiência (anos)
        </label>
        <input
          id="experienceYears"
          name="experienceYears"
          type="number"
          min={0}
          max={60}
          defaultValue={defaultValues.experienceYears ?? ""}
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
              <input
                type="checkbox"
                name="areas"
                value={option.value}
                defaultChecked={defaultValues.areas.includes(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="targetRole" className="text-sm font-bold">
          Vaga ou cargo alvo
        </label>
        <input
          id="targetRole"
          name="targetRole"
          defaultValue={defaultValues.targetRole}
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
        <textarea
          id="bio"
          name="bio"
          maxLength={500}
          rows={4}
          defaultValue={defaultValues.bio}
          onChange={(event) => setBioLength(event.target.value.length)}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="linkedin" className="text-sm font-bold">
          LinkedIn
        </label>
        <input
          id="linkedin"
          name="linkedin"
          defaultValue={defaultValues.linkedin}
          placeholder="linkedin.com/in/seu-usuario"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="github" className="text-sm font-bold">
          GitHub
        </label>
        <input
          id="github"
          name="github"
          defaultValue={defaultValues.github}
          placeholder="github.com/seu-usuario"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {state?.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="text-sm font-medium text-emerald-600">Salvo.</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground flex h-11 w-full items-center justify-center rounded-lg text-sm font-bold disabled:opacity-60"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
