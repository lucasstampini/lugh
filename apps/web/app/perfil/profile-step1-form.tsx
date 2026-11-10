"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AvatarUpload } from "@/app/onboarding/candidato/avatar-upload";
import { updateProfileStep1 } from "./actions";

export type ProfileStep1Defaults = {
  name: string;
  preferredName: string;
  email: string;
  bio: string;
};

// Cidade e estado saíram por enquanto (migration 20261109190000 ainda não
// rodou no projeto Supabase). Volta a incluir depois de aplicar a migration.
//
// Cada bloco é um cartão branco separado (bg-card, border-border,
// rounded-[20px]), igual ao Figma node 47:2: não é um formulário corrido.
export function ProfileStep1Form({
  defaultValues,
  avatarUrl,
  avatarName,
}: {
  defaultValues: ProfileStep1Defaults;
  avatarUrl: string | null;
  avatarName: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfileStep1, null);
  const [bioLength, setBioLength] = useState(defaultValues.bio.length);

  return (
    <form action={formAction} className="flex flex-col gap-[22px]">
      <div className="border-border bg-card flex items-center rounded-[20px] border p-6">
        <AvatarUpload
          initialUrl={avatarUrl}
          name={avatarName}
          size={72}
          rounded="rounded-[20px]"
          secondaryLabel="Adicionar foto"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="font-heading text-[22px] leading-[1.15] font-extrabold tracking-[-0.03em]">
              Sua foto, do seu jeito
            </p>
            <p className="text-muted-foreground text-xs">
              Opcional · JPG ou PNG de até 5 MB. As iniciais funcionam
              também.
            </p>
          </div>
        </AvatarUpload>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
        <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          Como você quer aparecer?
        </h3>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-xs font-bold">
              Nome completo *
            </label>
            <input
              id="name"
              name="name"
              defaultValue={defaultValues.name}
              required
              maxLength={120}
              className="border-input bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="preferredName" className="text-xs font-bold">
              Como quer ser chamada?
            </label>
            <input
              id="preferredName"
              name="preferredName"
              defaultValue={defaultValues.preferredName}
              maxLength={60}
              className="border-input bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-xs font-bold">
            E-mail da sua conta
          </label>
          <input
            id="email"
            value={defaultValues.email}
            disabled
            className="border-input bg-background text-muted-foreground h-[50px] rounded-md border px-3.5 text-sm outline-none"
          />
          <p className="text-muted-foreground text-[11px]">
            Esse e-mail é usado para acesso e lembretes.
          </p>
        </div>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
            Um pouco sobre você
          </h3>
          <p className="text-muted-foreground text-xs">
            Opcional. Uma apresentação curta ajuda seu entrevistador a
            conhecer seu momento.
          </p>
        </div>

        <div className="border-input flex flex-col gap-1.5 rounded-md border p-3.5">
          <textarea
            id="bio"
            name="bio"
            maxLength={300}
            rows={3}
            defaultValue={defaultValues.bio}
            onChange={(event) => setBioLength(event.target.value.length)}
            className="text-sm outline-none"
          />
          <span className="text-muted-foreground text-[10px]">
            {bioLength} / 300 caracteres
          </span>
        </div>
      </div>

      {state?.error ? <p className="text-destructive text-sm">{state.error}</p> : null}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link
            href="/entrevistadores"
            className="text-primary flex h-[52px] items-center text-sm font-bold"
          >
            Voltar para minha conta
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="bg-primary text-primary-foreground flex h-[52px] items-center gap-2 rounded-xl px-5 text-sm font-extrabold disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar e continuar →"}
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          Você pode salvar e sair para continuar depois.
        </p>
      </div>
    </form>
  );
}
