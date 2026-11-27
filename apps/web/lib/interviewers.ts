import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type AvailabilityBlock,
  type BookedRange,
  bookingWindow,
  computeAllWeeks,
  upcomingSlotLabels,
} from "@/lib/slots";
import type { Database } from "@/lib/supabase/database.types";

export type ListedInterviewer = {
  interviewer: {
    profile_id: string;
    headline: string;
    company: string;
    seniority: string;
    areas: string[];
    price_cents: number;
    bio: string | null;
  };
  profile: { id: string | null; name: string | null; avatar_url: string | null } | undefined;
  rating: { average: number | null; reviewCount: number } | null;
  // Próximos horários livres, já formatados para o card.
  slots: string[];
  // Início do primeiro horário livre (ISO), ou null sem horário na janela de agendamento.
  nextSlotAt: string | null;
};

// Entrevistadores visíveis no marketplace (ativos e não pausados), com nome, nota e
// próximos horários livres. Usado pela listagem e pela tela de matches do onboarding.
export async function listInterviewers(
  supabase: SupabaseClient<Database>,
  {
    area,
    seniority,
    sort = "recentes",
    now = new Date(),
  }: { area?: string; seniority?: string; sort?: string; now?: Date } = {},
): Promise<{ items: ListedInterviewer[]; error: boolean }> {
  let query = supabase
    .from("interviewers")
    .select("profile_id, headline, company, seniority, areas, price_cents, bio")
    .eq("active", true)
    .eq("paused", false);

  if (area) {
    query = query.contains("areas", [area]);
  }
  if (seniority) {
    query = query.eq("seniority", seniority);
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
  const { from, to } = bookingWindow(now);
  const [{ data: profiles }, { data: availability }, { data: ratings }, { data: booked }] =
    profileIds.length
      ? await Promise.all([
          supabase
            .from("interviewer_profiles")
            .select("id, name, avatar_url")
            .in("id", profileIds),
          supabase
            .from("availability")
            .select("interviewer_id, weekday, start_time, end_time")
            .in("interviewer_id", profileIds),
          supabase.rpc("interviewer_ratings", { interviewer_ids: profileIds }),
          // Sessões já marcadas, para os horários do card serem só os que
          // ainda dá para agendar.
          supabase.rpc("interviewers_booked_slots", {
            interviewer_ids: profileIds,
            from_ts: from.toISOString(),
            to_ts: to.toISOString(),
          }),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const blocksByInterviewer = new Map<string, AvailabilityBlock[]>();
  for (const block of availability ?? []) {
    const list = blocksByInterviewer.get(block.interviewer_id) ?? [];
    list.push({
      weekday: block.weekday,
      start_time: block.start_time,
      end_time: block.end_time,
    });
    blocksByInterviewer.set(block.interviewer_id, list);
  }
  const bookedByInterviewer = new Map<string, BookedRange[]>();
  for (const range of booked ?? []) {
    const list = bookedByInterviewer.get(range.interviewer_id) ?? [];
    list.push({ starts_at: range.starts_at, ends_at: range.ends_at });
    bookedByInterviewer.set(range.interviewer_id, list);
  }
  const ratingByInterviewer = new Map(
    (ratings ?? []).map((r) => [r.interviewer_id, { average: r.average, reviewCount: r.review_count }]),
  );

  const items = (interviewers ?? []).map((interviewer) => {
    const weeks = computeAllWeeks({
      blocks: blocksByInterviewer.get(interviewer.profile_id) ?? [],
      booked: bookedByInterviewer.get(interviewer.profile_id) ?? [],
      now,
    });
    const starts = weeks.flatMap((week) => week.flatMap((day) => day.slots.map((slot) => slot.startsAt)));
    return {
      interviewer,
      profile: profileById.get(interviewer.profile_id),
      rating: ratingByInterviewer.get(interviewer.profile_id) ?? null,
      slots: upcomingSlotLabels(weeks, 3),
      nextSlotAt: starts.length ? starts.reduce((first, start) => (start < first ? start : first)) : null,
    };
  });

  return { items, error: Boolean(error) };
}
