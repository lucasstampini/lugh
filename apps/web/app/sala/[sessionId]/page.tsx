import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Room } from "@/components/room/Room";
import { TEST_SESSION_ID } from "@/lib/room/session";

export const metadata: Metadata = { title: "Sala | Lugh" };

// A sala pode bloquear a navegação até saber o sessionId: ela é aberta por link, e
// validar antes de renderizar garante um 404 de verdade (com Suspense o status sairia 200).
// Na fase 5 essa validação passa a checar se o usuário logado é participante da sessão.
export const instant = false;

// Fase 1: só a sala de teste existe, então ela é pré-gerada no build.
export function generateStaticParams() {
  return [{ sessionId: TEST_SESSION_ID }];
}

export default async function SalaPage({ params }: PageProps<"/sala/[sessionId]">) {
  const { sessionId } = await params;
  if (sessionId !== TEST_SESSION_ID) notFound();

  return <Room sessionId={sessionId} />;
}
