import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton label="Carregando o formulário de feedback…" maxWidth="max-w-[1040px]" blocks={["h-48", "h-48", "h-32"]} />;
}
