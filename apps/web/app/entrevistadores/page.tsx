import { Search } from "lucide-react";
import Link from "next/link";
import { CodeAccent, CodeBlock, CodeMuted } from "@/components/code-block";
import { Eyebrow } from "@/components/eyebrow";
import { InterviewerCard } from "@/components/interviewer-card";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { upcomingSlots } from "@/lib/availability";
import { AREA_OPTIONS, SENIORITY_OPTIONS } from "@/lib/interviewer-options";
import { createClient } from "@/lib/supabase/server";

const CHIP =
  "edge inline-flex min-h-11 items-center rounded-[9px] px-3.5 text-sm font-semibold aria-[current=true]:bg-foreground aria-[current=true]:text-background";

export const instant = false;

export default async function EntrevistadoresPage({
  searchParams,
}: PageProps<"/entrevistadores">) {
  const params = await searchParams;
  const area = typeof params.area === "string" ? params.area : undefined;
  const senioridade =
    typeof params.senioridade === "string" ? params.senioridade : undefined;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const sort = typeof params.sort === "string" ? params.sort : "recentes";

  const supabase = await createClient();
  let query = supabase
    .from("interviewers")
    .select("profile_id, headline, company, seniority, areas, price_cents, bio")
    .eq("active", true)
    .eq("paused", false);

  if (area) {
    query = query.contains("areas", [area]);
  }
  if (senioridade) {
    query = query.eq("seniority", senioridade);
  }

  query =
    sort === "preco"
      ? query.order("price_cents", { ascending: true })
      : query.order("created_at", { ascending: false });

  const { data: interviewers, error } = await query;

  // profiles tem RLS "cada um só lê a própria linha": nome/avatar público de
  // entrevistador vem da view interviewer_profiles (só essas duas colunas,
  // nunca email), buscada à parte porque o PostgREST não embeda views.
  const profileIds = interviewers?.map((i) => i.profile_id) ?? [];
  const [{ data: profiles }, { data: availability }, { data: ratings }] = profileIds.length
    ? await Promise.all([
        supabase
          .from("interviewer_profiles")
          .select("id, name, avatar_url")
          .in("id", profileIds),
        supabase
          .from("availability")
          .select("interviewer_id, weekday, start_time")
          .in("interviewer_id", profileIds),
        supabase.rpc("interviewer_ratings", { interviewer_ids: profileIds }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const blocksByInterviewer = new Map<string, { weekday: number; start_time: string }[]>();
  for (const block of availability ?? []) {
    const list = blocksByInterviewer.get(block.interviewer_id) ?? [];
    list.push({ weekday: block.weekday, start_time: block.start_time });
    blocksByInterviewer.set(block.interviewer_id, list);
  }
  const ratingByInterviewer = new Map(
    (ratings ?? []).map((r) => [r.interviewer_id, { average: r.average, reviewCount: r.review_count }]),
  );

  const results = (interviewers ?? [])
    .map((interviewer) => ({
      interviewer,
      profile: profileById.get(interviewer.profile_id),
      rating: ratingByInterviewer.get(interviewer.profile_id) ?? null,
      slots: upcomingSlots(
        blocksByInterviewer.get(interviewer.profile_id) ?? [],
        3,
      ),
    }))
    .filter(({ interviewer, profile }) => {
      if (!q) {
        return true;
      }
      const needle = q.toLowerCase();
      return (
        (profile?.name ?? "").toLowerCase().includes(needle) ||
        interviewer.headline.toLowerCase().includes(needle) ||
        interviewer.company.toLowerCase().includes(needle)
      );
    });

  const hasFilters = Boolean(area || senioridade || q);

  // Monta o link de um filtro preservando os outros parâmetros da busca.
  function hrefWith(overrides: { area?: string | null; senioridade?: string | null }) {
    const next = new URLSearchParams();
    const nextArea = overrides.area === undefined ? area : overrides.area;
    const nextSeniority =
      overrides.senioridade === undefined ? senioridade : overrides.senioridade;
    if (q) next.set("q", q);
    if (nextArea) next.set("area", nextArea);
    if (nextSeniority) next.set("senioridade", nextSeniority);
    if (sort !== "recentes") next.set("sort", sort);
    const queryString = next.toString();
    return queryString ? `/entrevistadores?${queryString}` : "/entrevistadores";
  }

  // A mesma busca, escrita como requisição: é o que aparece no bloco de terminal.
  const currentQuery = hrefWith({}).replace("/entrevistadores", "");
  const seniorityLabel = SENIORITY_OPTIONS.find((option) => option.value === senioridade)?.label;
  const areaLabel = AREA_OPTIONS.find((option) => option.value === area)?.label;
  const activeSummary = [
    areaLabel ? `área: ${areaLabel.toLowerCase()}` : null,
    seniorityLabel ? `experiência: ${seniorityLabel.toLowerCase()}` : null,
    q ? `busca: ${q}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main>
        <section className="edge-b bg-secondary">
          <div className="mx-auto box-border flex max-w-[1240px] flex-wrap items-end justify-between gap-x-12 gap-y-6 px-[clamp(20px,5vw,48px)] py-[clamp(28px,4vw,48px)]">
            <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2.5">
              <Eyebrow>marketplace</Eyebrow>
              <h1 className="font-heading text-[clamp(32px,3.6vw,48px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
                Entrevistadores
              </h1>
              <p className="text-muted-foreground max-w-[52ch]">
                Profissionais de tecnologia que fazem entrevistas simuladas de 1 hora. Cada um
                define o próprio preço.
              </p>
            </div>

            <form
              id="filtros-entrevistadores"
              method="GET"
              role="search"
              className="flex max-w-[520px] min-w-0 flex-[1_1_360px] flex-col gap-2"
            >
              <label htmlFor="q" className="text-sm font-bold">
                Buscar por nome, cargo ou empresa
              </label>
              {area ? <input type="hidden" name="area" value={area} /> : null}
              {senioridade ? <input type="hidden" name="senioridade" value={senioridade} /> : null}
              <div className="flex gap-2">
                <div className="edge bg-card focus-within:outline-ring flex min-w-0 flex-1 items-center gap-2.5 rounded-[10px] px-3.5 focus-within:outline-[3px] focus-within:outline-offset-[3px]">
                  <Search aria-hidden="true" size={18} strokeWidth={2.2} className="shrink-0" />
                  <input
                    id="q"
                    name="q"
                    type="search"
                    defaultValue={q}
                    placeholder="Engenheira, fintech, plataforma"
                    className="placeholder:text-muted-foreground h-12 min-w-0 flex-1 bg-transparent outline-none"
                  />
                </div>
                <Button type="submit" variant="ink" className="h-12 rounded-[10px] px-5">
                  Buscar
                </Button>
              </div>
            </form>
          </div>
        </section>

        <div className="mx-auto box-border flex max-w-[1240px] flex-wrap items-start gap-x-10 gap-y-7 px-[clamp(20px,5vw,48px)] pt-[clamp(24px,3vw,40px)] pb-16">
          <aside
            aria-label="Filtros"
            className="flex max-w-full min-w-0 flex-[1_1_220px] flex-col gap-6 md:max-w-[280px]"
          >
            <nav aria-label="Área" className="flex flex-col gap-2.5">
              <p className="font-extrabold">Área</p>
              <div className="flex flex-wrap gap-2">
                <Link href={hrefWith({ area: null })} aria-current={area ? undefined : "true"} className={CHIP}>
                  Todas
                </Link>
                {AREA_OPTIONS.map((option) => (
                  <Link
                    key={option.value}
                    href={hrefWith({ area: option.value })}
                    aria-current={area === option.value ? "true" : undefined}
                    className={CHIP}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </nav>

            <nav aria-label="Experiência" className="flex flex-col gap-2.5">
              <p className="font-extrabold">Experiência</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={hrefWith({ senioridade: null })}
                  aria-current={senioridade ? undefined : "true"}
                  className={CHIP}
                >
                  Todas
                </Link>
                {SENIORITY_OPTIONS.map((option) => (
                  <Link
                    key={option.value}
                    href={hrefWith({ senioridade: option.value })}
                    aria-current={senioridade === option.value ? "true" : undefined}
                    className={CHIP}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </nav>

            <CodeBlock className="text-xs leading-[1.6] [overflow-wrap:anywhere] whitespace-normal">
              <CodeMuted>GET</CodeMuted> /entrevistadores
              <CodeAccent>{currentQuery}</CodeAccent>
            </CodeBlock>

            {hasFilters ? (
              <Link
                href="/entrevistadores"
                className="text-brand-deep inline-flex min-h-11 items-center self-start font-bold underline"
              >
                Limpar filtros
              </Link>
            ) : null}
          </aside>

          <section aria-label="Resultados" className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
            {error ? (
              <div
                role="alert"
                className="edge flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]"
              >
                <CodeBlock>
                  <div>
                    <CodeMuted>GET</CodeMuted> /entrevistadores
                  </div>
                  <div className="text-destructive-soft">erro: sem resposta do servidor</div>
                </CodeBlock>
                <h2 className="font-heading text-[26px] leading-tight font-bold">
                  Não deu para carregar os entrevistadores
                </h2>
                <p className="text-muted-foreground max-w-[52ch]">
                  O problema é do nosso lado. Tente de novo em alguns segundos.
                </p>
                <Link href={hrefWith({})} className={buttonVariants({ className: "h-12 rounded-[10px] px-5" })}>
                  Tentar de novo
                </Link>
              </div>
            ) : results.length === 0 ? (
              <div className="edge-dashed flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]">
                <CodeBlock>
                  <div>
                    <CodeMuted>GET</CodeMuted> /entrevistadores{currentQuery}
                  </div>
                  <CodeAccent>0 resultados</CodeAccent>
                </CodeBlock>
                <h2 className="font-heading text-[26px] leading-tight font-bold">
                  {hasFilters
                    ? "Nenhum entrevistador com esses filtros"
                    : "Ainda não há entrevistadores disponíveis"}
                </h2>
                <p className="text-muted-foreground max-w-[52ch]">
                  {hasFilters
                    ? "Tire um filtro ou busque por outro termo."
                    : "Os primeiros perfis estão chegando. Volte em breve."}
                </p>
                {hasFilters ? (
                  <Link
                    href="/entrevistadores"
                    className={buttonVariants({ className: "h-12 rounded-[10px] px-5" })}
                  >
                    Limpar filtros
                  </Link>
                ) : null}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
                  <p className="font-extrabold">
                    {results.length} {results.length === 1 ? "entrevistador" : "entrevistadores"}{" "}
                    {activeSummary ? (
                      <span className="text-muted-foreground font-mono text-[13px] font-medium">
                        {activeSummary}
                      </span>
                    ) : null}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <label htmlFor="sort" className="text-sm font-bold">
                      Ordenar por
                    </label>
                    <select
                      id="sort"
                      name="sort"
                      form="filtros-entrevistadores"
                      defaultValue={sort}
                      className="edge bg-card h-11 rounded-[9px] px-3 text-sm font-semibold"
                    >
                      <option value="recentes">Mais recentes</option>
                      <option value="preco">Menor preço</option>
                    </select>
                    <Button
                      type="submit"
                      form="filtros-entrevistadores"
                      variant="outline"
                      className="rounded-[9px] px-3.5 text-sm"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>

                <ul className="flex flex-col gap-4">
                  {results.map(({ interviewer, profile, rating, slots }, index) => (
                    <li
                      key={interviewer.profile_id}
                      className="pop lift"
                      style={{ animationDelay: `${Math.min(index, 7) * 0.08}s` }}
                    >
                      <InterviewerCard
                        profileId={interviewer.profile_id}
                        name={profile?.name ?? ""}
                        headline={interviewer.headline}
                        company={interviewer.company}
                        seniority={interviewer.seniority}
                        areas={interviewer.areas}
                        priceCents={interviewer.price_cents}
                        avatarUrl={profile?.avatar_url ?? null}
                        slots={slots}
                        rating={rating?.average ?? null}
                        reviewCount={rating?.reviewCount ?? 0}
                      />
                    </li>
                  ))}
                </ul>

                {/* Paginação: ainda não existe no backend, a lista vem inteira. */}
                <nav
                  aria-label="Paginação"
                  className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm font-bold"
                >
                  <span
                    aria-current="page"
                    className="bg-foreground text-background edge inline-flex size-11 items-center justify-center rounded-[9px]"
                  >
                    1
                  </span>
                  <span
                    aria-disabled="true"
                    className="border-border-dashed text-muted-foreground inline-flex min-h-11 items-center rounded-[9px] border-[1.5px] border-dashed px-3.5"
                  >
                    Próxima
                  </span>
                  <span className="text-muted-foreground ml-1 text-xs font-medium">
                    horários de Brasília
                  </span>
                </nav>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
