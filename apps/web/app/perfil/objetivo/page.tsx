import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileWizardShell } from "../profile-wizard-shell";
import { ObjetivoForm } from "./objetivo-form";

export const instant = false;

export default async function PerfilObjetivoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile?.role) {
    redirect("/onboarding");
  }

  if (profile.role === "interviewer") {
    redirect("/painel/perfil");
  }

  return (
    <ProfileWizardShell
      activeStep={2}
      heroLines={["Diga", "pra onde você", "quer chegar."]}
      dicaLabel="No seu tempo."
      dicaText="Essas escolhas ajudam a encontrar profissionais alinhados ao seu momento."
      stepLabel="Configuração do perfil · Etapa 2 de 4"
      title="Objetivo profissional"
      description="Conte o que você busca para encontrar o treino que faz sentido para você."
    >
      <ObjetivoForm />
    </ProfileWizardShell>
  );
}
