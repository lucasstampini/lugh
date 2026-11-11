import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eyebrow } from "@/components/eyebrow";
import { StepHeader } from "@/components/step-header";
import { createClient } from "@/lib/supabase/server";

const ROLES = [
  {
    href: "/onboarding/candidato",
    image: "/illustrations/candidato.svg",
    alt: "Ilustração de uma pessoa candidata com fone de ouvido",
    badge: "papel: candidato",
    title: "Quero treinar",
    description:
      "Faça entrevistas simuladas com profissionais da área e receba feedback com nota por competência.",
    action: "Criar perfil de candidato",
  },
  {
    href: "/onboarding/entrevistador",
    image: "/illustrations/camila.svg",
    alt: "Ilustração de uma entrevistadora",
    badge: "papel: entrevistador",
    title: "Quero entrevistar",
    description:
      "Entreviste candidatos nos horários que você abrir. Você define o preço da sua sessão.",
    action: "Criar perfil de entrevistador",
  },
];

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

  return (
    <div className="flex min-h-screen flex-col">
      <StepHeader label="passo 1 de 2" />

      <main className="mx-auto box-border flex w-full max-w-[1040px] flex-1 flex-col gap-9 px-[clamp(20px,5vw,48px)] pt-[clamp(32px,6vw,72px)] pb-[72px]">
        <div className="flex max-w-[640px] flex-col gap-2.5">
          <Eyebrow>sua conta foi criada</Eyebrow>
          <h1 className="font-heading text-[clamp(32px,3.8vw,50px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
            Como você vai usar o Lugh?
          </h1>
          <p className="text-muted-foreground text-[17px]">
            Escolha uma opção para montarmos seu perfil.
          </p>
        </div>

        <div className="flex flex-wrap gap-5">
          {ROLES.map((role, index) => (
            <Link
              key={role.href}
              href={role.href}
              className="pop edge bg-card text-foreground hover:bg-accent box-border flex min-w-0 flex-[1_1_320px] flex-col gap-[18px] rounded-[20px] p-[18px] transition-[translate,background-color] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-1.5 active:scale-[.98]"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="edge overflow-hidden rounded-xl">
                <Image
                  src={role.image}
                  alt={role.alt}
                  width={400}
                  height={360}
                  className="block aspect-video w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 px-1.5">
                <span className="bg-foreground text-background self-start rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                  {role.badge}
                </span>
                <h2 className="font-heading text-[30px] leading-[1.1] font-extrabold">{role.title}</h2>
                <p className="text-muted-foreground">{role.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 px-1.5 pb-1.5 font-extrabold">
                <span>{role.action}</span>
                <span
                  aria-hidden="true"
                  className="edge bg-primary text-ink flex size-11 shrink-0 items-center justify-center rounded-full"
                >
                  <ArrowRight size={18} strokeWidth={2.2} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
