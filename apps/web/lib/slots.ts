import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

// Horários livres de um entrevistador: blocos semanais de disponibilidade
// menos as sessões já marcadas, em slots de 1h. As mesmas regras valem na
// tela e na Server Action que cria a sessão.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Brasília é UTC-3 o ano todo (o horário de verão acabou em 2019). Toda a
// conversão entre data de Brasília e UTC passa pelas funções deste arquivo.
const SAO_PAULO_OFFSET_HOURS = 3;

export const DAYS_PER_WEEK_PAGE = 7;
// Dá para agendar de hoje até 14 dias à frente, em duas páginas de 7 dias.
export const BOOKING_WEEKS = 2;
// Ninguém agenda em cima da hora: o entrevistador precisa de tempo para ver.
export const MIN_LEAD_HOURS = 2;

export const NOTES_MAX_LENGTH = 500;

export const SESSION_TYPES = ["coding", "system_design", "behavioral"] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export type AvailabilityBlock = { weekday: number; start_time: string; end_time: string };
export type BookedRange = { starts_at: string; ends_at: string };

export type FreeSlot = {
  // Início em UTC (ISO). É o valor que vai e volta do formulário.
  startsAt: string;
  // Hora cheia em Brasília, de 0 a 23.
  hour: number;
};

export type SlotDay = {
  // Data em Brasília, "2026-11-18".
  dayKey: string;
  // 0 = domingo, igual ao banco.
  weekday: number;
  dayOfMonth: number;
  slots: FreeSlot[];
};

export const bookingSchema = z.object({
  interviewerId: z.uuid(),
  startsAt: z.iso.datetime({ error: "Escolha um horário." }),
  type: z.enum(SESSION_TYPES, { error: "Escolha o tipo de entrevista." }),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX_LENGTH, { error: `Use no máximo ${NOTES_MAX_LENGTH} caracteres.` }),
});

// Meia-noite de Brasília do dia em que `now` cai, como instante UTC.
function startOfSaoPauloDay(now: Date): number {
  const shifted = new Date(now.getTime() - SAO_PAULO_OFFSET_HOURS * HOUR_MS);
  return (
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) +
    SAO_PAULO_OFFSET_HOURS * HOUR_MS
  );
}

// Intervalo que a tela cobre: de hoje (Brasília) até o fim da última semana.
export function bookingWindow(now: Date): { from: Date; to: Date } {
  const from = startOfSaoPauloDay(now);
  return {
    from: new Date(from),
    to: new Date(from + BOOKING_WEEKS * DAYS_PER_WEEK_PAGE * DAY_MS),
  };
}

// Horas cheias dentro de um bloco: "18:00" a "21:00" vira [18, 19, 20].
function hoursInBlock(block: AvailabilityBlock): number[] {
  const first = Number(block.start_time.slice(0, 2));
  const endHour = Number(block.end_time.slice(0, 2));
  // Bloco até meia-noite chega do banco como "00:00" ou "24:00".
  const last = endHour === 0 ? 24 : endHour;
  return Array.from({ length: Math.max(last - first, 0) }, (_, index) => first + index);
}

