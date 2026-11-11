import Image from "next/image";

// Cabeçalho dos fluxos em passos (onboarding): logo e o passo atual em mono.
// Sem navegação, de propósito: a pessoa ainda não terminou o cadastro.
export function StepHeader({ label }: { label: string }) {
  return (
    <header className="edge-b">
      <div className="mx-auto box-border flex max-w-[1240px] items-center justify-between gap-4 px-[clamp(20px,5vw,48px)] py-3.5">
        <span className="inline-flex min-h-11 items-center">
          <Image src="/brand/lugh-logo.svg" alt="Lugh" width={92} height={32} className="h-8 w-auto" />
        </span>
        <span className="font-mono text-[13px] font-bold">{label}</span>
      </div>
    </header>
  );
}
