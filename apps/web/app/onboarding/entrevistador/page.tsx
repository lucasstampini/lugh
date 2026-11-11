import { redirect } from "next/navigation";
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-heading text-2xl font-extrabold tracking-[-0.02em]">
            Seu perfil de entrevistador
          </h1>
          <p className="text-foreground/70 text-sm">
            Ao publicar, seu perfil já aparece no marketplace. Dá para pausar
            quando quiser no painel.
          </p>
        </div>
        <InterviewerForm />
      </div>
    </main>
  );
}
