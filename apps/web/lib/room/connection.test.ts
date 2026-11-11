/**
 * Testes de lib/room/connection.ts
 *
 * O que cobre: como o estado do vídeo (LiveKit) e o da colaboração (Hocuspocus) viram
 * um único rótulo no indicador da sala: Conectado, Conectando..., Reconectando... ou Desconectado.
 *
 * Por que importa: numa entrevista, se o collab cair (ex: Render dormindo), as edições
 * deixam de chegar ao outro sem nenhum aviso visual. O indicador precisa refletir a pior
 * das duas conexões e não pode alarmar quem acabou de entrar com "Reconectando...".
 *
 * Rodar só este arquivo: npx vitest run lib/room/connection.test.ts
 */
import { describe, expect, it } from "vitest";

import { combineConnectionStatus, isFullyConnected } from "./connection";

describe("combineConnectionStatus", () => {
  it("mostra Conectado quando vídeo e colaboração estão conectados", () => {
    const result = combineConnectionStatus({ collab: "connected", livekit: "connected", hasConnected: true });

    expect(result).toEqual({ label: "Conectado", tone: "ok" });
  });

  it("avisa que o editor está sem acesso quando o collab recusa o token", () => {
    const result = combineConnectionStatus({
      collab: "connected",
      livekit: "connected",
      hasConnected: true,
      collabDenied: true,
    });

    expect(result).toEqual({ label: "Editor sem acesso", tone: "error" });
  });

  it("mostra Conectado só com o vídeo quando a colaboração não está configurada", () => {
    const result = combineConnectionStatus({ collab: null, livekit: "connected", hasConnected: true });

    expect(result).toEqual({ label: "Conectado", tone: "ok" });
  });

  it.each(["disconnected", "connecting"] as const)(
    "mostra Reconectando... quando o collab está %s e o vídeo segue conectado",
    (collab) => {
      const result = combineConnectionStatus({ collab, livekit: "connected", hasConnected: true });

      expect(result).toEqual({ label: "Reconectando...", tone: "warning" });
    },
  );

  it.each(["reconnecting", "signalReconnecting", "connecting"] as const)(
    "mostra Reconectando... quando o vídeo está %s e o collab segue conectado",
    (livekit) => {
      const result = combineConnectionStatus({ collab: "connected", livekit, hasConnected: true });

      expect(result).toEqual({ label: "Reconectando...", tone: "warning" });
    },
  );

  it("mostra Conectando... (e não Reconectando...) antes da primeira conexão completa", () => {
    const result = combineConnectionStatus({ collab: "connecting", livekit: "connecting", hasConnected: false });

    expect(result).toEqual({ label: "Conectando...", tone: "warning" });
  });

  it("mostra Desconectado quando o LiveKit desiste, mesmo com o collab conectado", () => {
    // O LiveKit só chega em "disconnected" depois de esgotar as tentativas de reconexão.
    const result = combineConnectionStatus({ collab: "connected", livekit: "disconnected", hasConnected: true });

    expect(result).toEqual({ label: "Desconectado", tone: "error" });
  });
});

describe("isFullyConnected", () => {
  it("exige o vídeo conectado e o collab conectado ou ausente", () => {
    expect(isFullyConnected({ collab: "connected", livekit: "connected" })).toBe(true);
    expect(isFullyConnected({ collab: null, livekit: "connected" })).toBe(true);
    expect(isFullyConnected({ collab: "connecting", livekit: "connected" })).toBe(false);
    expect(isFullyConnected({ collab: "connected", livekit: "reconnecting" })).toBe(false);
  });
});
