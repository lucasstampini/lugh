import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton label="Carregando seu perfil…" blocks={["h-40", "h-72"]} />;
}
