import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CodeAccent, CodeBlock, CodeMuted } from "@/components/code-block";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-dots flex min-h-screen flex-col">
      <header className="px-[clamp(20px,5vw,48px)] py-[18px]">
        <Link href="/" aria-label="Lugh, página inicial" className="inline-flex min-h-11 items-center">
          <Image src="/brand/lugh-logo.svg" alt="Lugh" width={92} height={32} className="h-8 w-auto" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-[clamp(20px,5vw,48px)] pt-6 pb-20">
        <div className="pop edge bg-card box-border flex w-full max-w-[560px] flex-col items-start gap-[18px] rounded-[20px] p-[clamp(22px,4vw,40px)]">
          <CodeBlock className="self-stretch rounded-xl px-4 py-3.5 text-sm leading-[1.8]">
            <div>
              <CodeMuted>GET</CodeMuted> /essa-pagina
            </div>
            <div>
              <CodeAccent>404</CodeAccent> não encontrada
              <span
                aria-hidden="true"
                className="caret bg-primary ml-1.5 inline-block h-[1.05em] w-2 align-text-bottom"
              />
            </div>
          </CodeBlock>
          <h1 className="font-heading text-[clamp(30px,3.6vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
            Essa página não existe
          </h1>
          <p className="text-muted-foreground">
            O endereço pode estar errado ou a página foi removida. Os entrevistadores continuam
            no mesmo lugar.
          </p>
          <Link href="/entrevistadores" className={buttonVariants({ size: "lg" })}>
            Encontrar um entrevistador
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </main>
    </div>
  );
}
