import type { ConnectionState } from "livekit-client";

import type { CollabStatus } from "./collab";

// A sala depende de duas conexões independentes: vídeo (LiveKit) e colaboração (Hocuspocus).
// O indicador junta as duas num estado só, que é o que interessa para quem está na entrevista.

export type ConnectionTone = "ok" | "warning" | "error";

export type ConnectionSummary = { label: string; tone: ConnectionTone };

type Input = {
  // null quando a colaboração não está configurada: nesse caso só o vídeo conta.
  collab: CollabStatus | null;
  livekit: `${ConnectionState}`;
  // Já ficou totalmente conectado alguma vez? Diferencia "Conectando..." de "Reconectando...".
  hasConnected: boolean;
};

export function isFullyConnected({ collab, livekit }: Pick<Input, "collab" | "livekit">): boolean {
  return livekit === "connected" && (collab === null || collab === "connected");
}

export function combineConnectionStatus({ collab, livekit, hasConnected }: Input): ConnectionSummary {
  // O LiveKit só fica "disconnected" quando desistiu de reconectar (ou a pessoa saiu).
  if (livekit === "disconnected") return { label: "Desconectado", tone: "error" };

  if (isFullyConnected({ collab, livekit })) return { label: "Conectado", tone: "ok" };

  // Collab "disconnected" não é definitivo: o provider tenta de novo sozinho, com espera crescente.
  return { label: hasConnected ? "Reconectando..." : "Conectando...", tone: "warning" };
}
