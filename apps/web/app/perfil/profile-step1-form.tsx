"use client";

import { useActionState, useState } from "react";
import { AvatarUpload } from "@/app/onboarding/candidato/avatar-upload";
import { updateProfileStep1 } from "./actions";
import { WizardFooter } from "./wizard-parts";
import { Field, FormAlert, LABEL_CLASS } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type ProfileStep1Defaults = {
  name: string;
  preferredName: string;
  email: string;
  bio: string;
};

// Cidade e estado saíram por enquanto (migration 20261109200000 ainda não
// rodou no projeto Supabase). Volta a incluir depois de aplicar a migration.
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
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error ? <FormAlert title={state.error} /> : null}

      <AvatarUpload initialUrl={avatarUrl} name={avatarName} size={96} secondaryLabel="Trocar foto">
        <span className={LABEL_CLASS}>Foto</span>
      </AvatarUpload>

      <div className="flex flex-wrap gap-5">
        <Field label="Nome" htmlFor="name" className="flex-[1_1_220px]">
          <Input
            id="name"
            name="name"
            autoComplete="name"
            defaultValue={defaultValues.name}
            required
            maxLength={120}
          />
        </Field>
        <Field
          label="Nome de preferência"
          htmlFor="preferredName"
          help="Opcional. Como você quer ser chamado na entrevista."
          className="flex-[1_1_220px]"
        >
          <Input
            id="preferredName"
            name="preferredName"
            defaultValue={defaultValues.preferredName}
            maxLength={60}
          />
        </Field>
      </div>

      <Field
        label="E-mail"
        htmlFor="email"
        help="É o e-mail da sua conta. Não dá para mudar por aqui."
      >
        <Input id="email" type="email" value={defaultValues.email} readOnly className="bg-secondary" />
      </Field>

      <Field
        label="Sobre você"
        htmlFor="bio"
        help="Opcional. Uma apresentação curta ajuda o entrevistador a conhecer seu momento."
        counter={`${bioLength}/300`}
      >
        <Textarea
          id="bio"
          name="bio"
          maxLength={300}
          rows={3}
          defaultValue={defaultValues.bio}
          onChange={(event) => setBioLength(event.target.value.length)}
        />
      </Field>

      <WizardFooter>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvando..." : "Salvar e continuar"}
        </Button>
      </WizardFooter>
    </form>
  );
}
