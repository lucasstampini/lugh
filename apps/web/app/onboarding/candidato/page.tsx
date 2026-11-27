import { redirect } from "next/navigation";
import { candidateOnboardingSteps } from "@/components/onboarding/steps";
import { StepHeader } from "@/components/step-header";
import { WizardShell } from "@/components/wizard-shell";
import { createClient } from "@/lib/supabase/server";
import { CandidateQuiz } from "./candidate-quiz";

export const instant = false;

export default async function OnboardingCandidatoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, terms_accepted_at")
    .eq("id", user.id)
    .single();

  return (
    <WizardShell
      header={<StepHeader label="passo 2 de 3" />}
      activeStep={2}
      steps={candidateOnboardingSteps()}
      eyebrow="Bem-vindo ao Lugh."
      heroLines={["Seu treino", "começa", "aqui."]}
      dicaLabel="Dica"
      dicaText="São cinco perguntas rápidas e dá para pular qualquer uma. No fim você vê quem combina com o que respondeu."
    >
      <CandidateQuiz
        initialName={profile?.name ?? ""}
        needsTermsAcceptance={!profile?.terms_accepted_at}
      />
    </WizardShell>
  );
}
