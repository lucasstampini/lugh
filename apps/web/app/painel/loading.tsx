import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton label="Carregando seu painel…" blocks={["h-36", "h-56", "h-40"]} />;
}
