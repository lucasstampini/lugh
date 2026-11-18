import Link from "next/link";

export type WizardStep = {
  number: string;
  label: string;
  // Sem href a etapa ainda não é alcançável (no onboarding, o passo 2 só existe
  // depois de escolher o papel): vira texto, não link.
  href?: string;
};

export const PROFILE_STEPS: WizardStep[] = [
  { number: "01", label: "Dados pessoais", href: "/perfil" },
  { number: "02", label: "Objetivo profissional", href: "/perfil/objetivo" },
  { number: "03", label: "Experiência e prática", href: "/perfil/experiencia" },
  { number: "04", label: "Revisar perfil", href: "/perfil/revisar" },
];

// Fundo da lista é a lateral azul. Etapa ativa vira cartão branco com o texto
// em azul; etapas concluídas ficam em branco sobre o azul, com "✓" amarelo no
// lugar do número. Nenhum texto pode usar a cor da própria lateral.
export function WizardSteps({
  activeStep,
  steps = PROFILE_STEPS,
}: {
  activeStep: number;
  steps?: WizardStep[];
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === activeStep;
        const isDone = stepNumber < activeStep;

        const content = (
          <>
            <span
              className={`text-[14px] font-extrabold ${
                isActive ? "text-brand-deep" : isDone ? "text-primary" : "text-white/70"
              }`}
            >
              {isDone ? "✓" : step.number}
            </span>
            <span
              className={`text-[13px] ${
                isActive
                  ? "text-brand-deep font-extrabold"
                  : isDone
                    ? "font-bold text-white"
                    : "font-normal text-white/70"
              }`}
            >
              {step.label}
            </span>
          </>
        );

        const shape = `flex items-center gap-3 rounded-xl px-3 py-4 ${isActive ? "bg-card" : ""}`;

        return step.href ? (
          <Link key={step.number} href={step.href} className={shape}>
            {content}
          </Link>
        ) : (
          <div key={step.number} className={shape}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
