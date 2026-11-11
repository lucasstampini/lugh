"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { confirmCandidate } from "@/app/onboarding/actions";
import { CodeAccent, CodeBlock, CodeMuted, CodeString } from "@/components/code-block";
import { Eyebrow } from "@/components/eyebrow";
import { ChoicePill, DashedLabel, Field, FormAlert, LABEL_CLASS } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/initials";
import { AREA_OPTIONS } from "@/lib/interviewer-options";
import { AvatarUpload } from "./avatar-upload";

const areaLabels: Record<string, string> = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);

type Preview = {
  name: string;
  targetRole: string;
  areas: string[];
  linkedin: string;
  github: string;
};

function JsonLine({ field, value, last }: { field: string; value: string; last?: boolean }) {
  return (
    <div>
      {"  "}
      <CodeString>{`"${field}"`}</CodeString>:{" "}
      {value ? <CodeAccent>{`"${value}"`}</CodeAccent> : <CodeMuted>null</CodeMuted>}
      {last ? "" : ","}
    </div>
  );
}

export function ConfirmNameForm({
  initialName,
  initialAvatarUrl,
}: {
  initialName: string;
  initialAvatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(confirmCandidate, null);
  const [bioLength, setBioLength] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  // Só alimenta a prévia ao lado: os campos continuam não controlados e quem
  // valida e salva é a action.
  const [preview, setPreview] = useState<Preview>({
    name: initialName,
    targetRole: "",
    areas: [],
    linkedin: "",
    github: "",
  });

  function handleChange(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    setPreview({
      name: String(data.get("name") ?? ""),
      targetRole: String(data.get("targetRole") ?? ""),
      areas: data.getAll("areas").map(String),
      linkedin: String(data.get("linkedin") ?? ""),
      github: String(data.get("github") ?? ""),
    });
  }

  const previewName = preview.name.trim() || "Seu nome";
  const previewAreas = preview.areas.map((area) => areaLabels[area] ?? area);

  return (
    <div className="flex flex-wrap items-start gap-x-14 gap-y-9">
      <form
        action={formAction}
        onChange={handleChange}
        className="flex min-w-0 flex-[999_1_460px] flex-col gap-[26px]"
      >
        <div className="flex flex-col gap-2">
          <Eyebrow>seus dados</Eyebrow>
          <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
            Conte quem é você
          </h1>
          <p className="text-muted-foreground">
            O entrevistador vê esses dados antes da sessão. Só o nome é obrigatório.
          </p>
        </div>

        {state?.error ? <FormAlert title={state.error} /> : null}

        <AvatarUpload
          initialUrl={initialAvatarUrl}
          name={preview.name}
          size={96}
          onUploaded={setAvatarUrl}
          secondaryLabel="Enviar foto"
        >
          <span className={LABEL_CLASS}>Foto</span>
        </AvatarUpload>

        <Field label="Nome" htmlFor="name" help="Como você aparece para o entrevistador.">
          <Input
            id="name"
            name="name"
            autoComplete="name"
            defaultValue={initialName}
            required
            maxLength={120}
          />
        </Field>

        <DashedLabel>opcional</DashedLabel>

        <div className="flex flex-wrap gap-5">
          <Field
            label="Nome de preferência"
            htmlFor="preferredName"
            help="Como você quer ser chamado na entrevista."
            className="flex-[1_1_200px]"
          >
            <Input id="preferredName" name="preferredName" maxLength={60} />
          </Field>
          <Field label="Anos de experiência" htmlFor="experienceYears" className="flex-[1_1_200px]">
            <Input
              id="experienceYears"
              name="experienceYears"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              placeholder="0"
            />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${LABEL_CLASS} mb-2`}>Áreas de interesse</legend>
          <div className="flex flex-wrap gap-2">
            {AREA_OPTIONS.map((option) => (
              <ChoicePill key={option.value} name="areas" value={option.value}>
                {option.label}
              </ChoicePill>
            ))}
          </div>
        </fieldset>

        <Field
          label="Vaga ou cargo que você busca"
          htmlFor="targetRole"
          help="Exemplo: primeira vaga júnior de back-end."
        >
          <Input id="targetRole" name="targetRole" maxLength={80} />
        </Field>

        <Field label="Sobre você" htmlFor="bio" counter={`${bioLength}/500`}>
          <Textarea
            id="bio"
            name="bio"
            maxLength={500}
            rows={3}
            onChange={(event) => setBioLength(event.target.value.length)}
          />
        </Field>

        <div className="flex flex-wrap gap-5">
          <Field label="LinkedIn" htmlFor="linkedin" className="flex-[1_1_200px]">
            <Input id="linkedin" name="linkedin" placeholder="linkedin.com/in/seu-perfil" />
          </Field>
          <Field label="GitHub" htmlFor="github" className="flex-[1_1_200px]">
            <Input id="github" name="github" placeholder="github.com/seu-usuario" />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1.5">
          <Link
            href="/onboarding"
            className="text-foreground inline-flex min-h-12 items-center gap-2 font-bold"
          >
            <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
            Voltar
          </Link>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Salvando..." : "Salvar e ver entrevistadores"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </form>

      <aside
        aria-label="Prévia do seu perfil"
        className="pop flex w-full min-w-0 flex-[1_1_300px] flex-col gap-3 md:max-w-[380px]"
      >
        <span className="font-mono text-xs font-bold">prévia · como o entrevistador te vê</span>
        <div className="bg-secondary flex flex-col gap-3.5 rounded-[18px] p-[18px]">
          <div className="edge bg-card flex items-center gap-3.5 rounded-[14px] p-3.5">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={64}
                height={64}
                unoptimized
                className="edge size-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="edge bg-accent flex size-16 shrink-0 items-center justify-center rounded-full font-mono text-lg font-bold"
              >
                {initials(previewName)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-lg font-extrabold break-words">{previewName}</p>
              {preview.targetRole ? (
                <p className="text-muted-foreground text-sm break-words">{preview.targetRole}</p>
              ) : null}
              {previewAreas.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {previewAreas.map((area) => (
                    <span
                      key={area}
                      className="edge rounded-md px-[7px] py-px font-mono text-xs lowercase"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <CodeBlock className="rounded-xl text-xs">
            <div>{"{"}</div>
            <JsonLine field="nome" value={preview.name.trim()} />
            <JsonLine field="areas" value={previewAreas.join(", ").toLowerCase()} />
            <JsonLine field="linkedin" value={preview.linkedin.trim()} />
            <JsonLine field="github" value={preview.github.trim()} last />
            <div>{"}"}</div>
          </CodeBlock>
        </div>
      </aside>
    </div>
  );
}
