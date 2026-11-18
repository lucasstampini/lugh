import { OnboardingRoleChoice } from "@/components/onboarding/role-choice";

// Prévia local do onboarding, sem sessão: serve só para olhar a tela durante
// o desenho. A rota real continua em /onboarding, com login.
export const metadata = { robots: { index: false, follow: false } };

export default function PreviewOnboardingPage() {
  return <OnboardingRoleChoice />;
}
