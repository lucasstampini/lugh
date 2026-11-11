import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// Opção de escolha em linha inteira (radio ou checkbox nativo).
export function OptionRow({
  type,
  name,
  defaultChecked,
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  defaultChecked?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="edge bg-card has-checked:bg-accent flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl px-4 font-semibold has-checked:font-extrabold">
      <input
        type={type}
        name={name}
        defaultChecked={defaultChecked}
        className="accent-brand-deep size-5 shrink-0"
      />
      {children}
    </label>
  );
}

// Aviso das etapas que ainda não gravam no banco.
export function NotSavedNote() {
  return (
    <p className="border-border-dashed text-muted-foreground rounded-[10px] border-[1.5px] border-dashed px-3.5 py-2.5 font-mono text-xs">
      esta etapa ainda não é salva: é uma prévia do que vem por aí
    </p>
  );
}

// Rodapé das etapas: voltar à esquerda, ação principal à direita.
export function WizardFooter({ backHref, children }: { backHref?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1.5">
      {backHref ? (
        <Link href={backHref} className="text-foreground inline-flex min-h-12 items-center gap-2 font-bold">
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
          Voltar
        </Link>
      ) : (
        <span />
      )}
      {children}
    </div>
  );
}
