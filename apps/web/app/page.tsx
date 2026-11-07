import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-5xl font-semibold tracking-tight">Lugh</h1>
      <p className="text-muted-foreground text-lg">Treine. Prove. Entre.</p>
      <a href="/api/health" className={buttonVariants()}>
        Status
      </a>
    </main>
  );
}
