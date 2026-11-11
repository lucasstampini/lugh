import { SiteHeader } from "@/components/site-header";

const WIDTHS = [
  ["w-[46%]", "w-[72%]", "w-[38%]"],
  ["w-[38%]", "w-[64%]", "w-[44%]"],
  ["w-[52%]", "w-[68%]", "w-[32%]"],
];

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main>
        <section className="edge-b bg-secondary">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-[clamp(20px,5vw,48px)] py-[clamp(28px,4vw,48px)]">
            <div className="bg-skeleton h-4 w-32 animate-pulse rounded-md" />
            <div className="bg-skeleton h-11 w-72 max-w-full animate-pulse rounded-md" />
            <div className="bg-skeleton h-4 w-96 max-w-full animate-pulse rounded-md" />
          </div>
        </section>
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-[clamp(20px,5vw,48px)] pt-[clamp(24px,3vw,40px)] pb-16">
          <p role="status" className="text-muted-foreground font-mono text-[13px]">
            carregando entrevistadores…
          </p>
          {WIDTHS.map((widths, index) => (
            <div
              key={index}
              className="border-border-soft flex animate-pulse flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border-[1.5px] p-4"
            >
              <div className="bg-skeleton size-[104px] shrink-0 rounded-xl" />
              <div className="flex flex-[1_1_260px] flex-col gap-2.5">
                <div className={`bg-skeleton h-5 rounded-md ${widths[0]}`} />
                <div className={`bg-skeleton h-3.5 rounded-md ${widths[1]}`} />
                <div className={`bg-skeleton h-3.5 rounded-md ${widths[2]}`} />
              </div>
              <div className="flex flex-[0_1_200px] flex-col gap-2.5">
                <div className="bg-skeleton h-6 w-24 rounded-md" />
                <div className="bg-skeleton h-11 w-[132px] rounded-[10px]" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
