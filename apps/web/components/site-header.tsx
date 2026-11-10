import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeaderNav } from "./site-header-nav";

export function SiteHeader() {
  return (
    <header className="border-border bg-card relative flex h-[88px] items-center justify-between gap-3 border-b px-6 lg:px-16">
      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/brand/lugh-symbol.svg" alt="" width={23} height={30} />
        <span className="font-heading text-primary text-3xl font-extrabold tracking-[-0.02em]">
          lugh
        </span>
      </Link>

      <Suspense fallback={null}>
        <SiteHeaderNav />
      </Suspense>
    </header>
  );
}
