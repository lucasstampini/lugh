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
    <nav aria-label="Etapas">
      {/* No celular as etapas ficam lado a lado, só com o número; a etapa
          atual mostra o nome. A lista em coluna é do desktop. */}
      <ol className="flex flex-wrap gap-2 lg:flex-col lg:gap-3.5">
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
              {isDone ? (
                <>
                  <span aria-hidden="true">✓</span>
                  <span className="sr-only">Concluída: </span>
                </>
              ) : (
                step.number
              )}
            </span>
            <span
              className={`text-[13px] ${isActive ? "" : "max-lg:sr-only"} ${
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

        const shape = `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 lg:py-4 ${
          isActive ? "bg-card" : "max-lg:border max-lg:border-white/35"
        }`;

        return (
          <li key={step.number}>
            {step.href ? (
              <Link
                href={step.href}
                aria-current={isActive ? "step" : undefined}
                className={shape}
              >
                {content}
              </Link>
            ) : (
              <div aria-current={isActive ? "step" : undefined} className={shape}>
                {content}
              </div>
            )}
          </li>
        );
        })}
      </ol>
    </nav>
  );
}
