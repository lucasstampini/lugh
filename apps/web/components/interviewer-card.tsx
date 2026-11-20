import { Building2, CalendarDays, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format-price";
import { initials } from "@/lib/initials";
import { AREA_OPTIONS, SENIORITY_OPTIONS } from "@/lib/interviewer-options";

const areaLabels = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);
const seniorityLabels = Object.fromEntries(
  SENIORITY_OPTIONS.map((option) => [option.value, option.label]),
);

// Nota do entrevistador em estrelas, arredondando para a meia mais próxima.
function Rating({ value, count }: { value: number | null; count: number }) {
  if (count === 0 || value === null) {
    return (
      <span className="text-muted-foreground font-mono text-[11px]">sem avaliações ainda</span>
    );
  }

  const rounded = Math.round(value * 2) / 2;

  return (
    <span className="flex items-center gap-1.5">
      <span
        role="img"
        aria-label={`Nota ${value.toFixed(1).replace(".", ",")} de 5`}
        className="flex items-center gap-0.5"
      >
        {[1, 2, 3, 4, 5].map((step) => (
          <Star
            key={step}
            aria-hidden="true"
            size={13}
            strokeWidth={1.6}
            className={
              rounded >= step
                ? "fill-primary stroke-ink"
                : rounded >= step - 0.5
                  ? "fill-primary/50 stroke-ink"
                  : "fill-card stroke-border-soft"
            }
          />
        ))}
      </span>
      <span className="text-ink text-xs font-bold tabular-nums">
        {value.toFixed(1).replace(".", ",")}
      </span>
      <span className="text-muted-foreground text-xs">
        ({count})
      </span>
    </span>
  );
}

export function InterviewerCard({
  profileId,
  name,
  headline,
  company,
  seniority,
  bio,
  areas,
  priceCents,
  avatarUrl,
  slots,
  rating,
  reviewCount,
}: {
  profileId: string;
  name: string;
  headline: string;
  company: string;
  seniority: string;
  bio: string | null;
  areas: string[];
  priceCents: number;
  avatarUrl: string | null;
  slots: string[];
  rating: number | null;
  reviewCount: number;
}) {
  return (
    <Link
      href={`/entrevistadores/${profileId}`}
      className="border-border-soft bg-card hover:border-brand-deep hover:shadow-[0_8px_0_-2px_var(--accent)] flex h-full flex-col gap-3.5 rounded-[20px] border border-l-4 border-l-brand-deep p-6 transition-[color,border-color,box-shadow]"
    >
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={56}
            height={56}
            className="ring-accent size-14 shrink-0 rounded-full object-cover ring-2"
            unoptimized
          />
        ) : (
          <div className="bg-brand-deep font-heading flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white">
            {initials(name)}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate font-bold">{name}</h3>
          <Rating value={rating} count={reviewCount} />
          <p className="text-muted-foreground truncate text-sm">{headline}</p>
          <div className="flex min-w-0 items-center gap-2">
            <span className="bg-foreground text-background shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.02em] uppercase">
              {seniorityLabels[seniority] ?? seniority}
            </span>
            <span className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs">
              <Building2 aria-hidden="true" size={13} className="shrink-0" />
              <span className="truncate">{company}</span>
            </span>
          </div>
        </div>
      </div>

      {bio ? (
        <p className="text-muted-foreground line-clamp-2 text-sm">{bio}</p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {areas.map((area) => (
          <span
            key={area}
            className="bg-accent text-ink rounded-full px-2.5 py-1 text-xs font-semibold"
          >
            {areaLabels[area] ?? area}
          </span>
        ))}
      </div>

      {slots.length > 0 ? (
        <div className="border-border-soft mt-auto flex flex-col gap-2 border-t pt-4">
          <p className="text-muted-foreground text-xs font-bold tracking-[0.04em] uppercase">
            Próximos horários
          </p>
          <div className="flex flex-wrap gap-1.5">
            {slots.map((slot) => (
              <span
                key={slot}
                className="border-border-soft text-ink flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-xs font-semibold"
              >
                <CalendarDays aria-hidden="true" size={12} />
                {slot}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground border-border-soft mt-auto border-t pt-4 text-xs">
          Sem horário livre nos próximos 14 dias.
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">por sessão</span>
        <span className="bg-primary text-ink font-heading rounded-full px-3.5 py-1.5 text-lg font-extrabold tabular-nums">
          {formatPrice(priceCents)}
        </span>
      </div>
    </Link>
  );
}
