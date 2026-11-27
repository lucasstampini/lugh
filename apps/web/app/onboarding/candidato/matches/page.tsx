import { ArrowRight, CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CodeBlock, CodeMuted } from "@/components/code-block";
import { Eyebrow } from "@/components/eyebrow";
import { FormAlert } from "@/components/form-field";
import { FadeIn } from "@/components/motion/fade-in";
import { candidateOnboardingSteps } from "@/components/onboarding/steps";
import { Stars } from "@/components/stars";
import { StepHeader } from "@/components/step-header";
import { buttonVariants } from "@/components/ui/button";
import { WizardShell } from "@/components/wizard-shell";
import { preferencesFromProfile } from "@/lib/candidate-preferences";
import { formatPrice } from "@/lib/format-price";
import { formatSessionDate } from "@/lib/format-session-date";
import { initials } from "@/lib/initials";
import { listInterviewers } from "@/lib/interviewers";
import { type Match, rankInterviewers } from "@/lib/match";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

function MatchRow({ match, bookingQuery }: { match: Match; bookingQuery: string }) {
  const { interviewer, profile, rating, nextSlotAt, reasons } = match;
  const name = profile?.name ?? "Entrevistador";
  const nextSlot = nextSlotAt ? formatSessionDate(nextSlotAt) : null;

  return (
    <article className="edge bg-card flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[20px] p-5">
      <div className="flex min-w-0 flex-[999_1_300px] items-start gap-4">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div
            aria-hidden="true"
            className="bg-brand-deep font-heading flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
          >
            {initials(name)}
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="font-heading text-xl font-bold">{name}</h2>
          <p className="text-muted-foreground text-sm">
            {interviewer.headline} · {interviewer.company}
          </p>
          {rating?.average != null && rating.reviewCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <Stars value={rating.average} size={13} />
              <span className="text-xs font-bold tabular-nums">
                {rating.average.toFixed(1).replace(".", ",")}
              </span>
              <span className="text-muted-foreground text-xs">({rating.reviewCount})</span>
            </span>
          ) : (
            <span className="text-muted-foreground font-mono text-[11px]">sem avaliações ainda</span>
          )}

          {reasons.length > 0 ? (
            <ul aria-label="Por que combina com você" className="flex flex-wrap gap-1.5 pt-1">
              {reasons.map((reason) => (
                <li key={reason} className="edge rounded-[9px] px-2 py-0.5 font-mono text-xs font-bold">
                  {reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="flex flex-[1_1_220px] flex-col gap-3">
        <p className="flex items-center gap-1.5 font-mono text-xs">
          <CalendarDays aria-hidden="true" size={13} className="shrink-0" />
          {nextSlot ? `${nextSlot.day} · ${nextSlot.time}` : "sem horário livre nos próximos 14 dias"}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-heading text-lg font-extrabold tabular-nums">
            {formatPrice(interviewer.price_cents)}
          </span>
          <Link
            href={
              nextSlot
                ? `/agendar/${interviewer.profile_id}${bookingQuery}`
                : `/entrevistadores/${interviewer.profile_id}`
            }
            className={buttonVariants({ className: "px-5" })}
          >
            {nextSlot ? "Ver horários" : "Ver perfil"}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        {nextSlot ? (
          <Link
            href={`/entrevistadores/${interviewer.profile_id}`}
            className="text-brand-deep self-start text-sm font-bold underline underline-offset-2"
          >
            Ver perfil completo
          </Link>
        ) : null}
      </div>
    </article>
  );
}

// Fim do onboarding do candidato: os entrevistadores que mais combinam com o que ele
// respondeu, com o motivo de cada um. Poucos de propósito; a lista inteira fica a um link.
export default async function OnboardingMatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, areas, interview_types, training_urgency, career_stage")
    .eq("id", user.id)
    .single();

  if (profile?.role === "interviewer") {
    redirect("/painel");
  }
  if (profile?.role !== "candidate") {
    redirect("/onboarding");
  }

  const preferences = preferencesFromProfile(profile);
  const now = new Date();
  const { items, error } = await listInterviewers(supabase, { now });
  const matches = rankInterviewers(preferences, items, now);

  // O agendamento já abre no tipo de entrevista que a pessoa disse que quer treinar.
  const bookingQuery = preferences.interviewTypes[0] ? `?tipo=${preferences.interviewTypes[0]}` : "";
  const answeredSomething =
    preferences.areas.length > 0 ||
    preferences.interviewTypes.length > 0 ||
    preferences.urgency !== null ||
    preferences.careerStage !== null;

  return (
    <WizardShell
      header={<StepHeader label="passo 3 de 3" />}
      activeStep={3}
      steps={candidateOnboardingSteps(true)}
      eyebrow="Bem-vindo ao Lugh."
      heroLines={["Quem treina", "com você."]}
      dicaLabel="Dica"
      dicaText="Você paga só pela sessão que marcar. O perfil completo fica para depois, em Seu perfil."
    >
      <div className="flex max-w-[860px] flex-col gap-7">
        <div className="flex flex-col gap-2">
          <Eyebrow>seus matches</Eyebrow>
          <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
            {answeredSomething ? "Combinam com o que você respondeu" : "Por onde começar"}
          </h1>
          <p className="text-muted-foreground">
            {answeredSomething
              ? "Escolhidos pela sua área, pelo tipo de entrevista e por quem tem horário livre."
              : "Você pulou as perguntas, então estes são os mais bem avaliados com horário livre."}
          </p>
        </div>

        {error ? (
          <div className="flex flex-col items-start gap-4">
            <FormAlert title="Não deu para carregar os entrevistadores.">
              Tente de novo em alguns segundos.
            </FormAlert>
            <Link href="/onboarding/candidato/matches" className={buttonVariants({ variant: "outline" })}>
              Tentar de novo
            </Link>
          </div>
        ) : matches.length === 0 ? (
          <CodeBlock>
            <CodeMuted>$ lugh match</CodeMuted>
            {"\n"}nenhum entrevistador disponível agora. os primeiros perfis estão chegando.
          </CodeBlock>
        ) : (
          <ol className="flex flex-col gap-4">
            {matches.map((match, index) => (
              <li key={match.interviewer.profile_id}>
                <FadeIn index={index} large>
                  <MatchRow match={match} bookingQuery={bookingQuery} />
                </FadeIn>
              </li>
            ))}
          </ol>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/entrevistadores" className={buttonVariants({ variant: "outline" })}>
            Ver todos os entrevistadores
          </Link>
          <Link
            href="/onboarding/candidato"
            className="text-brand-deep text-sm font-bold underline underline-offset-2"
          >
            Refazer as perguntas
          </Link>
        </div>
      </div>
    </WizardShell>
  );
}
