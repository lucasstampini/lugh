import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-heading text-primary text-2xl font-extrabold tracking-[-0.02em]">
        lugh
      </p>
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
