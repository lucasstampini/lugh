import { redirect } from "next/navigation";
import { StepHeader } from "@/components/step-header";
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
    <div className="flex min-h-screen flex-col">
      <StepHeader label="passo 2 de 2 · entrevistador" />
      <main className="mx-auto box-border w-full max-w-[1120px] px-[clamp(20px,5vw,48px)] pt-[clamp(28px,5vw,56px)] pb-[72px]">
        <InterviewerForm
          title="Monte seu perfil de entrevistador"
          backHref="/onboarding"
          profileName={profile?.name ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </main>
    </div>
  );
}
