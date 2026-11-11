import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ProfileWizardShell } from "../profile-wizard-shell";
import { WizardFooter } from "../wizard-parts";
import { PreferenceToggles } from "./preference-toggles";

export const instant = false;

function ReviewRow({
  label,
  editHref,
  first,
  children,
}: {
  label: string;
  editHref: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-x-5 gap-y-1.5 ${
        first ? "pb-3.5" : "border-border-dashed border-t-[1.5px] border-dashed py-3.5"
      }`}
    >
      <dt className="text-muted-foreground flex-[0_0_130px] font-mono text-xs">{label}</dt>
      <dd className="min-w-0 flex-[1_1_220px] font-semibold break-words">{children}</dd>
      <Link
        href={editHref}
        aria-label={`Editar ${label}`}
        className="text-brand-deep inline-flex min-h-11 items-center font-bold underline"
      >
        Editar
      </Link>
    </div>
  );
}

export default async function PerfilRevisarPage() {
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
    <ProfileWizardShell activeStep={4} title="Revisar">
      <dl>
        <ReviewRow label="nome" editHref="/perfil" first>
          {profile.name}
          {profile.preferred_name ? (
            <span className="text-muted-foreground font-normal">
              {" "}
              · pode me chamar de {profile.preferred_name}
            </span>
          ) : null}
        </ReviewRow>
        <ReviewRow label="e-mail" editHref="/perfil">
          {profile.email}
        </ReviewRow>
        <ReviewRow label="sobre você" editHref="/perfil">
          {profile.bio ? (
            profile.bio
          ) : (
            <span className="text-muted-foreground font-normal">Sem apresentação ainda.</span>
          )}
        </ReviewRow>
        {/* Objetivo e experiência ainda não são salvos (etapas 2 e 3 são só
            visuais), então não há o que resumir aqui. */}
        <ReviewRow label="objetivo" editHref="/perfil/objetivo">
          <span className="text-muted-foreground font-normal">Ainda não é salvo no perfil.</span>
        </ReviewRow>
        <ReviewRow label="experiência" editHref="/perfil/experiencia">
          <span className="text-muted-foreground font-normal">Ainda não é salva no perfil.</span>
        </ReviewRow>
      </dl>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">Preferências</legend>
        <PreferenceToggles />
      </fieldset>

      <WizardFooter backHref="/perfil/experiencia">
        <Link href="/entrevistadores" className={buttonVariants({ size: "lg" })}>
          Concluir perfil
        </Link>
      </WizardFooter>
    </ProfileWizardShell>
  );
}
