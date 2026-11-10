import { Building2, CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AREA_OPTIONS, SENIORITY_OPTIONS } from "@/lib/interviewer-options";
import { getPlaceholderRating } from "@/lib/placeholder-rating";

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const areaLabels = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);
const seniorityLabels = Object.fromEntries(
  SENIORITY_OPTIONS.map((option) => [option.value, option.label]),
);

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
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
}) {
  const { rating, reviewCount } = getPlaceholderRating(profileId);

  return (
    <Link
      href={`/entrevistadores/${profileId}`}
      className="border-border bg-card hover:border-primary flex h-full flex-col gap-4 rounded-[20px] border border-l-4 border-l-primary p-6 transition-colors"
    >
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={56}
            height={56}
            className="ring-secondary rounded-full ring-2"
            unoptimized
          />
        ) : (
          <div className="bg-secondary text-primary ring-secondary flex size-14 shrink-0 items-center justify-center rounded-full font-heading text-lg font-bold ring-2 ring-offset-2">
            {initials(name)}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-bold">{name}</p>
            <span className="text-muted-foreground flex shrink-0 items-center gap-0.5 text-xs">
              <span className="text-lume">★</span>
              {rating} · {reviewCount}
            </span>
          </div>
          <p className="text-muted-foreground truncate text-sm">{headline}</p>
          <div className="flex min-w-0 items-center gap-2">
            <span className="bg-secondary text-primary shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.02em] uppercase">
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
            className="bg-secondary text-primary rounded-full px-2.5 py-1 text-xs font-semibold"
          >
            {areaLabels[area] ?? area}
          </span>
        ))}
      </div>

      {slots.length > 0 ? (
        <div className="border-border mt-auto flex flex-col gap-2 border-t pt-4">
          <p className="text-muted-foreground text-xs font-bold tracking-[0.04em] uppercase">
            Próximos horários
          </p>
          <div className="flex flex-wrap gap-1.5">
            {slots.map((slot) => (
              <span
                key={slot}
                className="text-primary bg-secondary flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              >
                <CalendarDays aria-hidden="true" size={12} />
                {slot}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={`flex items-center justify-between ${
          slots.length > 0 ? "" : "border-border mt-auto border-t pt-4"
        }`}
      >
        <span className="text-muted-foreground text-xs">por sessão</span>
        <span className="bg-secondary text-primary font-heading rounded-full px-3.5 py-1.5 text-lg font-extrabold tabular-nums">
          {priceFormatter.format(priceCents / 100)}
        </span>
      </div>
    </Link>
  );
}
