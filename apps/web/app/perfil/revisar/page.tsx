import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { initials } from "@/lib/initials";
import { createClient } from "@/lib/supabase/server";
import { WizardShell } from "@/components/wizard-shell";
import { PreferenceToggles } from "./preference-toggles";

export const instant = false;

function SummaryCard({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-[20px] border-[1.5px] p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          {title}
        </h3>
        <Link
          href={editHref}
          aria-label={`Editar: ${title}`}
          className="text-brand-deep inline-flex min-h-11 items-center text-sm font-bold"
        >
          Editar
        </Link>
      </div>
      {children}
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
    <WizardShell
      activeStep={4}
      heroLines={["Tudo pronto", "para o seu", "próximo passo."]}
      dicaLabel="No seu tempo."
      dicaText="Você pode ajustar essas informações depois, nas configurações do perfil."
      stepLabel="Configuração do perfil · Etapa 4 de 4"
      title="Revisar perfil"
      description="Confira suas escolhas. Seu perfil ajuda a preparar uma sessão mais relevante."
    >
      <div className="flex flex-col gap-[22px]">
        <SummaryCard title="Você na Lugh" editHref="/perfil">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={64}
                height={64}
                className="size-16 shrink-0 rounded-[20px] object-cover"
                unoptimized
              />
            ) : (
              <div className="bg-accent text-ink font-heading flex size-16 shrink-0 items-center justify-center rounded-[20px] text-xl font-extrabold">
                {initials(profile.name)}
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="font-heading text-xl font-extrabold">{profile.name}</p>
              <p className="text-foreground/70 text-sm">
                {profile.preferred_name
                  ? `Pode me chamar de ${profile.preferred_name}`
                  : "Sem apelido cadastrado"}
              </p>
              <p className="text-foreground/70 text-sm break-words">{profile.email}</p>
            </div>
          </div>
          <p className="text-foreground/80 max-w-[68ch] text-sm break-words whitespace-pre-line">
            {profile.bio ? profile.bio : "Sem apresentação ainda."}
          </p>
        </SummaryCard>

        {/* Objetivo e experiência ainda não são salvos (etapas 2 e 3 são só
            visuais): o resumo diz isso, em vez de mostrar dado de exemplo como
            se fosse da pessoa. */}
        <SummaryCard title="Seu objetivo" editHref="/perfil/objetivo">
          <p className="text-muted-foreground text-sm">Ainda não é salvo no perfil.</p>
        </SummaryCard>

        <SummaryCard title="Seu ponto de partida" editHref="/perfil/experiencia">
          <p className="text-muted-foreground text-sm">Ainda não é salvo no perfil.</p>
        </SummaryCard>

        <div className="border-border bg-card flex flex-col gap-4 rounded-[20px] border-[1.5px] p-6">
          <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
            Você escolhe o que recebe
          </h3>
          <PreferenceToggles />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/perfil/experiencia"
              className="text-brand-deep flex min-h-[52px] items-center text-sm font-bold"
            >
              ← Voltar
            </Link>
            <Link
              href="/entrevistadores"
              className={buttonVariants({ className: "h-auto min-h-[52px] px-5 py-2 whitespace-normal" })}
            >
              Concluir e encontrar profissionais
            </Link>
          </div>
          <p className="text-foreground/70 text-xs">
            Ao concluir, você poderá agendar seu primeiro treino.
          </p>
        </div>
      </div>
    </WizardShell>
  );
}
