import { CircleAlert } from "lucide-react";
import { cn } from "cn";
import type { ReactNode } from "react";

// Peças de formulário da identidade: rótulo sempre visível acima do campo,
// erro logo abaixo (com ícone, nunca só cor) e ajuda por último.

export const LABEL_CLASS = "text-sm font-bold";

// Classe para <select> nativo ficar igual ao <Input>.
export const SELECT_CLASS =
  "border-input bg-background text-foreground h-[50px] w-full rounded-xl border-[1.5px] px-3 text-base aria-invalid:border-destructive";

export function Field({
  label,
  htmlFor,
  help,
  error,
  counter,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  error?: string;
  // Contador à direita do rótulo, ex: "120/500".
  counter?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className={LABEL_CLASS}>
          {label}
        </label>
        {counter ? (
          <span className="text-muted-foreground font-mono text-xs tabular-nums">{counter}</span>
        ) : null}
      </div>
      {children}
      <FieldError id={`${htmlFor}-error`} message={error} />
      {help ? <p className="text-muted-foreground text-[13px]">{help}</p> : null}
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} role="alert" className="text-destructive flex items-start gap-1.5 text-sm font-semibold">
      <CircleAlert aria-hidden="true" size={15} strokeWidth={2.4} className="mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

// Alerta de erro do formulário inteiro (ex: falha ao salvar).
export function FormAlert({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="alert" className="edge bg-destructive-soft flex items-start gap-3 rounded-xl px-3.5 py-3">
      <CircleAlert
        aria-hidden="true"
        size={20}
        strokeWidth={2.4}
        className="text-destructive mt-0.5 shrink-0"
      />
      <div>
        <p className="font-extrabold">{title}</p>
        {children ? <p className="text-muted-foreground text-sm">{children}</p> : null}
      </div>
    </div>
  );
}

// Checkbox ou radio em forma de pílula: marcado fica em tinta com texto branco.
export function ChoicePill({
  type = "checkbox",
  name,
  value,
  defaultChecked,
  children,
}: {
  type?: "checkbox" | "radio";
  name: string;
  value: string;
  defaultChecked?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="edge has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-ring inline-flex min-h-11 cursor-pointer items-center rounded-[9px] px-3.5 text-sm font-semibold has-focus-visible:outline-[3px] has-focus-visible:outline-offset-[3px]">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {children}
    </label>
  );
}

// Divisória tracejada com rótulo mono, ex: "// opcional".
export function DashedLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-muted-foreground flex items-center gap-3 font-mono text-xs">
      {"// "}
      {children}
      <span className="border-border-dashed flex-1 border-t-[1.5px] border-dashed" />
    </div>
  );
}
