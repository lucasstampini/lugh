import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton label="Carregando suas sessões…" band blocks={["h-32", "h-32", "h-32"]} />;
}
