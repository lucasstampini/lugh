// Cor de cada participante na sala (cursor no editor e ponteiro no quadro).
// Derivada do nome para ser estável: a mesma pessoa tem a mesma cor ao recarregar a página.
//
// A paleta é a da identidade, toda em tons claros que aparecem bem no fundo escuro da
// sala. Por isso o texto das etiquetas sobre essas cores é sempre Tinta (cursor-styles.ts).
// Enquanto a sala não sabe o papel de cada um (fase 5), não dá para fixar "entrevistador
// em verde, candidato em branco" como no DESIGN.md: a cor vem do nome.

export const PARTICIPANT_COLORS = [
  "#2EF58A",
  "#FFFFFF",
  "#FEEDBA",
  "#FFB4A6",
  "#8FE9B7",
  "#A9BDB2",
] as const;

export function colorFromName(name: string): string {
  // Hash simples (djb2) do nome normalizado; só precisa espalhar bem entre poucas cores.
  let hash = 5381;
  for (const char of name.trim().toLowerCase()) {
    hash = ((hash << 5) + hash + char.codePointAt(0)!) | 0;
  }
  return PARTICIPANT_COLORS[Math.abs(hash) % PARTICIPANT_COLORS.length];
}
