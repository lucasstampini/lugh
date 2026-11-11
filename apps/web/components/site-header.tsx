import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeaderNav } from "./site-header-nav";

export function SiteHeader() {
  return (
    <header className="edge-b bg-background relative">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-[clamp(20px,5vw,48px)] py-3.5">
        <Link href="/" aria-label="Lugh, página inicial" className="inline-flex min-h-11 items-center">
          <Image src="/brand/lugh-logo.svg" alt="Lugh" width={92} height={32} className="h-8 w-auto" />
        </Link>

        <Suspense fallback={null}>
          <SiteHeaderNav />
        </Suspense>
      </div>
    </header>
  );
}
