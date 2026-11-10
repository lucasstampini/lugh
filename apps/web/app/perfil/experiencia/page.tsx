import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileWizardShell } from "../profile-wizard-shell";
import { ExperienciaForm } from "./experiencia-form";

export const instant = false;

export default async function PerfilExperienciaPage() {
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
      activeStep={3}
      heroLines={["Seu ponto", "de partida", "já conta."]}
      dicaLabel="Começar também é experiência."
      dicaText="Projeto de faculdade e experiência pessoal também valem. Ninguém começa pronto."
      stepLabel="Configuração do perfil · Etapa 3 de 4"
      title="Experiência e prática"
      description="Você não precisa ter trabalhado na área para começar a praticar."
    >
      <ExperienciaForm />
    </ProfileWizardShell>
  );
}
