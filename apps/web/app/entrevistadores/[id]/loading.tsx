import { SiteHeader } from "@/components/site-header";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="flex w-full flex-col gap-5 px-6 py-8 lg:px-12">
        <div className="bg-muted h-4 w-40 animate-pulse rounded" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <div className="border-border bg-card flex flex-col gap-6 rounded-[20px] border p-8">
              <div className="flex items-center gap-6">
                <div className="bg-muted size-24 animate-pulse rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="bg-muted h-7 w-1/2 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-1/4 animate-pulse rounded" />
                </div>
              </div>
              <div className="bg-muted h-16 animate-pulse rounded" />
            </div>

            <div className="border-border bg-card flex flex-col gap-4 rounded-[20px] border p-8">
              <div className="bg-muted h-6 w-40 animate-pulse rounded" />
              <div className="bg-muted h-20 animate-pulse rounded" />
            </div>
          </div>

          <div className="border-border bg-card flex h-fit flex-col gap-4 rounded-[20px] border p-6">
            <div className="bg-muted h-10 w-28 animate-pulse rounded-full" />
            <div className="bg-muted h-12 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
