import * as Y from "yjs";

import { createAdminClient } from "@/lib/supabase/server";

import { getBoard, getBoardAssets, getCode, getMeta } from "./collab";
import type { LanguageId } from "./languages";
import { getLanguage } from "./meta";
import { roomNameFor } from "./session";

// Só servidor: o retrato final da sala (código e quadro), lido do documento Yjs que o
// Hocuspocus salvou em collab_documents. É o que a tela de resultado mostra.

export type SessionSnapshot = {
  code: string;
  language: LanguageId;
  // Elementos do Excalidraw, na ordem de desenho, sem os apagados. Chegam como o
  // Excalidraw gravou: quem renderiza é o próprio Excalidraw, em modo leitura.
  boardElements: unknown[];
  // Arquivos do quadro (imagens coladas), pelo id do arquivo.
  boardFiles: Record<string, unknown>;
};

// O PostgREST entrega bytea como texto hexadecimal com o prefixo \x (o mesmo formato
// que o apps/collab grava).
export function fromBytea(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value.replace(/^\\x/, ""), "hex"));
}

function isDeleted(element: unknown): boolean {
  return typeof element === "object" && element !== null && "isDeleted" in element
    ? element.isDeleted === true
    : false;
}

// Abre o estado Yjs e tira o texto do editor, a linguagem e o quadro. Devolve null se o
// estado estiver corrompido (melhor mostrar "não disponível" do que derrubar a página).
export function decodeSnapshot(state: Uint8Array): SessionSnapshot | null {
  const ydoc = new Y.Doc();
  try {
    Y.applyUpdate(ydoc, state);

    // O y-excalidraw guarda cada elemento como { pos, el }: `pos` é o índice fracionário
    // que dá a ordem de desenho (quem está na frente de quem).
    const boardElements = getBoard(ydoc)
      .toArray()
      .map((item) => ({ pos: String(item.get("pos") ?? ""), el: item.get("el") }))
      .sort((a, b) => (a.pos > b.pos ? 1 : a.pos < b.pos ? -1 : 0))
      .map((item) => item.el)
      .filter((element) => element !== undefined && !isDeleted(element));

    return {
      code: getCode(ydoc).toString(),
      language: getLanguage(getMeta(ydoc)),
      boardElements,
      boardFiles: getBoardAssets(ydoc).toJSON(),
    };
  } catch {
    return null;
  } finally {
    ydoc.destroy();
  }
}

// O retrato da sala de uma sessão. Quem chama já conferiu que o usuário participa dela:
// a leitura é com service role (collab_documents não tem policy para o client).
// Devolve null quando a sala não tem documento salvo (ninguém escreveu nem desenhou).
// Lança erro quando o banco falha.
export async function getSessionSnapshot(sessionId: string): Promise<SessionSnapshot | null> {
  const { data, error } = await createAdminClient()
    .from("collab_documents")
    .select("state")
    .eq("name", roomNameFor(sessionId))
    .maybeSingle();

  if (error) throw new Error(`Falha ao ler o documento da sessão: ${error.message}`);
  if (typeof data?.state !== "string") return null;

  return decodeSnapshot(fromBytea(data.state));
}
