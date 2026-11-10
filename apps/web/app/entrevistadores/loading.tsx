import { SiteHeader } from "@/components/site-header";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex w-full flex-col gap-8 px-6 py-10 lg:px-12">
        <div className="flex flex-col gap-3">
          <div className="bg-muted h-10 w-72 animate-pulse rounded" />
          <div className="bg-muted h-4 w-96 animate-pulse rounded" />
        </div>

        <div className="border-border bg-card h-24 animate-pulse rounded-[20px] border" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="border-border bg-card flex flex-col gap-3 rounded-[20px] border p-5"
            >
              <div className="bg-muted size-12 animate-pulse rounded-full" />
              <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
              <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
              <div className="bg-muted h-16 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
