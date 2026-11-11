import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import * as Y from "yjs";

import { roomNameFor } from "./session";

// Conexão colaborativa da sala (fase 1, bullet 3). Sem React de propósito: o mesmo código
// roda no navegador (CollabProvider) e no teste de integração com um Hocuspocus de verdade.
//
// Um documento Yjs por sessão (`session-<id>`), com as gavetas do PROJETO.md:
//   code (Y.Text), board (Y.Array), board-assets (Y.Map), meta (Y.Map).

export type CollabUser = { name: string; color: string };

export type CollabStatus = `${WebSocketStatus}`;

export type Collab = {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  destroy: () => void;
};

type CreateCollabOptions = {
  url: string;
  sessionId: string;
  user: CollabUser;
  // Busca o JWT que o Hocuspocus exige (POST /api/collab/token). É função, e não o token
  // pronto, porque o provider chama de novo a cada reconexão: assim ele nunca reconecta
  // com um token vencido. Se lançar erro, o provider emite `authenticationFailed`.
  token: () => Promise<string>;
};

export function createCollab({ url, sessionId, user, token }: CreateCollabOptions): Collab {
  const ydoc = new Y.Doc();
  const provider = new HocuspocusProvider({
    url,
    name: roomNameFor(sessionId),
    document: ydoc,
    token,
  });

  // O awareness é o "quem está aqui e onde": não vai para o documento, só circula entre
  // os conectados. O y-monaco lê o campo `user` para desenhar o cursor de cada um.
  provider.awareness?.setLocalStateField("user", user);

  return {
    ydoc,
    provider,
    destroy() {
      provider.destroy();
      ydoc.destroy();
    },
  };
}

export function getCode(ydoc: Y.Doc): Y.Text {
  return ydoc.getText("code");
}

export function getMeta(ydoc: Y.Doc): Y.Map<unknown> {
  return ydoc.getMap("meta");
}

// Elementos do quadro: cada item é um Y.Map { el, pos } no formato do y-excalidraw
// (el = elemento do Excalidraw, pos = índice fracionário que define a ordem das camadas).
export function getBoard(ydoc: Y.Doc): Y.Array<Y.Map<unknown>> {
  return ydoc.getArray("board");
}

// Arquivos do quadro (imagens coladas), indexados pelo id do arquivo no Excalidraw.
export function getBoardAssets(ydoc: Y.Doc): Y.Map<unknown> {
  return ydoc.getMap("board-assets");
}
