import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { RoomCollage } from "@/components/demo/room-collage";
import { AuthSection } from "./auth-section";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <main className="box-border flex min-w-0 flex-[1_1_420px] flex-col gap-10 px-[clamp(20px,5vw,64px)] pt-6 pb-12">
        <Link
          href="/"
          aria-label="Lugh, página inicial"
          className="inline-flex min-h-11 items-center self-start"
        >
          <Image src="/brand/lugh-logo.svg" alt="Lugh" width={92} height={32} className="h-8 w-auto" />
        </Link>

        {/* Acesso: controles reais (Google + link de acesso), sem senha. */}
        <div className="pop m-auto flex w-full max-w-[420px] flex-col gap-[22px]">
          <Suspense fallback={null}>
            <AuthSection searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

      {/* Painel decorativo: a sala em miniatura. Some para leitores de tela. */}
      <aside
        aria-hidden="true"
        className="edge-l bg-dots bg-secondary box-border hidden min-w-0 flex-[1.15_1_420px] items-center justify-center p-[clamp(28px,5vw,72px)] md:flex"
      >
        <div className="w-full max-w-[580px]">
          <RoomCollage />
        </div>
      </aside>
    </div>
  );
}
