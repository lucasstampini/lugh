export function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, index) => (
        <span
          key={index}
          className={`h-1.5 flex-1 rounded-full ${
            index < score ? "bg-primary" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}
