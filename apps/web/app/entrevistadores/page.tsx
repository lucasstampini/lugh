import { ArrowRight, Compass, Search } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { InterviewerCard } from "@/components/interviewer-card";
import { FadeIn } from "@/components/motion/fade-in";
import { HoverLift } from "@/components/motion/hover-lift";
import { AREA_OPTIONS, SENIORITY_OPTIONS } from "@/lib/interviewer-options";
import { upcomingSlots } from "@/lib/availability";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero Índigo de largura total (Figma node 3:4779). */}
      <section className="bg-primary text-primary-foreground">
        <FadeIn className="mx-auto flex max-w-[1312px] flex-col gap-4 px-6 py-14 lg:px-0">
          <span className="text-[11px] font-extrabold tracking-[0.1em] uppercase opacity-80">
            Encontre quem vai treinar com você
          </span>
          <h1 className="font-heading text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            Seu próximo passo tem companhia.
          </h1>
          <p className="max-w-prose text-lg opacity-90">
            Escolha alguém que conhece os desafios da área em que você quer
            entrar.
          </p>
        </FadeIn>
      </section>

      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-8 px-6 py-10">
        <FadeIn
          index={1}
          className="border-border bg-card flex flex-col gap-5 rounded-[20px] border p-6"
        >
          <form
            id="filtros-entrevistadores"
            method="GET"
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  size={16}
                  className="text-muted-foreground absolute top-1/2 left-3.5 -translate-y-1/2"
                />
                <input
                  id="q"
                  name="q"
                  type="text"
                  defaultValue={q}
                  placeholder="Busque por nome, área ou especialidade"
                  className="border-input bg-background h-[52px] w-full rounded-xl border pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="bg-primary text-primary-foreground flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold"
              >
                Buscar profissionais
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="area" className="text-xs font-bold">
                  Área
                </label>
                <select
                  id="area"
                  name="area"
                  defaultValue={area ?? ""}
                  className="border-input bg-background h-11 rounded-xl border px-3 text-sm"
                >
                  <option value="">Todas as áreas</option>
                  {AREA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="senioridade" className="text-xs font-bold">
                  Senioridade
                </label>
                <select
                  id="senioridade"
                  name="senioridade"
                  defaultValue={senioridade ?? ""}
                  className="border-input bg-background h-11 rounded-xl border px-3 text-sm"
                >
                  <option value="">Todas as senioridades</option>
                  {SENIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasFilters ? (
              <Link
                href="/entrevistadores"
                className="text-primary w-fit text-sm font-semibold"
              >
                Limpar filtros
              </Link>
            ) : null}
          </form>
        </FadeIn>

        {error ? (
          <p className="text-destructive text-sm">
            Não deu para carregar os entrevistadores agora. Tente de novo.
          </p>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-heading text-xl font-bold">
              Nenhum profissional encontrado
            </p>
            {hasFilters ? (
              <Link href="/entrevistadores" className="text-primary text-sm">
                Limpar filtros
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-2xl font-extrabold tracking-[-0.02em]">
                  {results.length}{" "}
                  {results.length === 1
                    ? "profissional para abrir caminhos"
                    : "profissionais para abrir caminhos"}
                </h2>
                <p className="text-foreground/70 text-sm">
                  Sessões individuais de 60 min, pague só pela que marcar.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="sort" className="text-muted-foreground">
                  Ordenar por:
                </label>
                <select
                  id="sort"
                  name="sort"
                  form="filtros-entrevistadores"
                  defaultValue={sort}
                  className="border-input bg-background h-9 rounded-lg border px-2.5 text-sm font-semibold"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="preco">Menor preço</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(({ interviewer, profile, rating, slots }, index) => (
                <FadeIn key={interviewer.profile_id} index={index}>
                  <HoverLift className="h-full">
                    <InterviewerCard
                      profileId={interviewer.profile_id}
                      name={profile?.name ?? ""}
                      headline={interviewer.headline}
                      company={interviewer.company}
                      seniority={interviewer.seniority}
                      bio={interviewer.bio}
                      areas={interviewer.areas}
                      priceCents={interviewer.price_cents}
                      avatarUrl={profile?.avatar_url ?? null}
                      slots={slots}
                      rating={rating?.average ?? null}
                      reviewCount={rating?.reviewCount ?? 0}
                    />
                  </HoverLift>
                </FadeIn>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                Mostrando {results.length} de {results.length}{" "}
                {results.length === 1 ? "profissional" : "profissionais"} ·
                Horários de Brasília
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="border-border bg-card flex h-10 items-center rounded-xl border px-4 text-sm font-semibold opacity-40"
                >
                  Anterior
                </button>
                <span className="bg-lume text-lume-foreground flex size-10 items-center justify-center rounded-xl text-sm font-bold">
                  1
                </span>
                <button
                  type="button"
                  disabled
                  className="border-border bg-card flex h-10 items-center rounded-xl border px-4 text-sm font-semibold opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}

        <div className="bg-secondary border-lume flex flex-wrap items-center gap-4 rounded-xl border-l-4 p-5">
          <Compass aria-hidden="true" size={24} className="text-lume shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-sm font-bold">Ainda não sabe por onde começar?</p>
            <p className="text-foreground/70 text-sm">
              Para a primeira vaga, uma entrevista comportamental ajuda você
              a contar sua história.
            </p>
          </div>
          <Link
            href="/entrevistadores?area=behavioral"
            className="bg-primary text-primary-foreground flex h-10 shrink-0 items-center rounded-xl px-4 text-sm font-bold"
          >
            Ver esse tipo de treino
          </Link>
        </div>

        <p className="text-muted-foreground text-xs">
          Perfis e avaliações ilustrativos nesta demonstração.
        </p>
      </div>

      <footer className="border-border bg-card flex flex-wrap items-center justify-between gap-2 border-t px-6 py-5 lg:px-16">
        <span className="text-muted-foreground text-xs">
          lugh / Seu próximo passo começa no treino.
        </span>
        <span className="text-muted-foreground text-xs">
          Precisa de uma mão? Fale com a gente
        </span>
      </footer>
    </main>
  );
}
