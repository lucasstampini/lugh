import type { ReactNode } from "react";
import { cn } from "cn";

// Rótulo acima do título, no formato de comentário de código: "// marketplace".
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-brand-deep font-mono text-[13px] font-bold", className)}>
      {"// "}
      {children}
    </span>
  );
}
