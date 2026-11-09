"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { colorFromName } from "@/lib/room/colors";
import { createCollab, getMeta, type Collab, type CollabStatus } from "@/lib/room/collab";
import { ensureDefaultLanguage } from "@/lib/room/meta";

// Uma conexão colaborativa por sala, compartilhada por editor e (no bullet 5) quadro:
// o mesmo documento Yjs e o mesmo WebSocket com o Hocuspocus.

type CollabContextValue = { collab: Collab; status: CollabStatus } | null;

const CollabContext = createContext<CollabContextValue>(null);

// null quando a colaboração não está configurada: o editor funciona sozinho, sem sincronizar.
export function useCollab(): CollabContextValue {
  return useContext(CollabContext);
}

type Props = {
  sessionId: string;
  userName: string;
  children: React.ReactNode;
};

const collabUrl = process.env.NEXT_PUBLIC_COLLAB_URL;

export function CollabProvider({ sessionId, userName, children }: Props) {
  const [value, setValue] = useState<CollabContextValue>(null);

  useEffect(() => {
    if (!collabUrl) return;

    const collab = createCollab({
      url: collabUrl,
      sessionId,
      user: { name: userName, color: colorFromName(userName) },
    });

    const onStatus = ({ status }: { status: CollabStatus }) => setValue({ collab, status });
    // Só depois do primeiro sync sabemos se o outro participante já escolheu uma linguagem.
    const onSynced = ({ state }: { state: boolean }) => {
      if (state) ensureDefaultLanguage(getMeta(collab.ydoc));
    };

    collab.provider.on("status", onStatus);
    collab.provider.on("synced", onSynced);
    onStatus({ status: "connecting" });

    // Sair da sala, trocar de sessão ou hot reload: fecha o WebSocket e libera o documento.
    return () => {
      collab.provider.off("status", onStatus);
      collab.provider.off("synced", onSynced);
      collab.destroy();
      setValue(null);
    };
  }, [sessionId, userName]);

  return (
    <CollabContext.Provider value={value}>
      {!collabUrl && (
        <p role="status" className="text-muted-foreground px-1 pb-2 text-xs">
          Colaboração indisponível (NEXT_PUBLIC_COLLAB_URL não configurada): o editor não sincroniza.
        </p>
      )}
      {children}
    </CollabContext.Provider>
  );
}
