import Link from "next/link";

const STEPS = [
  { number: "01", label: "Dados pessoais", href: "/perfil" },
  { number: "02", label: "Objetivo profissional", href: "/perfil/objetivo" },
  { number: "03", label: "Experiência e prática", href: "/perfil/experiencia" },
  { number: "04", label: "Revisar perfil", href: "/perfil/revisar" },
];

// Fundo da lista é a sidebar Índigo (bg-primary). Etapa ativa vira cartão
// branco; etapas concluídas mostram "✓" em vez do número (ambas em branco,
// só a ativa fica em Índigo sobre fundo branco).
export function ProfileWizardSteps({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex flex-col gap-3.5">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === activeStep;
        const isDone = stepNumber < activeStep;

        return (
          <Link
            key={step.number}
            href={step.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-4 ${
              isActive ? "bg-card" : ""
            }`}
          >
            <span
              className={`text-[14px] font-extrabold ${
                isActive ? "text-primary" : isDone ? "text-lume" : "text-primary-foreground"
              }`}
            >
              {isDone ? "✓" : step.number}
            </span>
            <span
              className={`text-[13px] ${
                isActive
                  ? "text-primary font-extrabold"
                  : isDone
                    ? "text-lume font-bold"
                    : "text-primary-foreground font-normal"
              }`}
            >
              {step.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
