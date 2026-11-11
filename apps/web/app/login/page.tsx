import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AuthSection } from "./auth-section";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[5fr_4fr]">
      {/* Manifesto: réplica do artboard "Boas-vindas e acesso". */}
      <div className="bg-primary flex flex-col justify-between gap-16 px-8 py-12 sm:px-12 lg:px-16 lg:py-16">
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/brand/lugh-logo-dark-bg.svg"
                alt="Lugh"
                width={92}
                height={32}
              />
            </Link>
            <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] uppercase">
              Hack Brasil 2026
            </span>
          </div>

          <h1 className="font-heading text-[clamp(2.75rem,9vw,8.75rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-primary-foreground">
            Prove
            <br />
            <span className="pl-[8%]">que já</span>
            <br />
            <span className="pl-[16%]">sabe.</span>
          </h1>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-secondary h-px opacity-35" />
          <div className="flex gap-7">
            <span className="text-primary font-bold">›</span>
            <div className="flex flex-col gap-3.5">
              <p className="font-heading text-2xl leading-[1.12] font-bold tracking-[-0.01em] text-primary-foreground sm:text-3xl">
                Pronto pra provar que já sabe o que faz?
              </p>
              <Link
                href="/#como-funciona"
                className="text-secondary text-sm hover:underline"
              >
                Como funciona
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Acesso: controles reais (Google + link mágico), sem senha. */}
      <div className="bg-background flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-[clamp(2rem,4vw,3.375rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
              Entrar no Lugh
            </h2>
            <p className="text-foreground/70 text-base leading-relaxed">
              Continue de onde parou: suas sessões, seu perfil e seu
              histórico estão aqui.
            </p>
          </div>

          <Suspense fallback={null}>
            <AuthSection searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
