import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function AgendarPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="bg-lume text-lume-foreground w-fit rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.08em]">
          Em breve
        </span>
        <h1 className="font-heading text-3xl font-bold tracking-[-0.02em]">
          Agendamento em breve
        </h1>
        <p className="text-foreground/70 max-w-md text-sm">
          Estamos terminando a tela de agendamento e pagamento. Volte em
          breve pra marcar sua sessão.
        </p>
        <Link href="/entrevistadores" className="text-primary text-sm font-medium">
          Voltar para entrevistadores
        </Link>
      </div>
    </main>
  );
}
