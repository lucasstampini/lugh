import type { ReactNode } from "react";
import { cn } from "cn";

// Bloco de "terminal" da identidade: fundo escuro nos dois modos, texto mono.
// Os spans abaixo colorem o conteúdo: cinza (comando), verde (destaque) e string.
export function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-code text-code-foreground overflow-x-auto rounded-[10px] px-3.5 py-3 font-mono text-[13px] leading-[1.7] whitespace-pre",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CodeMuted({ children }: { children: ReactNode }) {
  return <span className="text-code-muted">{children}</span>;
}

export function CodeAccent({ children }: { children: ReactNode }) {
  return <span className="text-primary">{children}</span>;
}

export function CodeString({ children }: { children: ReactNode }) {
  return <span className="text-code-string">{children}</span>;
}
