import { SiteHeader } from "@/components/site-header";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto box-border flex w-full max-w-[1240px] flex-col gap-5 px-[clamp(20px,5vw,48px)] pt-5 pb-[72px]">
        <p role="status" className="text-muted-foreground flex min-h-11 items-center font-mono text-[13px]">
          carregando perfil…
        </p>
        <div className="flex animate-pulse flex-wrap items-start gap-x-10 gap-y-7">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-8">
            <div className="bg-secondary flex flex-wrap items-center gap-x-7 gap-y-5 rounded-[18px] p-[clamp(18px,2.4vw,28px)]">
              <div className="bg-skeleton size-[168px] shrink-0 rounded-2xl" />
              <div className="flex flex-[1_1_300px] flex-col gap-3">
                <div className="bg-skeleton h-5 w-40 rounded-md" />
                <div className="bg-skeleton h-10 w-2/3 rounded-md" />
                <div className="bg-skeleton h-5 w-1/2 rounded-md" />
                <div className="bg-skeleton h-4 w-1/3 rounded-md" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="bg-skeleton h-7 w-24 rounded-md" />
              <div className="bg-skeleton h-4 w-full max-w-[68ch] rounded-md" />
              <div className="bg-skeleton h-4 w-4/5 max-w-[60ch] rounded-md" />
            </div>
          </div>
          <div className="border-border-soft flex w-full min-w-0 flex-[1_1_340px] flex-col gap-[18px] rounded-[18px] border-[1.5px] p-6 md:max-w-[420px]">
            <div className="bg-skeleton h-9 w-28 rounded-md" />
            <div className="bg-skeleton h-11 rounded-lg" />
            <div className="bg-skeleton h-11 rounded-lg" />
            <div className="bg-skeleton h-[54px] rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
