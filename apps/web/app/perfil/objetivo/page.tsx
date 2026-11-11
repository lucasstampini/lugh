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
    <ProfileWizardShell activeStep={2} title="Objetivo">
      <ObjetivoForm />
    </ProfileWizardShell>
  );
}
