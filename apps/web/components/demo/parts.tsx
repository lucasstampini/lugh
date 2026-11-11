import { cn } from "cn";
import type { ReactNode } from "react";

// Peças pequenas das demonstrações da sala (landing e login). Tudo decorativo.

// Ponto "ao vivo" pulsando.
export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("live edge bg-primary inline-block size-2 rounded-full", className)}
    />
  );
}

// Cursor colaborativo com etiqueta. Cores do produto: entrevistador em verde,
// candidato em branco.
export function DemoCursor({
  name,
  tone,
  className,
}: {
  name: string;
  tone: "interviewer" | "candidate";
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("absolute flex items-center gap-1", className)}>
      <svg width="14" height="18" viewBox="0 0 12 18">
        <path
          d="M0,0 L0,15 L3.6,11.6 L6.4,17.2 L8.4,16.2 L5.6,10.6 L10.4,10.6 Z"
          className={cn("stroke-ink", tone === "interviewer" ? "fill-primary" : "fill-card")}
          strokeWidth="0.8"
        />
      </svg>
      <span
        className={cn(
          "edge text-ink rounded-full px-[7px] text-[11px] font-bold",
          tone === "interviewer" ? "bg-primary" : "bg-card",
        )}
      >
        {name}
      </span>
    </div>
  );
}

// Etiqueta com o nome ao lado de uma linha de código.
export function LineAuthor({
  name,
  tone,
}: {
  name: string;
  tone: "interviewer" | "candidate";
}) {
  return (
    <span
      className={cn(
        "text-ink rounded-[5px] px-1.5 py-px text-[11px] font-bold",
        tone === "interviewer" ? "bg-primary" : "bg-code-foreground",
      )}
    >
      {name}
    </span>
  );
}

// Cursor de texto piscando dentro do editor.
export function Caret({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("caret bg-code-foreground inline-block h-[1.1em] w-0.5 align-text-bottom", className)}
    />
  );
}

export function Kw({ children }: { children: ReactNode }) {
  return <span className="text-primary">{children}</span>;
}

export function LineNo({ children }: { children: ReactNode }) {
  return <span className="text-code-muted">{children}</span>;
}

// Setas do diagrama do quadro, presas ao nó "API".
export function BoardArrows({ gap }: { gap: "sm" | "lg" }) {
  const side = gap === "sm" ? "-left-5" : "-left-6";
  const right = gap === "sm" ? "-right-5" : "-right-6";
  const bottom = gap === "sm" ? "-bottom-6" : "-bottom-[29px]";
  return (
    <>
      <span aria-hidden="true" className={cn("absolute top-1/2 -translate-y-1/2", side)}>
        →
      </span>
      <span aria-hidden="true" className={cn("absolute top-1/2 -translate-y-1/2", right)}>
        →
      </span>
      <span aria-hidden="true" className={cn("absolute left-1/2 -translate-x-1/2", bottom)}>
        ↓
      </span>
    </>
  );
}
