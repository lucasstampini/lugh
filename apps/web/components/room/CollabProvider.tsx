"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { colorFromName } from "@/lib/room/colors";
import { createCollab, getMeta, type Collab, type CollabStatus } from "@/lib/room/collab";
import { ensureDefaultLanguage } from "@/lib/room/meta";

// Uma conexão colaborativa por sala, compartilhada por editor e quadro:
// o mesmo documento Yjs e o mesmo WebSocket com o Hocuspocus.

// `denied`: o servidor recusou o token (sessão encerrada, fora do horário, sem acesso).
type CollabContextValue = { collab: Collab; status: CollabStatus; denied: boolean } | null;

const CollabContext = createContext<CollabContextValue>(null);

// null quando a colaboração não está configurada: o editor funciona sozinho, sem sincronizar.
export function useCollab(): CollabContextValue {
  return useContext(CollabContext);
}

type Props = {
  sessionId: string;
  userName: string;
  // Só a sala de teste manda o nome para o servidor; na sessão real ele vem do perfil.
  sendName: boolean;
  children: React.ReactNode;
};

const collabUrl = process.env.NEXT_PUBLIC_COLLAB_URL;

async function fetchCollabToken(sessionId: string, name: string | undefined): Promise<string> {
  const response = await fetch("/api/collab/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, name }),
  });
  const body: { token?: string; error?: string } = await response.json();
  if (!response.ok || !body.token) {
    throw new Error(body.error ?? "Sem acesso ao documento da sessão");
  }
  return body.token;
}

export function CollabProvider({ sessionId, userName, sendName, children }: Props) {
  const [value, setValue] = useState<CollabContextValue>(null);

  useEffect(() => {
    if (!collabUrl) return;

    const collab = createCollab({
      url: collabUrl,
      sessionId,
      user: { name: userName, color: colorFromName(userName) },
      token: () => fetchCollabToken(sessionId, sendName ? userName : undefined),
    });

    let denied = false;
    const onStatus = ({ status }: { status: CollabStatus }) => setValue({ collab, status, denied });
    const onDenied = () => {
      denied = true;
      setValue((current) => (current ? { ...current, denied } : current));
    };
    const onAuthenticated = () => {
      denied = false;
      setValue((current) => (current ? { ...current, denied } : current));
    };
    // Só depois do primeiro sync sabemos se o outro participante já escolheu uma linguagem.
    const onSynced = ({ state }: { state: boolean }) => {
      if (state) ensureDefaultLanguage(getMeta(collab.ydoc));
    };

    collab.provider.on("status", onStatus);
    collab.provider.on("synced", onSynced);
    collab.provider.on("authenticationFailed", onDenied);
    collab.provider.on("authenticated", onAuthenticated);
    onStatus({ status: "connecting" });

    // Sair da sala, trocar de sessão ou hot reload: fecha o WebSocket e libera o documento.
    return () => {
      collab.provider.off("status", onStatus);
      collab.provider.off("synced", onSynced);
      collab.provider.off("authenticationFailed", onDenied);
      collab.provider.off("authenticated", onAuthenticated);
      collab.destroy();
      setValue(null);
    };
  }, [sessionId, userName, sendName]);

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
