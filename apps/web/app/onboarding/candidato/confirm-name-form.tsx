"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { confirmCandidate } from "@/app/onboarding/actions";
import { Eyebrow } from "@/components/eyebrow";
import { ChoicePill, DashedLabel, Field, FormAlert, LABEL_CLASS } from "@/components/form-field";
import { TermsConsent } from "@/components/terms-consent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/initials";
import { AREA_OPTIONS } from "@/lib/interviewer-options";
import { GitHubIcon, LinkedInIcon } from "@/components/brand-icons";
import { AvatarUpload } from "./avatar-upload";

const areaLabels: Record<string, string> = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);

type Preview = {
  name: string;
  preferredName: string;
  experienceYears: string;
  targetRole: string;
  areas: string[];
  bio: string;
  linkedin: string;
  github: string;
};

export function ConfirmNameForm({
  initialName,
  initialAvatarUrl,
  needsTermsAcceptance,
}: {
  initialName: string;
  initialAvatarUrl: string | null;
  // Falso para quem já aceitou os Termos (ex.: voltou ao onboarding).
  needsTermsAcceptance: boolean;
}) {
  const [state, formAction, pending] = useActionState(confirmCandidate, null);
  const [bioLength, setBioLength] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  // Só alimenta a prévia ao lado: os campos continuam não controlados e quem
  // valida e salva é a action.
  const [preview, setPreview] = useState<Preview>({
    name: initialName,
    preferredName: "",
    experienceYears: "",
    targetRole: "",
    areas: [],
    bio: "",
    linkedin: "",
    github: "",
  });

  function handleChange(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    setPreview({
      name: String(data.get("name") ?? ""),
      preferredName: String(data.get("preferredName") ?? ""),
      experienceYears: String(data.get("experienceYears") ?? ""),
      targetRole: String(data.get("targetRole") ?? ""),
      areas: data.getAll("areas").map(String),
      bio: String(data.get("bio") ?? ""),
      linkedin: String(data.get("linkedin") ?? ""),
      github: String(data.get("github") ?? ""),
    });
  }

  // O entrevistador chama a pessoa pelo nome de preferência quando ele existe.
  const fullName = preview.name.trim();
  const previewName = preview.preferredName.trim() || fullName || "Seu nome";
  const showFullName = Boolean(
    preview.preferredName.trim() && fullName && fullName !== preview.preferredName.trim(),
  );
  const previewAreas = preview.areas.map((area) => areaLabels[area] ?? area);
  const previewBio = preview.bio.trim();
  const previewLinkedin = preview.linkedin.trim();
  const previewGithub = preview.github.trim();
  // O campo é numérico e opcional: 0 ou vazio não viram linha na prévia.
  const years = Number.parseInt(preview.experienceYears, 10);
  const previewYears =
    Number.isFinite(years) && years > 0
      ? `${years} ${years === 1 ? "ano" : "anos"} de experiência`
      : null;

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

        {needsTermsAcceptance ? <TermsConsent /> : null}

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
                {initials(fullName || previewName)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-lg font-extrabold break-words">{previewName}</p>
              {showFullName ? (
                <p className="text-muted-foreground text-xs break-words">{fullName}</p>
              ) : null}
              {preview.targetRole ? (
                <p className="text-muted-foreground text-sm break-words">{preview.targetRole}</p>
              ) : null}
              {previewYears ? (
                <p className="text-muted-foreground font-mono text-xs">{previewYears}</p>
              ) : null}
            </div>
          </div>

          {previewAreas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {previewAreas.map((area) => (
                <span
                  key={area}
                  className="edge bg-card rounded-md px-[7px] py-px font-mono text-xs lowercase"
                >
                  {area}
                </span>
              ))}
            </div>
          ) : null}

          {previewBio ? (
            <p className="text-sm break-words whitespace-pre-line">{previewBio}</p>
          ) : null}

          {previewLinkedin || previewGithub ? (
            <div className="flex flex-wrap gap-2">
              {previewLinkedin ? (
                <span className="edge bg-card flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold">
                  <LinkedInIcon size={13} />
                  LinkedIn
                </span>
              ) : null}
              {previewGithub ? (
                <span className="edge bg-card flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold">
                  <GitHubIcon size={13} />
                  GitHub
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Nada preenchido além do nome: a prévia diz o que falta em vez de
              ficar um cartão vazio. */}
          {!preview.targetRole &&
          !previewYears &&
          previewAreas.length === 0 &&
          !previewBio &&
          !previewLinkedin &&
          !previewGithub ? (
            <p className="text-muted-foreground font-mono text-xs">
              preencha os campos ao lado para montar sua prévia
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
