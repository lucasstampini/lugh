import { redirect } from "next/navigation";
import {
  InterviewerForm,
  type InterviewerFormDefaults,
} from "@/app/onboarding/entrevistador/interviewer-form";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function PerfilEntrevistadorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: interviewer } = await supabase
    .from("interviewers")
    .select(
      "headline, company, seniority, areas, price_cents, bio, linkedin_url, github_url",
    )
    .eq("profile_id", user.id)
    .single();

  if (!interviewer) {
    redirect("/onboarding/entrevistador");
  }

  const defaultValues: InterviewerFormDefaults = {
    headline: interviewer.headline,
    company: interviewer.company,
    seniority: interviewer.seniority,
    areas: interviewer.areas,
    price: (interviewer.price_cents / 100).toFixed(2).replace(".", ","),
    bio: interviewer.bio ?? "",
    linkedin: interviewer.linkedin_url,
    github: interviewer.github_url ?? "",
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-heading text-2xl font-extrabold tracking-[-0.02em]">
            Seu perfil
          </h1>
          <p className="text-foreground/70 text-sm">
            Atualize suas informações. Mudanças não tiram seu perfil do ar.
          </p>
        </div>
        <InterviewerForm
          defaultValues={defaultValues}
          submitLabel="Salvar alterações"
        />
      </div>
    </main>
  );
}
