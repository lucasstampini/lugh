"use client";

import { RotateCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

// Rede de segurança das telas: qualquer erro não tratado numa página cai aqui,
// com a mesma moldura do 404, em vez da tela branca do navegador.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="bg-dots flex min-h-screen flex-col">
      <header className="px-[clamp(20px,5vw,48px)] py-[18px]">
        <Link href="/" aria-label="Lugh, página inicial" className="inline-flex min-h-11 items-center">
          <Image src="/brand/lugh-logo.svg" alt="Lugh" width={92} height={32} className="h-8 w-auto" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-[clamp(20px,5vw,48px)] pt-6 pb-20">
        <div
          role="alert"
          className="pop edge bg-card box-border flex w-full max-w-[560px] flex-col items-start gap-[18px] rounded-[20px] p-[clamp(22px,4vw,40px)]"
        >
          <h1 className="font-heading text-[clamp(30px,3.6vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
            Algo deu errado por aqui
          </h1>
          <p className="text-muted-foreground">
            O problema é do nosso lado, não seu. Tente de novo: se continuar, volte em alguns
            minutos.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={reset}>
              <RotateCw aria-hidden="true" />
              Tentar de novo
            </Button>
            <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Ir para o início
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
