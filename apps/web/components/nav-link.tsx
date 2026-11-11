"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Link do cabeçalho. A página atual ganha o sublinhado verde por dentro
// (box-shadow inset, pra não mexer na altura da linha).
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="text-foreground inline-flex min-h-11 items-center aria-[current=page]:shadow-[inset_0_-3px_0_var(--primary)]"
    >
      {children}
    </Link>
  );
}
