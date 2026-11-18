import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AuthSection } from "./auth-section";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[5fr_4fr]">
      {/* Manifesto: faixa azul de ponta a ponta, sem container e sem card, com
          a mesma textura de pontos do alto da home, aqui em branco para aparecer
          sobre o azul. O texto grande desce em escada, então o bloco de cor
          ocupa a página inteira em vez de virar um painel decorativo ao lado do
          formulário. O amarelo entra só nos dois acentos: a bolinha da logo e o
          ponto final do manifesto. */}
      <div
        className="bg-brand-deep border-ink relative box-border flex flex-col justify-between gap-14 overflow-hidden border-b-[1.5px] px-[clamp(24px,5vw,64px)] py-[clamp(28px,4vw,56px)] lg:border-r-[1.5px] lg:border-b-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1.4px, transparent 1.4px)",
          backgroundSize: "26px 26px",
        }}
      >
        <div className="flex flex-col gap-[clamp(28px,5vw,64px)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="Lugh, página inicial"
              className="group/logo inline-flex min-h-11 items-center"
            >
              <Image
                src="/brand/lugh-logo-dark-bg.svg"
                alt="Lugh"
                width={98}
                height={34}
                className="h-[34px] w-auto transition-transform duration-[400ms] group-hover/logo:scale-[1.06] group-hover/logo:-rotate-3"
              />
            </Link>

            <span className="edge bg-card text-ink rounded-full px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
              Hack Brasil 2026
            </span>
          </div>

          {/* Não é cabeçalho de conteúdo: o h1 da página é o do formulário, ao
              lado. Aqui é a assinatura da marca, em corpo de display. */}
          <p className="pop font-heading text-[clamp(44px,7vw,96px)] leading-[0.95] font-extrabold tracking-[-0.04em] text-white">
            Treine
            <br />
            <span className="pl-[8%]">com quem já</span>
            <br />
            <span className="pl-[16%]">
              contrata
              <span className="text-primary">.</span>
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <span aria-hidden="true" className="h-[1.5px] w-full bg-white/30" />

          <div className="flex gap-5">
            <span aria-hidden="true" className="text-primary font-heading text-xl font-extrabold">
              ›
            </span>
            <div className="flex flex-col items-start gap-3">
              <p className="font-heading text-[clamp(20px,2.2vw,28px)] leading-[1.12] font-bold tracking-[-0.01em] text-white">
                Chegue preparado de verdade na próxima entrevista.
              </p>
              <Link href="/#como-funciona" className="nav-underline text-sm font-semibold text-white">
                Como funciona
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Acesso: controles reais (Google + link de acesso), sem senha. */}
      <div className="bg-background box-border flex flex-col justify-center px-[clamp(24px,5vw,64px)] py-[clamp(40px,5vw,64px)]">
        <div className="pop flex w-full max-w-[420px] flex-col gap-[22px] lg:mx-auto">
          <Suspense fallback={null}>
            <AuthSection searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
