"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { createInterviewerProfile } from "@/app/onboarding/actions";
import { AvatarUpload } from "@/app/onboarding/candidato/avatar-upload";
import { Eyebrow } from "@/components/eyebrow";
import {
  ChoicePill,
  Field,
  FieldError,
  FormAlert,
  LABEL_CLASS,
  SELECT_CLASS,
} from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/initials";
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

const areaLabels: Record<string, string> = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);

type Preview = { headline: string; company: string; areas: string[]; price: string };

export function InterviewerForm({
  defaultValues,
  submitLabel = "Publicar perfil",
  title,
  backHref,
  profileName,
  avatarUrl: initialAvatarUrl,
}: {
  defaultValues?: InterviewerFormDefaults;
  submitLabel?: string;
  title: string;
  backHref: string;
  // Nome da conta, só para a prévia do card.
  profileName: string;
  // Foto atual da conta (no login com Google, vem a foto do Google).
  avatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createInterviewerProfile,
    null,
  );
  const [bioLength, setBioLength] = useState(defaultValues?.bio.length ?? 0);
  // A foto é salva na hora pelo AvatarUpload (action própria), fora do envio
  // deste formulário. O estado aqui só mantém a prévia do card em dia.
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  // Só alimenta a prévia ao lado: os campos continuam não controlados e quem
  // valida e salva é a action.
  const [preview, setPreview] = useState<Preview>({
    headline: defaultValues?.headline ?? "",
    company: defaultValues?.company ?? "",
    areas: defaultValues?.areas ?? [],
    price: defaultValues?.price ?? "",
  });
  const fieldErrors = state?.fieldErrors ?? {};
  const errorCount = Object.keys(fieldErrors).length;

  function handleChange(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    setPreview({
      headline: String(data.get("headline") ?? ""),
      company: String(data.get("company") ?? ""),
      areas: data.getAll("areas").map(String),
      price: String(data.get("price") ?? ""),
    });
  }

  const previewRole = [preview.headline.trim(), preview.company.trim()].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-wrap items-start gap-x-14 gap-y-9">
      <form
        action={formAction}
        onChange={handleChange}
        noValidate
        className="flex min-w-0 flex-[999_1_480px] flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <Eyebrow>seu perfil público</Eyebrow>
          <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
            {title}
          </h1>
          <p className="text-muted-foreground">
            É isso que o candidato vê antes de agendar com você.
          </p>
        </div>

        {errorCount > 0 ? (
          <FormAlert
            title={
              errorCount === 1
                ? "Revise 1 campo para salvar o perfil"
                : `Revise ${errorCount} campos para salvar o perfil`
            }
          />
        ) : null}
        {state?.error ? <FormAlert title={state.error} /> : null}

        <AvatarUpload
          initialUrl={initialAvatarUrl}
          name={profileName}
          size={96}
          onUploaded={setAvatarUrl}
          secondaryLabel={avatarUrl ? "Trocar foto" : "Enviar foto"}
          help="Aparece no seu card e no seu perfil. JPG, PNG ou WEBP de até 4 MB."
        >
          <span className={LABEL_CLASS}>Foto</span>
        </AvatarUpload>

        <Field
          label="Cargo atual"
          htmlFor="headline"
          help="Aparece logo abaixo do seu nome."
          error={fieldErrors.headline}
        >
          <Input
            id="headline"
            name="headline"
            maxLength={80}
            defaultValue={defaultValues?.headline}
            placeholder="Engenheira de software sênior"
            aria-invalid={fieldErrors.headline ? true : undefined}
          />
        </Field>

        <div className="flex flex-wrap gap-5">
          <Field
            label="Empresa"
            htmlFor="company"
            help="Pode ser uma descrição, sem citar o nome."
            error={fieldErrors.company}
            className="flex-[1.4_1_240px]"
          >
            <Input
              id="company"
              name="company"
              maxLength={60}
              defaultValue={defaultValues?.company}
              placeholder="Fintech de grande porte"
              aria-invalid={fieldErrors.company ? true : undefined}
            />
          </Field>
          <Field
            label="Senioridade"
            htmlFor="seniority"
            error={fieldErrors.seniority}
            className="flex-[1_1_160px]"
          >
            <select
              id="seniority"
              name="seniority"
              defaultValue={defaultValues?.seniority ?? ""}
              aria-invalid={fieldErrors.seniority ? true : undefined}
              className={SELECT_CLASS}
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
          </Field>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${LABEL_CLASS} mb-2`}>Áreas em que você entrevista</legend>
          <div className="flex flex-wrap gap-2">
            {AREA_OPTIONS.map((option) => (
              <ChoicePill
                key={option.value}
                name="areas"
                value={option.value}
                defaultChecked={defaultValues?.areas.includes(option.value)}
              >
                {option.label}
              </ChoicePill>
            ))}
          </div>
          <FieldError message={fieldErrors.areas} />
        </fieldset>

        <Field
          label="Preço da sessão"
          htmlFor="price"
          help="Valor de uma sessão de 1 hora. Aceita centavos, como 100,50. Dá para mudar depois."
          error={fieldErrors.price}
          className="max-w-[320px]"
        >
          <div
            className={`bg-background has-focus-visible:outline-ring flex h-[50px] items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 font-mono has-focus-visible:outline-[3px] has-focus-visible:outline-offset-[3px] ${
              fieldErrors.price ? "border-destructive" : "border-input"
            }`}
          >
            <span className="font-bold">R$</span>
            <input
              id="price"
              name="price"
              inputMode="decimal"
              defaultValue={defaultValues?.price}
              placeholder="100"
              aria-invalid={fieldErrors.price ? true : undefined}
              className="placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent outline-none"
            />
            <span className="text-muted-foreground text-[13px]">/ 1h</span>
          </div>
        </Field>

        <Field
          label="Bio"
          htmlFor="bio"
          help="Conte sua experiência e como você conduz a entrevista."
          error={fieldErrors.bio}
          counter={`${bioLength}/500`}
        >
          <Textarea
            id="bio"
            name="bio"
            maxLength={500}
            rows={4}
            defaultValue={defaultValues?.bio}
            onChange={(event) => setBioLength(event.target.value.length)}
            aria-invalid={fieldErrors.bio ? true : undefined}
          />
        </Field>

        <div className="flex flex-wrap gap-5">
          <Field
            label="LinkedIn"
            htmlFor="linkedin"
            help="Opcional. Aparece como link no seu perfil."
            error={fieldErrors.linkedin}
            className="flex-[1_1_220px]"
          >
            <Input
              id="linkedin"
              name="linkedin"
              defaultValue={defaultValues?.linkedin}
              placeholder="linkedin.com/in/seu-perfil"
              aria-invalid={fieldErrors.linkedin ? true : undefined}
            />
          </Field>
          <Field
            label="GitHub"
            htmlFor="github"
            help="Opcional."
            error={fieldErrors.github}
            className="flex-[1_1_220px]"
          >
            <Input
              id="github"
              name="github"
              defaultValue={defaultValues?.github}
              placeholder="github.com/seu-usuario"
              aria-invalid={fieldErrors.github ? true : undefined}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1.5">
          <Link
            href={backHref}
            className="text-foreground inline-flex min-h-12 items-center gap-2 font-bold"
          >
            <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
            Voltar
          </Link>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </form>

      <aside
        aria-label="Prévia do seu perfil"
        className="pop flex w-full min-w-0 flex-[1_1_300px] flex-col gap-3 md:max-w-[380px]"
      >
        <span className="font-mono text-xs font-bold">prévia · seu card no marketplace</span>
        <div className="bg-secondary rounded-[18px] p-[18px]">
          <div className="edge bg-card flex flex-col gap-3 rounded-2xl p-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={400}
                height={280}
                unoptimized
                className="edge box-border block aspect-[10/7] w-full rounded-[10px] object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="edge bg-accent flex aspect-[10/7] w-full items-center justify-center rounded-[10px] font-mono text-4xl font-bold"
              >
                {initials(profileName || "?")}
              </div>
            )}
            <div>
              <p className="text-lg font-extrabold break-words">{profileName || "Seu nome"}</p>
              <p className="text-muted-foreground text-sm break-words">
                {previewRole || "Seu cargo e empresa"}
              </p>
            </div>
            {preview.areas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {preview.areas.map((area) => (
                  <span key={area} className="edge rounded-[7px] px-2 py-0.5 lowercase">
                    {areaLabels[area] ?? area}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
              <span className="text-sm font-bold">
                {preview.price.trim() ? `R$ ${preview.price.trim()}` : "R$ --"} · 1h
              </span>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-[13px]">
          Depois de publicar, você abre seus horários no painel.
        </p>
      </aside>
    </div>
  );
}
