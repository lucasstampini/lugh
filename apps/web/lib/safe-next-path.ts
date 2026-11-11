// Só aceita "next" como caminho relativo interno (começa com "/", não "//"),
// pra não virar um open redirect pra fora do site. Sem dependências de
// servidor: vale no callback de login e nos componentes do navegador.
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return fallback;
}
