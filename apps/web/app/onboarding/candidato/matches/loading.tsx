import { candidateOnboardingSteps } from "@/components/onboarding/steps";
import { StepHeader } from "@/components/step-header";
import { WizardShell } from "@/components/wizard-shell";

// Mesma casca da tela pronta, com três linhas no lugar dos entrevistadores.
export default function Loading() {
  return (
    <WizardShell
      header={<StepHeader label="passo 3 de 3" />}
      activeStep={3}
      steps={candidateOnboardingSteps(true)}
      eyebrow="Bem-vindo ao Lugh."
      heroLines={["Quem treina", "com você."]}
      dicaLabel="Dica"
      dicaText="Você paga só pela sessão que marcar. O perfil completo fica para depois, em Seu perfil."
    >
      <div className="flex max-w-[860px] flex-col gap-4">
        <p role="status" className="sr-only">
          Procurando quem combina com você…
        </p>
        <div className="bg-skeleton skeleton-pulse h-10 w-[min(100%,420px)] rounded" />
        {[0, 1, 2].map((row) => (
          <div key={row} className="bg-skeleton skeleton-pulse h-32 rounded-[20px]" />
        ))}
      </div>
    </WizardShell>
  );
}
