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
    <ProfileWizardShell activeStep={3} title="Experiência">
      <ExperienciaForm />
    </ProfileWizardShell>
  );
}
