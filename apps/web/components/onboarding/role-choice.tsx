import { ArrowRight, Mic, Target } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/motion/fade-in";
import { HoverLift } from "@/components/motion/hover-lift";

// Escolha de papel do onboarding, no desenho original. Vem antes do wizard e
// fica fora dele: é uma tela própria, centrada, sem lateral nem lista de
// etapas. Fica num componente próprio para a página real (com sessão) e a
// prévia local renderizarem a mesma tela.
export function OnboardingRoleChoice() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-16">
      <FadeIn className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2.5">
          <span className="bg-brand-deep h-2 w-8 rounded-full" />
          <span className="text-brand-deep text-sm font-extrabold tracking-[0.08em] uppercase">
            Bem-vindo ao Lugh
          </span>
        </div>
        <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-[-0.03em]">
          O que você veio fazer?
        </h1>
        <p className="text-foreground/70 text-lg">
          Dá para mudar isso depois, se precisar.
        </p>
      </FadeIn>

      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <FadeIn index={0}>
          <HoverLift className="h-full">
            <Link
              href="/onboarding/candidato"
              className="bg-brand-deep flex h-full flex-col gap-4 rounded-[20px] p-8 text-white"
            >
              <Target aria-hidden="true" size={28} />
              <span className="font-heading text-2xl font-bold">
                Quero treinar
              </span>
              <span className="text-white/80">
                Praticar entrevistas com quem já está lá dentro.
              </span>
              <span className="mt-auto flex items-center gap-1.5 text-sm font-bold">
                Continuar
                <ArrowRight aria-hidden="true" size={16} />
              </span>
            </Link>
          </HoverLift>
        </FadeIn>

        <FadeIn index={1}>
          <HoverLift className="h-full">
            <Link
              href="/onboarding/entrevistador"
              className="border-brand-deep bg-card hover:bg-accent flex h-full flex-col gap-4 rounded-[20px] border-2 p-8 transition-colors"
            >
              <Mic aria-hidden="true" size={28} className="text-brand-deep" />
              <span className="font-heading text-2xl font-bold">
                Quero entrevistar
              </span>
              <span className="text-foreground/70">
                Conduzir entrevistas simuladas e ajudar quem está começando.
              </span>
              <span className="text-brand-deep mt-auto flex items-center gap-1.5 text-sm font-bold">
                Continuar
                <ArrowRight aria-hidden="true" size={16} />
              </span>
            </Link>
          </HoverLift>
        </FadeIn>
      </div>
    </main>
  );
}
