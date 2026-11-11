"use client";

import { useActionState, useState } from "react";
import { createInterviewerProfile } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { AREA_OPTIONS, SENIORITY_OPTIONS } from "./schema";

type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export type InterviewerFormDefaults = {
  headline: string;
  company: string;
  seniority: string;
  areas: string[];
  price: string;
  bio: string;
  linkedin: string;
  github: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="text-destructive text-sm">{message}</p>;
}

export function InterviewerForm({
  defaultValues,
  submitLabel = "Publicar perfil",
}: {
  defaultValues?: InterviewerFormDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createInterviewerProfile,
    null,
  );
  const [bioLength, setBioLength] = useState(
    defaultValues?.bio.length ?? 0,
  );
  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="headline" className="text-sm font-medium">
          Headline
        </label>
        <input
          id="headline"
          name="headline"
          maxLength={80}
          defaultValue={defaultValues?.headline}
          placeholder="Engenheiro de Software Sênior"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <FieldError message={fieldErrors.headline} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="company" className="text-sm font-medium">
          Empresa
        </label>
        <input
          id="company"
          name="company"
          maxLength={60}
          defaultValue={defaultValues?.company}
          placeholder="Fintech de grande porte"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <FieldError message={fieldErrors.company} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="seniority" className="text-sm font-medium">
          Senioridade
        </label>
        <select
          id="seniority"
          name="seniority"
          defaultValue={defaultValues?.seniority ?? ""}
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            Escolha uma opção
          </option>
          {SENIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError message={fieldErrors.seniority} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Áreas</span>
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
                defaultChecked={defaultValues?.areas.includes(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError message={fieldErrors.areas} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="price" className="text-sm font-medium">
          Preço por sessão (R$)
        </label>
        <input
          id="price"
          name="price"
          inputMode="decimal"
          defaultValue={defaultValues?.price}
          placeholder="100 ou 100,50"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <FieldError message={fieldErrors.price} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="bio" className="text-sm font-medium">
            Bio
          </label>
          <span className="text-muted-foreground text-xs">
            {bioLength}/500
          </span>
        </div>
        <textarea
          id="bio"
          name="bio"
          maxLength={500}
          rows={4}
          defaultValue={defaultValues?.bio}
          onChange={(event) => setBioLength(event.target.value.length)}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <FieldError message={fieldErrors.bio} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="linkedin" className="text-sm font-medium">
          LinkedIn
        </label>
        <input
          id="linkedin"
          name="linkedin"
          defaultValue={defaultValues?.linkedin}
          placeholder="linkedin.com/in/seu-usuario"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <FieldError message={fieldErrors.linkedin} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="github" className="text-sm font-medium">
          GitHub (opcional)
        </label>
        <input
          id="github"
          name="github"
          defaultValue={defaultValues?.github}
          placeholder="github.com/seu-usuario"
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <FieldError message={fieldErrors.github} />
      </div>

      {state?.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
