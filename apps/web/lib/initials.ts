// Iniciais para o avatar de quem não tem foto: primeira letra do primeiro e do
// último nome ("João Conceição" vira "JC"). Nome vazio vira "?".
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last || "?").toUpperCase();
}
