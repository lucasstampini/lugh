import { redirect } from "next/navigation";
import { onboardingSteps } from "@/components/onboarding/steps";
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
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <WizardShell
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
      />
    </WizardShell>
  );
}
