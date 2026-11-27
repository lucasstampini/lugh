import type { WizardStep } from "@/components/wizard-steps";

// Etapas do onboarding. O passo 2 só ganha destino depois que a pessoa escolhe
// o papel, então na tela de escolha ele fica sem href.
// Etapas do candidato: o questionário e, no fim, os entrevistadores sugeridos. Os matches
// só existem depois de responder, então ficam sem href até lá.
export function candidateOnboardingSteps(matchesReady = false): WizardStep[] {
  return [
    { number: "01", label: "Seu papel no Lugh", href: matchesReady ? undefined : "/onboarding" },
    { number: "02", label: "Seu treino", href: "/onboarding/candidato" },
    { number: "03", label: "Seus matches", href: matchesReady ? "/onboarding/candidato/matches" : undefined },
  ];
}

export function onboardingSteps(roleHref?: string): WizardStep[] {
  return [
    { number: "01", label: "Seu papel no Lugh", href: "/onboarding" },
    { number: "02", label: "Seu perfil", href: roleHref },
  ];
}
