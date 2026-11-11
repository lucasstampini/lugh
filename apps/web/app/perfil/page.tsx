import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileStep1Form } from "./profile-step1-form";
import { ProfileWizardShell } from "./profile-wizard-shell";

export const instant = false;

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url, role, preferred_name, bio, email")
    .eq("id", user.id)
    .single();

  if (!profile?.role) {
    redirect("/onboarding");
  }

  if (profile.role === "interviewer") {
    redirect("/painel/perfil");
  }

  return (
    <ProfileWizardShell activeStep={1} title="Dados pessoais">
      <ProfileStep1Form
        avatarUrl={profile.avatar_url}
        avatarName={profile.name}
        defaultValues={{
          name: profile.name,
          preferredName: profile.preferred_name ?? "",
          email: profile.email,
          bio: profile.bio ?? "",
        }}
      />
    </ProfileWizardShell>
  );
}
