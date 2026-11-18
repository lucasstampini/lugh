import type { WizardStep } from "@/components/wizard-steps";

// Etapas do onboarding. O passo 2 só ganha destino depois que a pessoa escolhe
// o papel, então na tela de escolha ele fica sem href.
export function onboardingSteps(roleHref?: string): WizardStep[] {
  return [
    { number: "01", label: "Seu papel no Lugh", href: "/onboarding" },
    { number: "02", label: "Seu perfil", href: roleHref },
  ];
}
