import Link from "next/link";

export const WIZARD_STEPS = [
  { number: "01", label: "Dados pessoais", href: "/perfil" },
  { number: "02", label: "Objetivo", href: "/perfil/objetivo" },
  { number: "03", label: "Experiência", href: "/perfil/experiencia" },
  { number: "04", label: "Revisar", href: "/perfil/revisar" },
];

// A etapa atual fica em verde e marcada com aria-current.
export function ProfileWizardSteps({ activeStep }: { activeStep: number }) {
  return (
    <nav aria-label="Etapas do perfil">
      <ol className="flex flex-col gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = index + 1 === activeStep;
          return (
            <li key={step.number}>
              <Link
                href={step.href}
                aria-current={isActive ? "step" : undefined}
                className={`edge text-foreground flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3.5 ${
                  isActive ? "bg-primary text-ink font-extrabold" : "bg-card hover:bg-accent font-bold"
                }`}
              >
                <span className="font-mono text-[13px]">{step.number}</span>
                <span>{step.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
