const withCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const withoutCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

// Preço para exibição a partir de centavos: "R$ 100" quando é valor redondo,
// "R$ 100,50" quando tem centavos.
export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? withoutCents.format(cents / 100) : withCents.format(cents / 100);
}
