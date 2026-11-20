import { redirect } from "next/navigation";
import { onboardingSteps } from "@/components/onboarding/steps";
import { StepHeader } from "@/components/step-header";
import { WizardShell } from "@/components/wizard-shell";
import { createClient } from "@/lib/supabase/server";
import { InterviewerForm } from "./interviewer-form";

export const instant = false;

export default async function OnboardingEntrevistadorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Nome e foto só alimentam a prévia do card.
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <WizardShell
      header={<StepHeader label="passo 2 de 2" />}
      activeStep={2}
      steps={onboardingSteps("/onboarding/entrevistador")}
      eyebrow="Bem-vindo ao Lugh."
      heroLines={["Seu card", "decide em", "segundos."]}
      dicaLabel="Dica"
      dicaText="Cargo, empresa e preço aparecem no card. A bio é o que convence a agendar."
    >
      <InterviewerForm
        title="Monte seu perfil de entrevistador"
        backHref="/onboarding"
        profileName={profile?.name ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />
    </WizardShell>
  );
}
