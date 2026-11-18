import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { WizardSteps, type WizardStep } from "@/components/wizard-steps";

// Casca dos fluxos em etapas: cabeçalho, lateral azul com título, lista de
// etapas e dica, e a área do formulário à direita. Serve o wizard de perfil
// (Figma nodes 47:2, 47:61, 47:120, 47:179) e o onboarding, para as duas
// jornadas terem a mesma estrutura.
//
// stepLabel, title e description são opcionais: quando o próprio formulário já
// traz o cabeçalho dele, a casca não repete o título.
export function WizardShell({
  activeStep,
  steps,
  eyebrow = "Seu perfil. Seu próximo passo.",
  heroLines,
  dicaLabel,
  dicaText,
  stepLabel,
  title,
  description,
  children,
}: {
  activeStep: number;
  steps?: WizardStep[];
  eyebrow?: string;
  heroLines: string[];
  dicaLabel: string;
  dicaText: string;
  stepLabel?: string;
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[400px_1fr]">
        <aside className="bg-brand-deep flex flex-col justify-between gap-11 px-6 py-8 text-white lg:px-10 lg:py-12">
          <div className="flex flex-col gap-11">
            <div className="flex flex-col gap-6">
              <span className="text-[10px] font-extrabold tracking-[0.13em] text-white/80 uppercase">
                {eyebrow}
              </span>
              <p className="font-heading text-[clamp(38px,4vw,58px)] leading-[0.97] font-extrabold tracking-[-0.04em] text-white">
                {heroLines.map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < heroLines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
            </div>

            <WizardSteps activeStep={activeStep} steps={steps} />
          </div>

          <div className="bg-primary text-ink flex flex-col gap-2.5 rounded-[20px] p-5">
            <span className="text-[10px] font-extrabold tracking-[0.13em] uppercase">
              {dicaLabel}
            </span>
            <p className="text-sm">{dicaText}</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-8 px-6 py-8 lg:px-14 lg:pt-14 lg:pb-12">
          {title ? (
            <div className="flex flex-col gap-3">
              {stepLabel ? (
                <span className="text-brand-deep text-[11px] font-extrabold tracking-[0.13em] uppercase">
                  {stepLabel}
                </span>
              ) : null}
              <h1 className="font-heading text-[clamp(30px,3.4vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em]">
                {title}
              </h1>
              {description ? (
                <p className="text-foreground/70 text-[15px]">{description}</p>
              ) : null}
            </div>
          ) : null}

          {children}
        </section>
      </div>
    </main>
  );
}
