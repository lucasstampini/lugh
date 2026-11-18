import { redirect } from "next/navigation";
import { OnboardingRoleChoice } from "@/components/onboarding/role-choice";
import { createClient } from "@/lib/supabase/server";

// Página inteira depende de sessão e perfil antes de decidir o que renderizar
// (formulário ou redirect), não dá pra ter um shell estático útil aqui.
export const instant = false;

export default async function OnboardingPage() {
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

  if (profile?.role === "candidate") {
    redirect("/entrevistadores");
  }

  if (profile?.role === "interviewer") {
    redirect("/painel");
  }

  return <OnboardingRoleChoice />;
}