// Os 7 dias de uma página (week 0 = de hoje a hoje + 6), cada um com os
// horários que ainda dá para agendar. Dia sem horário vem com a lista vazia.
export function computeFreeSlots({
  blocks,
  booked,
  now,
  week,
}: {
  blocks: AvailabilityBlock[];
  booked: BookedRange[];
  now: Date;
  week: number;
}): SlotDay[] {
  const today = startOfSaoPauloDay(now);
  const earliest = now.getTime() + MIN_LEAD_HOURS * HOUR_MS;
  const bookedRanges = booked.map((range) => ({
    start: new Date(range.starts_at).getTime(),
    end: new Date(range.ends_at).getTime(),
  }));

  return Array.from({ length: DAYS_PER_WEEK_PAGE }, (_, index) => {
    const dayStart = today + (week * DAYS_PER_WEEK_PAGE + index) * DAY_MS;
    // Deslocado para ler dia e dia da semana de Brasília pelos getters UTC.
    const local = new Date(dayStart - SAO_PAULO_OFFSET_HOURS * HOUR_MS);
    const weekday = local.getUTCDay();

    const hours = blocks
      .filter((block) => block.weekday === weekday)
      .flatMap(hoursInBlock)
      .sort((a, b) => a - b);

    const slots: FreeSlot[] = [];
    for (const hour of new Set(hours)) {
      const start = dayStart + hour * HOUR_MS;
      const end = start + HOUR_MS;
      const taken = bookedRanges.some((range) => start < range.end && end > range.start);
      if (start >= earliest && !taken) {
        slots.push({ startsAt: new Date(start).toISOString(), hour });
      }
    }

    return {
      dayKey: local.toISOString().slice(0, 10),
      weekday,
      dayOfMonth: local.getUTCDate(),
      slots,
    };
  });
}

export function computeAllWeeks(input: {
  blocks: AvailabilityBlock[];
  booked: BookedRange[];
  now: Date;
}): SlotDay[][] {
  return Array.from({ length: BOOKING_WEEKS }, (_, week) => computeFreeSlots({ ...input, week }));
}

// Em qual página está um horário (ou null se ele não está livre). Serve para
// a tela abrir na semana certa e para o servidor revalidar o que veio do form.
export function findSlotWeek(weeks: SlotDay[][], startsAt: string): number | null {
  const target = new Date(startsAt).getTime();
  if (Number.isNaN(target)) {
    return null;
  }
  const index = weeks.findIndex((days) =>
    days.some((day) => day.slots.some((slot) => new Date(slot.startsAt).getTime() === target)),
  );
  return index === -1 ? null : index;
}

export function sessionEnd(startsAt: string): string {
  return new Date(new Date(startsAt).getTime() + HOUR_MS).toISOString();
}

export type FreeSlotsResult = {
  weeks: SlotDay[][];
  // false quando o entrevistador não tem nenhum bloco de disponibilidade.
  hasBlocks: boolean;
  error: boolean;
};

// Busca disponibilidade e horários ocupados e devolve as semanas agendáveis.
export async function getFreeSlots(
  supabase: SupabaseClient<Database>,
  interviewerId: string,
  now: Date = new Date(),
): Promise<FreeSlotsResult> {
  const { from, to } = bookingWindow(now);

  const [availability, booked] = await Promise.all([
    supabase
      .from("availability")
      .select("weekday, start_time, end_time")
      .eq("interviewer_id", interviewerId),
    supabase.rpc("interviewer_booked_slots", {
      interviewer: interviewerId,
      from_ts: from.toISOString(),
      to_ts: to.toISOString(),
    }),
  ]);

  if (availability.error || booked.error) {
    return { weeks: [], hasBlocks: false, error: true };
  }

  return {
    weeks: computeAllWeeks({ blocks: availability.data, booked: booked.data, now }),
    hasBlocks: availability.data.length > 0,
    error: false,
  };
}

const WEEKDAY_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

// Os próximos horários livres em texto curto, para o card do marketplace:
// "Hoje, 14h", "Amanhã, 9h" e, daí em diante, "Qua 18, 9h". Sai das mesmas
// semanas que a tela de agendar usa, para o card nunca prometer um horário
// que não dá mais para marcar.
export function upcomingSlotLabels(weeks: SlotDay[][], count: number): string[] {
  return weeks
    .flat()
    .flatMap((day, index) =>
      day.slots.map((slot) => {
        if (index === 0) {
          return `Hoje, ${slot.hour}h`;
        }
        if (index === 1) {
          return `Amanhã, ${slot.hour}h`;
        }
        return `${WEEKDAY_LABEL[day.weekday]} ${day.dayOfMonth}, ${slot.hour}h`;
      }),
    )
    .slice(0, count);
}
