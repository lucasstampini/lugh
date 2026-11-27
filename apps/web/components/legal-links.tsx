import Link from "next/link";

import { cn } from "cn";

// Links de Termos e Privacidade para rodapés e avisos.
export function LegalLinks({ className, linkClassName }: { className?: string; linkClassName?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-4 gap-y-1", className)}>
      <Link href="/termos" className={linkClassName}>
        Termos de Uso
      </Link>
      <Link href="/privacidade" className={linkClassName}>
        Privacidade
      </Link>
    </span>
  );
}
