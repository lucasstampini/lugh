// Cor de cada participante na sala (cursor no editor e, no PR do quadro, ponteiro no Excalidraw).
// Derivada do nome para ser estável: a mesma pessoa tem a mesma cor ao recarregar a página.

export const PARTICIPANT_COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#ef4444",
] as const;

export function colorFromName(name: string): string {
  // Hash simples (djb2) do nome normalizado; só precisa espalhar bem entre poucas cores.
  let hash = 5381;
  for (const char of name.trim().toLowerCase()) {
    hash = ((hash << 5) + hash + char.codePointAt(0)!) | 0;
  }
  return PARTICIPANT_COLORS[Math.abs(hash) % PARTICIPANT_COLORS.length];
}
