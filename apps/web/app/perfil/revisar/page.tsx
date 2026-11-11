import Link from "next/link";
import { redirect } from "next/navigation";
import { initials } from "@/lib/initials";
import { createClient } from "@/lib/supabase/server";
import { ProfileWizardShell } from "../profile-wizard-shell";
import { PreferenceToggles } from "./preference-toggles";

export const instant = false;

function SummaryCard({
  title,
  editHref,
  badge,
  children,
}: {
  title: string;
  editHref: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-[20px] border p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {badge ? (
            <span className="bg-lume text-lume-foreground rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap">
              {badge}
            </span>
          ) : null}
          <Link href={editHref} className="text-primary text-sm font-bold">
            Editar
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <span className="text-muted-foreground text-[11px] font-bold tracking-[0.08em] uppercase">
        {label}
      </span>
      <span className="text-sm font-bold">{value}</span>
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
    <ProfileWizardShell
      activeStep={4}
      heroLines={["Tudo pronto", "para o seu", "próximo passo."]}
      dicaLabel="No seu tempo."
      dicaText="Você pode ajustar essas informações depois, nas configurações do perfil."
      stepLabel="Configuração do perfil · Etapa 4 de 4"
      title="Revisar perfil"
      description="Confira suas escolhas. Seu perfil ajuda a preparar uma sessão mais relevante."
    >
      <div className="flex flex-col gap-[22px]">
        <SummaryCard title="Você na Lugh" editHref="/perfil" badge="Perfil completo">
          <div className="flex items-center gap-4">
            <div className="bg-secondary text-primary font-heading flex size-16 shrink-0 items-center justify-center rounded-[20px] text-xl font-extrabold">
              {initials(profile.name)}
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="font-heading text-xl font-extrabold">{profile.name}</p>
              <p className="text-foreground/70 text-sm">
                {profile.preferred_name
                  ? `Pode me chamar de ${profile.preferred_name}`
                  : "Sem apelido cadastrado"}
              </p>
              <p className="text-foreground/70 text-sm">{profile.email}</p>
            </div>
          </div>
        </SummaryCard>

        {/* Objetivo e trajetória: dado de exemplo do Figma, não existe
            coluna no banco pra isso ainda (ver etapas 2 e 3). */}
        <SummaryCard title="Seu objetivo" editHref="/perfil/objetivo">
          <div className="flex flex-wrap gap-6">
            <SummaryField label="Oportunidades" value="Estágio e júnior" />
            <SummaryField label="Função" value="Desenvolvedora back-end" />
          </div>
          <div className="flex flex-wrap gap-6">
            <SummaryField label="Tipos de empresa" value="Fintech de grande porte · Big tech" />
            <SummaryField label="Formatos de treino" value="Técnica · Comportamental" />
          </div>
        </SummaryCard>

        <SummaryCard title="Seu ponto de partida" editHref="/perfil/experiencia">
          <p className="text-sm font-bold">Sistemas de Informação · Faculdade Horizonte</p>
          <p className="text-foreground/70 text-xs">
            Cursando o 6º semestre · Conclusão em dezembro de 2027
          </p>
          <div className="flex flex-wrap gap-6">
            <SummaryField label="Experiência na área" value="Ainda não trabalhei na área" />
            <SummaryField label="Em prática" value="JavaScript · Node.js · SQL" />
          </div>
          <p className="text-foreground/70 text-xs">
            Projeto: API de organização de estudos
          </p>
        </SummaryCard>

        <div className="border-border bg-card flex flex-col gap-4 rounded-[20px] border p-6">
          <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
            Você escolhe o que recebe
          </h3>
          <PreferenceToggles />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link
              href="/perfil/experiencia"
              className="text-primary flex h-[52px] items-center text-sm font-bold"
            >
              ← Voltar
            </Link>
            <Link
              href="/entrevistadores"
              className="bg-primary text-primary-foreground flex h-[52px] items-center gap-2 rounded-xl px-5 text-sm font-extrabold"
            >
              Concluir e encontrar profissionais
            </Link>
          </div>
          <p className="text-foreground/70 text-xs">
            Ao concluir, você poderá agendar seu primeiro treino.
          </p>
        </div>
      </div>
    </ProfileWizardShell>
  );
}
