// Barra de nota (0 a max): trilho com borda de tinta e preenchimento verde.
// O número fica ao lado, no texto: a barra sozinha não diz o valor.
export function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const percent = Math.min(Math.max(score / max, 0), 1) * 100;

  return (
    <div aria-hidden="true" className="edge bg-secondary h-3 overflow-hidden rounded-full">
      {percent > 0 ? (
        <div
          className="bar-grow bg-primary border-border h-full border-r-[1.5px]"
          style={{ width: `${percent}%` }}
        />
      ) : null}
    </div>
  );
}
