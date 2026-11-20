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
//
// header troca o cabeçalho do site: o onboarding usa um sem navegação, porque
// quem ainda não tem papel é mandado de volta para /onboarding a cada link e
// perderia o que já preencheu.
export function WizardShell({
  header = <SiteHeader />,
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
  header?: ReactNode;
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
      {header}

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[400px_1fr]">
        <aside className="bg-brand-deep px-6 py-8 text-white lg:px-10 lg:py-12">
          {/* O bloco inteiro gruda no topo e a dica vem logo depois das etapas:
              assim título, etapas e dica ficam no mesmo lugar em todos os
              passos, seja qual for a altura do formulário ao lado. */}
          <div className="flex flex-col gap-8 lg:sticky lg:top-12 lg:gap-11">
            <div className="flex flex-col gap-6">
              <span className="text-[10px] font-extrabold tracking-[0.13em] text-white/80 uppercase">
                {eyebrow}
              </span>
              <p className="font-heading text-[clamp(32px,8vw,42px)] leading-[0.97] font-extrabold tracking-[-0.04em] text-white lg:text-[42px]">
                {heroLines.map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < heroLines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
            </div>

            <WizardSteps activeStep={activeStep} steps={steps} />

            {/* No celular a dica sai: o formulário precisa aparecer logo. */}
            <div className="bg-primary text-ink hidden flex-col gap-2.5 rounded-[20px] p-5 lg:flex">
              <span className="text-[10px] font-extrabold tracking-[0.13em] uppercase">
                {dicaLabel}
              </span>
              <p className="text-sm">{dicaText}</p>
            </div>
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
