import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ProfileWizardSteps } from "./profile-wizard-steps";

// Casca compartilhada das 4 etapas (Figma nodes 47:2, 47:61, 47:120, 47:179):
// cabeçalho, sidebar Índigo com título e dica da etapa, área do formulário e
// rodapé. Só o conteúdo de cada etapa muda.
export function ProfileWizardShell({
  activeStep,
  heroLines,
  dicaLabel,
  dicaText,
  stepLabel,
  title,
  description,
  children,
}: {
  activeStep: number;
  heroLines: string[];
  dicaLabel: string;
  dicaText: string;
  stepLabel: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[400px_1fr]">
        <aside className="bg-primary flex flex-col justify-between gap-11 px-6 py-8 lg:px-10 lg:py-12">
          <div className="flex flex-col gap-11">
            <div className="flex flex-col gap-6">
              <span className="text-primary-foreground text-[10px] font-extrabold tracking-[0.13em] uppercase">
                Seu perfil. Seu próximo passo.
              </span>
              <h1 className="font-heading text-primary-foreground text-[58px] leading-[0.97] font-extrabold tracking-[-0.04em]">
                {heroLines.map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < heroLines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </h1>
            </div>

            <ProfileWizardSteps activeStep={activeStep} />
          </div>

          <div className="bg-primary text-foreground flex flex-col gap-2.5 rounded-[20px] p-5">
            <span className="text-[10px] font-extrabold tracking-[0.13em] uppercase">
              {dicaLabel}
            </span>
            <p className="text-sm">{dicaText}</p>
          </div>
        </aside>

        <section className="flex flex-col gap-8 px-6 py-8 lg:px-14 lg:pt-14 lg:pb-12">
          <div className="flex flex-col gap-3">
            <span className="text-primary text-[11px] font-extrabold tracking-[0.13em] uppercase">
              {stepLabel}
            </span>
            <h2 className="font-heading text-[42px] leading-[1.05] font-extrabold tracking-[-0.03em]">
              {title}
            </h2>
            <p className="text-foreground/70 text-[15px]">{description}</p>
          </div>

          {children}
        </section>
      </div>

      <footer className="border-border bg-card flex items-center justify-between border-t px-6 py-5 lg:px-16">
        <span className="text-muted-foreground text-xs">
          lugh / Treine. Prove. Entre.
        </span>
        <Link href="/entrevistadores" className="text-primary text-sm font-bold">
          Salvar e sair
        </Link>
      </footer>
    </main>
  );
}
