import { Star } from "lucide-react";

// Nota em estrelas (0 a 5), arredondando para a meia mais próxima. O número
// fica ao lado, no texto de quem usa; aqui o aria-label diz o valor.
export function Stars({
  value,
  size = 16,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  const label = Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");

  return (
    <span
      role="img"
      aria-label={`Nota ${label} de 5`}
      className={`flex shrink-0 items-center gap-0.5 ${className}`}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          aria-hidden="true"
          size={size}
          strokeWidth={1.6}
          className={
            rounded >= step
              ? "fill-primary stroke-ink"
              : rounded >= step - 0.5
                ? "fill-primary/50 stroke-ink"
                : "fill-card stroke-border-dashed"
          }
        />
      ))}
    </span>
  );
}
