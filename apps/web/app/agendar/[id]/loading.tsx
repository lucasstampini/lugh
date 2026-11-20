import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton label="Carregando horários…" blocks={["h-72", "h-56"]} />;
}
