import type { ReactNode } from "react";
import { cn } from "cn";

// Chip mono com borda tinta: áreas, tecnologias e tipos de entrevista.
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "border-border inline-flex items-center rounded-[7px] border-[1.5px] px-2.5 py-1 font-mono text-[13px]",
        className,
      )}
    >
      {children}
    </span>
  );
}
