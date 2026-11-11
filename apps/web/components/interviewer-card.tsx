import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import { initials } from "@/lib/initials";
import { AREA_OPTIONS, SENIORITY_OPTIONS } from "@/lib/interviewer-options";

const areaLabels: Record<string, string> = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);
const seniorityLabels: Record<string, string> = Object.fromEntries(
  SENIORITY_OPTIONS.map((option) => [option.value, option.label]),
);

// Linha de resultado do marketplace: foto, quem é, preço e ação.
export function InterviewerCard({
  profileId,
  name,
  headline,
  company,
  seniority,
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
  areas: string[];
  priceCents: number;
  avatarUrl: string | null;
  slots: string[];
  rating: number | null;
  reviewCount: number;
}) {
  const nextSlot = slots[0];

  return (
    <article className="edge bg-card flex h-full flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl p-4">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`Foto de ${name}`}
          width={104}
          height={104}
          className="edge size-[104px] shrink-0 rounded-xl object-cover"
          unoptimized
        />
      ) : (
        <div
          aria-hidden="true"
          className="edge bg-accent flex size-[104px] shrink-0 items-center justify-center rounded-xl font-mono text-2xl font-bold"
        >
          {initials(name)}
        </div>
      )}

      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h2 className="font-heading text-[21px] leading-[1.2] font-bold break-words">{name}</h2>
          <span className="bg-foreground text-background rounded-md px-[7px] py-0.5 font-mono text-[11px] font-bold lowercase">
            {seniorityLabels[seniority] ?? seniority}
          </span>
        </div>
        <p className="text-muted-foreground text-[15px] break-words">
          {headline} · {company}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-xs">
          {reviewCount > 0 && rating !== null ? (
            <>
              <span className="inline-flex items-center gap-1 font-bold">
                <Star aria-hidden="true" size={13} className="fill-primary" />
                <span className="sr-only">Nota </span>
                {rating.toFixed(1).replace(".", ",")}
              </span>
              <span className="text-muted-foreground">
                {reviewCount} {reviewCount === 1 ? "avaliação" : "avaliações"}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">sem avaliações ainda</span>
          )}
          {areas.slice(0, 3).map((area) => (
            <span key={area} className="edge rounded-md px-[7px] py-px lowercase">
              {areaLabels[area] ?? area}
            </span>
          ))}
          {areas.length > 3 ? (
            <span className="text-muted-foreground">+{areas.length - 3}</span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-[0_1_200px] flex-col items-start gap-2">
        <p className="font-heading text-2xl leading-none font-extrabold tabular-nums">
          {formatPrice(priceCents)}{" "}
          <span className="text-muted-foreground font-mono text-xs font-medium">/ 50 min</span>
        </p>
        {nextSlot ? (
          <span className="edge bg-primary text-ink rounded-[7px] px-2 py-0.5 font-mono text-xs font-bold lowercase">
            {nextSlot}
          </span>
        ) : (
          <span className="text-muted-foreground font-mono text-xs">sem horários abertos</span>
        )}
        <Link
          href={`/entrevistadores/${profileId}`}
          aria-label={`Ver perfil de ${name}`}
          className={buttonVariants({ variant: "outline", className: "rounded-[10px] px-4" })}
        >
          Ver perfil
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
