import { redirect } from "next/navigation";
import { FadeIn } from "@/components/motion/fade-in";
import { createClient } from "@/lib/supabase/server";
import { AvatarUpload } from "./avatar-upload";
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

  const name = profile?.name ?? "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <FadeIn className="flex w-full max-w-sm flex-col items-center gap-6">
        <p className="bg-lume text-lume-foreground rounded-full px-3 py-1 text-xs font-bold tracking-[0.08em] uppercase">
          Passo 2 de 2
        </p>

        <AvatarUpload initialUrl={profile?.avatar_url ?? null} name={name} />

        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold tracking-[-0.03em]">
            Complete seu perfil.
          </h1>
          <p className="text-foreground/70">
            É assim que os entrevistadores vão te conhecer.
          </p>
        </div>

        <ConfirmNameForm initialName={name} />
      </FadeIn>
    </main>
  );
}
