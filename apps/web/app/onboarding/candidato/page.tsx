import { redirect } from "next/navigation";
import { StepHeader } from "@/components/step-header";
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
    <div className="flex min-h-screen flex-col">
      <StepHeader label="passo 2 de 2 · candidato" />
      <main className="mx-auto box-border w-full max-w-[1040px] px-[clamp(20px,5vw,48px)] pt-[clamp(28px,5vw,56px)] pb-[72px]">
        <ConfirmNameForm
          initialName={profile?.name ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
      </main>
    </div>
  );
}
