"use client";

import {
  ControlBar,
  ParticipantTile,
  RoomAudioRenderer,
  TrackLoop,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

// Vídeo dos participantes + barra de controles (mic, câmera, sair).
// Precisa estar dentro de <LiveKitRoom>, que fornece a conexão via contexto.
export function VideoPanel() {
  // Uma "track" por câmera; withPlaceholder mostra o tile mesmo com a câmera desligada.
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  });

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Lista vertical em vez do GridLayout: o grid pagina quando falta espaço e,
          numa entrevista, os dois participantes precisam estar sempre visíveis. */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        <TrackLoop tracks={tracks}>
          <ParticipantTile className="aspect-video w-full shrink-0" />
        </TrackLoop>
      </div>
      <ControlBar
        variation="minimal"
        controls={{ microphone: true, camera: true, leave: true, screenShare: false, chat: false }}
      />
      {/* Sem isto ninguém ouve ninguém: toca o áudio de todos os participantes remotos. */}
      <RoomAudioRenderer />
    </div>
  );
}
