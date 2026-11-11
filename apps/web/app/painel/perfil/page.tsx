import { redirect } from "next/navigation";
import {
  InterviewerForm,
  type InterviewerFormDefaults,
} from "@/app/onboarding/entrevistador/interviewer-form";
import { SiteHeader } from "@/components/site-header";
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
    linkedin: interviewer.linkedin_url ?? "",
    github: interviewer.github_url ?? "",
  };

  // Nome e foto só alimentam a prévia do card.
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto box-border w-full max-w-[1120px] px-[clamp(20px,5vw,48px)] pt-[clamp(28px,5vw,56px)] pb-[72px]">
        <InterviewerForm
          defaultValues={defaultValues}
          submitLabel="Salvar alterações"
          title="Edite seu perfil"
          backHref="/painel"
          profileName={profile?.name ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </main>
    </div>
  );
}
