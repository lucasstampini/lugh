import { SiteHeader } from "@/components/site-header";

// Mesmo esqueleto da página pronta: faixa azul com o avatar, conteúdo à
// esquerda e o card de agendamento à direita.
export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      <section className="edge-b bg-brand-deep">
        <div className="mx-auto flex max-w-[1312px] flex-col gap-6 px-6 py-12">
          <div className="flex flex-wrap items-center gap-6">
            <div className="size-24 shrink-0 rounded-[24px] bg-white/20" />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div className="h-3 w-52 max-w-full rounded bg-white/20" />
              <div className="h-10 w-80 max-w-full rounded bg-white/20 sm:h-12" />
              <div className="h-5 w-64 max-w-full rounded bg-white/20" />
            </div>
          </div>
          <div className="h-4 w-[min(100%,460px)] rounded bg-white/20" />
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-6 px-6 py-10">
        <p role="status" className="sr-only">
          Carregando perfil…
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-5">
            {["h-36", "h-64", "h-48"].map((height) => (
              <div
                key={height}
                className={`edge bg-card flex flex-col gap-4 rounded-[20px] p-7 ${height}`}
              >
                <div className="bg-skeleton skeleton-pulse h-6 w-48 rounded" />
                <div className="bg-skeleton skeleton-pulse flex-1 rounded" />
              </div>
            ))}
          </div>

          <div className="edge bg-card flex h-fit flex-col gap-4 rounded-[20px] p-6">
            <div className="bg-skeleton skeleton-pulse h-7 w-40 rounded" />
            <div className="bg-skeleton skeleton-pulse h-9 w-28 rounded" />
            <div className="bg-skeleton skeleton-pulse h-40 rounded-xl" />
            <div className="bg-skeleton skeleton-pulse h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
