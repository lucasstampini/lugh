import { SiteHeader } from "@/components/site-header";

// Mesmo esqueleto da página pronta (faixa amarela, filtros, grade de cards),
// para nada pular de lugar quando os dados chegam.
export default function Loading() {
  return (
    <main className="bg-secondary flex min-h-screen flex-col">
      <SiteHeader />

      <section className="edge-b bg-primary">
        <div className="mx-auto flex max-w-[1312px] flex-col gap-4 px-6 py-14">
          <div className="bg-ink/15 h-3.5 w-56 rounded" />
          <div className="bg-ink/15 h-10 w-[min(100%,520px)] rounded sm:h-12" />
          <div className="bg-ink/15 h-6 w-[min(100%,440px)] rounded" />
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-8 px-6 py-10">
        <p role="status" className="sr-only">
          Carregando profissionais…
        </p>

        <div className="border-border-soft bg-card skeleton-pulse h-[190px] rounded-[20px] border" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="border-border-soft bg-card border-l-brand-deep flex h-[300px] flex-col gap-3.5 rounded-[20px] border border-l-4 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="bg-skeleton skeleton-pulse size-14 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="bg-skeleton skeleton-pulse h-4 w-2/3 rounded" />
                  <div className="bg-skeleton skeleton-pulse h-3 w-1/2 rounded" />
                  <div className="bg-skeleton skeleton-pulse h-3 w-3/4 rounded" />
                </div>
              </div>
              <div className="bg-skeleton skeleton-pulse h-9 rounded" />
              <div className="bg-skeleton skeleton-pulse mt-auto h-9 w-28 self-end rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
