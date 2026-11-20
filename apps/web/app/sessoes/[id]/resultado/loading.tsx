import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton label="Carregando o resultado…" maxWidth="max-w-[1180px]" blocks={["h-44", "h-64", "h-64"]} />;
}
