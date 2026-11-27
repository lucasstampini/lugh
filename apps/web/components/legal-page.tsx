import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Eyebrow } from "@/components/eyebrow";
import { LegalLinks } from "@/components/legal-links";
import { CONTACT_EMAIL, LEGAL_UPDATED_AT } from "@/lib/legal";

const FOOTER_LINK = "text-foreground nav-underline inline-flex min-h-11 items-center";

// Casca das páginas de texto legal (/termos e /privacidade): coluna estreita de leitura.
export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="edge-b px-[clamp(20px,5vw,48px)] py-[18px]">
        <Link href="/" aria-label="Lugh, página inicial" className="inline-flex min-h-11 items-center">
          <Image src="/brand/lugh-logo.svg" alt="Lugh" width={92} height={32} className="h-8 w-auto" />
        </Link>
      </header>

      <main className="mx-auto box-border flex w-full max-w-[760px] flex-1 flex-col gap-9 px-[clamp(20px,5vw,48px)] pt-[clamp(28px,5vw,56px)] pb-[72px]">
        <div className="flex flex-col gap-3">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
            {title}
          </h1>
          <p className="text-muted-foreground font-mono text-xs">
            atualizado em {LEGAL_UPDATED_AT.toLowerCase()}
          </p>
          <p className="text-muted-foreground max-w-[68ch]">{intro}</p>
        </div>

        {children}
      </main>

      <footer className="edge-t flex flex-wrap items-center justify-between gap-x-8 gap-y-2 px-[clamp(20px,5vw,48px)] py-5 text-sm font-semibold">
        <LegalLinks linkClassName={FOOTER_LINK} className="gap-x-6" />
        <a href={`mailto:${CONTACT_EMAIL}`} className={FOOTER_LINK}>
          {CONTACT_EMAIL}
        </a>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex max-w-[68ch] flex-col gap-3">
      <h2 className="font-heading text-[22px] leading-[1.2] font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 pl-5">{children}</ul>;
}

export function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-deep font-bold underline underline-offset-2">
      {CONTACT_EMAIL}
    </a>
  );
}
