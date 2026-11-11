import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Image src="/brand/lugh-logo.svg" alt="Lugh" width={98} height={34} />
      <h1 className="font-heading text-3xl font-bold tracking-[-0.02em]">
        Página não encontrada
      </h1>
      <p className="text-muted-foreground max-w-md text-sm">
        O que você procura não existe ou não está mais disponível.
      </p>
      <Link href="/entrevistadores" className="text-primary text-sm font-medium">
        Ver entrevistadores
      </Link>
    </main>
  );
}
