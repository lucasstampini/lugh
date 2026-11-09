import { NAME_MAX_LENGTH } from "./session";

// CSS dos cursores remotos no editor (fase 1, bullet 3).
//
// O y-monaco marca a seleção de cada participante com as classes
// `yRemoteSelection-<clientId>` (fundo da seleção) e `yRemoteSelectionHead-<clientId>`
// (o cursor), mas não define cor nenhuma. Geramos o CSS a partir do awareness.
//
// Nome e cor chegam de outro navegador, então são tratados como entrada não confiável:
// a cor só passa se for hexadecimal e o nome é escapado, para ninguém injetar CSS.

export type RemoteCursor = { clientId: number; name: unknown; color: unknown };

const FALLBACK_COLOR = "#64748b";
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function safeColor(color: unknown): string {
  return typeof color === "string" && HEX_COLOR.test(color) ? color : FALLBACK_COLOR;
}

// Escapa para dentro de uma string CSS (`content: "..."`): tudo que não é letra, número
// ou espaço vira escape hexadecimal (`\22 ` para aspas), então não há como fechar a string.
export function cssStringEscape(value: string): string {
  return Array.from(value)
    .map((char) => (/^[\p{L}\p{N} ]$/u.test(char) ? char : `\\${char.codePointAt(0)!.toString(16)} `))
    .join("");
}

function safeName(name: unknown): string {
  const text = typeof name === "string" ? name.trim() : "";
  return text.slice(0, NAME_MAX_LENGTH) || "Participante";
}

export function remoteCursorCss(cursors: RemoteCursor[]): string {
  return cursors
    .filter((cursor) => Number.isInteger(cursor.clientId))
    .map(({ clientId, name, color }) => {
      const hex = safeColor(color);
      return `
.yRemoteSelection-${clientId} { background-color: ${hex}40; }
.yRemoteSelectionHead-${clientId} { position: absolute; height: 100%; box-sizing: border-box; border-left: 2px solid ${hex}; }
.yRemoteSelectionHead-${clientId}::after { content: "${cssStringEscape(safeName(name))}"; position: absolute; top: -1.3em; left: -2px; z-index: 10; padding: 0 4px; border-radius: 3px; background-color: ${hex}; color: #fff; font-size: 11px; line-height: 1.3em; white-space: nowrap; pointer-events: none; }`;
    })
    .join("\n");
}
