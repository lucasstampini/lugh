"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { AvatarUpload } from "@/app/onboarding/candidato/avatar-upload";
import { updateProfileStep1 } from "./actions";

export type ProfileStep1Defaults = {
  name: string;
  preferredName: string;
  email: string;
  bio: string;
};

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
      <div className="border-border bg-card flex items-center rounded-[20px] border-[1.5px] p-6">
        <AvatarUpload
          initialUrl={avatarUrl}
          name={avatarName}
          size={72}
          rounded="rounded-[20px]"
          secondaryLabel={avatarUrl ? "Trocar foto" : "Adicionar foto"}
          help="Opcional. JPG, PNG ou WEBP de até 4 MB. As iniciais funcionam também."
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="font-heading text-[22px] leading-[1.15] font-extrabold tracking-[-0.03em]">
              Sua foto, do seu jeito
            </p>
          </div>
        </AvatarUpload>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border-[1.5px] p-6">
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
              autoComplete="name"
              maxLength={120}
              className="border-border bg-card h-[50px] rounded-md border-[1.5px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="preferredName" className="text-xs font-bold">
              Como prefere ser chamado(a)?
            </label>
            <input
              id="preferredName"
              name="preferredName"
              defaultValue={defaultValues.preferredName}
              maxLength={60}
              className="border-border bg-card h-[50px] rounded-md border-[1.5px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-xs font-bold">
            E-mail da sua conta
          </label>
          <input
            id="email"
            type="email"
            value={defaultValues.email}
            readOnly
            aria-describedby="email-help"
            className="border-border bg-background text-muted-foreground h-[50px] rounded-md border-[1.5px] px-3.5 text-sm outline-none"
          />
          <p id="email-help" className="text-muted-foreground text-[11px]">
            Esse e-mail é usado para acesso e lembretes. Não dá para trocar por aqui.
          </p>
        </div>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border-[1.5px] p-6">
        <div className="flex flex-col gap-1.5">
          <h3
            id="bio-label"
            className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]"
          >
            Um pouco sobre você
          </h3>
          <p className="text-muted-foreground text-xs">
            Opcional. Uma apresentação curta ajuda seu entrevistador a
            conhecer seu momento.
          </p>
        </div>

        <div className="border-border focus-within:ring-ring flex flex-col gap-1.5 rounded-md border-[1.5px] p-3.5 focus-within:ring-2">
          <textarea
            id="bio"
            name="bio"
            aria-labelledby="bio-label"
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

      {state?.error ? (
        <p role="alert" className="text-destructive text-sm font-semibold">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/entrevistadores"
            className="text-brand-deep flex min-h-[52px] items-center text-sm font-bold"
          >
            Voltar para minha conta
          </Link>
          <button
            type="submit"
            disabled={pending}
            className={buttonVariants({ className: "h-[52px] px-5" })}
          >
            {pending ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          Só esta etapa é salva. Depois de salvar, você volta para os profissionais.
        </p>
      </div>
    </form>
  );
}
