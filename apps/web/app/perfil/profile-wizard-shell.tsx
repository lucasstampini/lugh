import type { ReactNode } from "react";
import { CodeAccent, CodeBlock, CodeMuted } from "@/components/code-block";
import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { ProfileWizardSteps, WIZARD_STEPS } from "./profile-wizard-steps";

// Casca compartilhada das 4 etapas do perfil do candidato: cabeçalho, coluna
// lateral com as etapas e a área do formulário. Só o conteúdo muda.
export function ProfileWizardShell({
  activeStep,
  title,
  children,
}: {
  activeStep: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto box-border flex w-full max-w-[1120px] flex-wrap items-start gap-x-14 gap-y-8 px-[clamp(20px,5vw,48px)] pt-[clamp(24px,4vw,48px)] pb-[72px]">
        <aside className="flex w-full min-w-0 flex-[1_1_240px] flex-col gap-[18px] md:max-w-[300px]">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>meu perfil</Eyebrow>
            <p className="text-muted-foreground text-sm">
              Quanto mais o entrevistador sabe de você, mais a sessão se parece com a vaga que
              você quer.
            </p>
          </div>
          <ProfileWizardSteps activeStep={activeStep} />
          <CodeBlock className="rounded-xl text-xs">
            <div>
              <CodeMuted>GET</CodeMuted> {WIZARD_STEPS[activeStep - 1]?.href}
            </div>
            <CodeAccent>etapa {activeStep} de 4</CodeAccent>
          </CodeBlock>
        </aside>

        <section className="flex min-w-0 flex-[999_1_460px] flex-col gap-6">
          <h1 className="pop font-heading text-[clamp(28px,3.2vw,40px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
            {title}
          </h1>
          {children}
        </section>
      </main>
    </div>
  );
}
