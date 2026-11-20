import { SiteHeader } from "@/components/site-header";

// Esqueleto de carregamento das telas internas: cabeçalho de verdade, título e
// blocos no lugar do conteúdo. Cada loading.tsx escolhe a largura e os blocos
// para ficar parecido com a página que vem depois.
export function PageSkeleton({
  label,
  maxWidth = "max-w-[1120px]",
  band = false,
  blocks = ["h-28", "h-28", "h-28"],
}: {
  // Texto lido por leitor de tela enquanto carrega.
  label: string;
  maxWidth?: string;
  // Faixa azul de topo, para as telas que têm uma.
  band?: boolean;
  // Altura de cada bloco de conteúdo (classe do Tailwind).
  blocks?: string[];
}) {
  const container = `mx-auto box-border w-full ${maxWidth} px-[clamp(20px,5vw,48px)]`;

  const heading = (
    <div className="flex flex-col gap-3">
      <div className={`h-3.5 w-28 rounded ${band ? "bg-white/20" : "bg-skeleton skeleton-pulse"}`} />
      <div
        className={`h-10 w-[min(100%,360px)] rounded ${band ? "bg-white/20" : "bg-skeleton skeleton-pulse"}`}
      />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {band ? (
        <section className="edge-b bg-brand-deep">
          <div className={`${container} py-[clamp(28px,4vw,52px)]`}>{heading}</div>
        </section>
      ) : null}

      <main className={band ? "bg-secondary flex-1" : "flex-1"}>
        <div className={`${container} flex flex-col gap-6 pt-[clamp(24px,4vw,48px)] pb-[72px]`}>
          <p role="status" className="sr-only">
            {label}
          </p>
          {band ? null : heading}
          {blocks.map((height, index) => (
            <div
              key={index}
              className={`border-border-soft bg-card flex flex-col gap-3 rounded-2xl border p-5 ${height}`}
            >
              <div className="bg-skeleton skeleton-pulse h-4 w-1/3 rounded" />
              <div className="bg-skeleton skeleton-pulse min-h-4 flex-1 rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
