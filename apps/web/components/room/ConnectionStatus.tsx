"use client";

import { useConnectionState } from "@livekit/components-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { combineConnectionStatus, isFullyConnected, type ConnectionTone } from "@/lib/room/connection";

import { useCollab } from "./CollabProvider";

const dotColor: Record<ConnectionTone, string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500 animate-pulse",
  error: "bg-destructive",
};

// Indicador de conexão da sala (fase 1, bullet 7): junta o vídeo (LiveKit) e a colaboração
// (Hocuspocus) num estado só. Precisa estar dentro de <LiveKitRoom> e do <CollabProvider>.
export function ConnectionStatus() {
  const livekit = useConnectionState();
  const collabState = useCollab();
  // Sem collab configurado o contexto é null e só o vídeo conta. Com collab, o contexto
  // também é null por um instante antes do efeito criar a conexão: tratamos como "connecting".
  const collab = process.env.NEXT_PUBLIC_COLLAB_URL ? (collabState?.status ?? "connecting") : null;

  // Guardado em estado (e não ref) para poder ser lido na renderização.
  const [hasConnected, setHasConnected] = useState(false);
  if (!hasConnected && isFullyConnected({ collab, livekit })) setHasConnected(true);

  const { label, tone } = combineConnectionStatus({ collab, livekit, hasConnected });

  return (
    <Badge variant="outline" role="status" aria-live="polite" data-tone={tone}>
      <span aria-hidden className={`size-2 rounded-full ${dotColor[tone]}`} />
      {label}
    </Badge>
  );
}
