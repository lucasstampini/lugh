import { redirect } from "next/navigation";
import { onboardingSteps } from "@/components/onboarding/steps";
import { StepHeader } from "@/components/step-header";
import { WizardShell } from "@/components/wizard-shell";
import { createClient } from "@/lib/supabase/server";
import { ConfirmNameForm } from "./confirm-name-form";

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
    .select("name, avatar_url, terms_accepted_at")
    .eq("id", user.id)
    .single();

  return (
    <WizardShell
      header={<StepHeader label="passo 2 de 2" />}
      activeStep={2}
      steps={onboardingSteps("/onboarding/candidato")}
      eyebrow="Bem-vindo ao Lugh."
      heroLines={["Seu treino", "começa", "aqui."]}
      dicaLabel="Dica"
      dicaText="Só o nome é obrigatório. O resto você completa depois, em Seu perfil."
    >
      <ConfirmNameForm
        initialName={profile?.name ?? ""}
        initialAvatarUrl={profile?.avatar_url ?? null}
        needsTermsAcceptance={!profile?.terms_accepted_at}
      />
    </WizardShell>
  );
}
