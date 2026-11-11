import { describe, expect, it } from "vitest";
import {
  bookingSchema,
  bookingWindow,
  computeAllWeeks,
  computeFreeSlots,
  findSlotWeek,
  sessionEnd,
  upcomingSlotLabels,
} from "./slots";

// Quarta, 11 nov 2026, 10h em Brasília (13h UTC).
const NOW = new Date("2026-11-11T13:00:00.000Z");

function slotsOf(days: ReturnType<typeof computeFreeSlots>) {
  return days.flatMap((day) => day.slots.map((slot) => slot.startsAt));
}

describe("computeFreeSlots", () => {
  it("devolve 7 dias a partir de hoje em Brasília", () => {
    const days = computeFreeSlots({ blocks: [], booked: [], now: NOW, week: 0 });

    expect(days.map((day) => day.dayKey)).toEqual([
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
      "2026-11-16",
      "2026-11-17",
    ]);
    expect(days[0].weekday).toBe(3);
    expect(days[0].dayOfMonth).toBe(11);
    expect(slotsOf(days)).toEqual([]);
  });

  it("expande o bloco em horas cheias, convertidas para UTC", () => {
    const days = computeFreeSlots({
      blocks: [{ weekday: 4, start_time: "18:00:00", end_time: "21:00:00" }],
      booked: [],
      now: NOW,
      week: 0,
    });

    expect(days[1].slots).toEqual([
      { startsAt: "2026-11-12T21:00:00.000Z", hour: 18 },
      { startsAt: "2026-11-12T22:00:00.000Z", hour: 19 },
      { startsAt: "2026-11-12T23:00:00.000Z", hour: 20 },
    ]);
  });

  it("tira o horário que já tem sessão marcada", () => {
    const days = computeFreeSlots({
      blocks: [{ weekday: 4, start_time: "18:00:00", end_time: "21:00:00" }],
      booked: [{ starts_at: "2026-11-12T22:00:00+00:00", ends_at: "2026-11-12T23:00:00+00:00" }],
      now: NOW,
      week: 0,
    });

    expect(days[1].slots.map((slot) => slot.hour)).toEqual([18, 20]);
  });

  it("exige 2h de antecedência no dia de hoje", () => {
    const days = computeFreeSlots({
      blocks: [{ weekday: 3, start_time: "09:00:00", end_time: "14:00:00" }],
      booked: [],
      now: NOW,
      week: 0,
    });

    // 10h agora: 9h, 10h e 11h já não dão; 12h é exatamente 2h à frente.
    expect(days[0].slots.map((slot) => slot.hour)).toEqual([12, 13]);
  });

  it("aceita bloco até meia-noite, nos dois formatos do banco", () => {
    for (const end of ["00:00:00", "24:00:00"]) {
      const days = computeFreeSlots({
        blocks: [{ weekday: 4, start_time: "22:00:00", end_time: end }],
        booked: [],
        now: NOW,
        week: 0,
      });

      // 23h de quinta em Brasília já é sexta em UTC.
      expect(days[1].slots).toEqual([
        { startsAt: "2026-11-13T01:00:00.000Z", hour: 22 },
        { startsAt: "2026-11-13T02:00:00.000Z", hour: 23 },
      ]);
    }
  });

  it("usa o dia de Brasília mesmo quando em UTC já virou o dia", () => {
    // 22h de quarta em Brasília = 01h de quinta em UTC.
    const lateNight = new Date("2026-11-12T01:00:00.000Z");
    const days = computeFreeSlots({ blocks: [], booked: [], now: lateNight, week: 0 });

    expect(days[0].dayKey).toBe("2026-11-11");
    expect(days[0].weekday).toBe(3);
  });

  it("a segunda página começa 7 dias depois", () => {
    const days = computeFreeSlots({
      blocks: [{ weekday: 3, start_time: "09:00:00", end_time: "10:00:00" }],
      booked: [],
      now: NOW,
      week: 1,
    });

    expect(days[0].dayKey).toBe("2026-11-18");
    expect(slotsOf(days)).toEqual(["2026-11-18T12:00:00.000Z"]);
  });
});

describe("findSlotWeek", () => {
  const weeks = computeAllWeeks({
    blocks: [{ weekday: 4, start_time: "18:00:00", end_time: "20:00:00" }],
    booked: [{ starts_at: "2026-11-12T22:00:00+00:00", ends_at: "2026-11-12T23:00:00+00:00" }],
    now: NOW,
  });

  it("acha a página de um horário livre", () => {
    expect(findSlotWeek(weeks, "2026-11-12T21:00:00.000Z")).toBe(0);
    expect(findSlotWeek(weeks, "2026-11-19T21:00:00.000Z")).toBe(1);
  });

  it("aceita o mesmo instante escrito com outro fuso", () => {
    expect(findSlotWeek(weeks, "2026-11-12T18:00:00-03:00")).toBe(0);
  });

  it("recusa horário ocupado, fora de bloco, quebrado, passado ou além da janela", () => {
    expect(findSlotWeek(weeks, "2026-11-12T22:00:00.000Z")).toBeNull();
    expect(findSlotWeek(weeks, "2026-11-12T15:00:00.000Z")).toBeNull();
    expect(findSlotWeek(weeks, "2026-11-12T21:30:00.000Z")).toBeNull();
    expect(findSlotWeek(weeks, "2026-11-05T21:00:00.000Z")).toBeNull();
    expect(findSlotWeek(weeks, "2026-11-26T21:00:00.000Z")).toBeNull();
    expect(findSlotWeek(weeks, "abc")).toBeNull();
  });
});

describe("bookingWindow e sessionEnd", () => {
  it("cobre de hoje à meia-noite de Brasília até 14 dias depois", () => {
    const { from, to } = bookingWindow(NOW);

    expect(from.toISOString()).toBe("2026-11-11T03:00:00.000Z");
    expect(to.toISOString()).toBe("2026-11-25T03:00:00.000Z");
  });

  it("a sessão termina 1h depois de começar", () => {
    expect(sessionEnd("2026-11-12T21:00:00.000Z")).toBe("2026-11-12T22:00:00.000Z");
  });
});

describe("bookingSchema", () => {
  const valid = {
    interviewerId: "d0000000-0000-4000-8000-000000000001",
    startsAt: "2026-11-12T21:00:00.000Z",
    type: "coding",
    notes: "  quero treinar grafos  ",
  };

  it("aceita o pedido válido e apara as notas", () => {
    const parsed = bookingSchema.parse(valid);

    expect(parsed.notes).toBe("quero treinar grafos");
  });

  it("recusa horário ausente, tipo desconhecido e notas longas demais", () => {
    expect(bookingSchema.safeParse({ ...valid, startsAt: "" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, type: "outro" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, notes: "a".repeat(501) }).success).toBe(false);
  });
});

describe("upcomingSlotLabels", () => {
  it("lista os próximos horários livres em ordem, com hoje e amanhã por nome", () => {
    const weeks = computeAllWeeks({
      blocks: [
        { weekday: 3, start_time: "13:00:00", end_time: "15:00:00" },
        { weekday: 4, start_time: "09:00:00", end_time: "10:00:00" },
        { weekday: 5, start_time: "09:00:00", end_time: "10:00:00" },
      ],
      booked: [],
      now: NOW,
    });

    expect(upcomingSlotLabels(weeks, 4)).toEqual([
      "Hoje, 13h",
      "Hoje, 14h",
      "Amanhã, 9h",
      "Sex 13, 9h",
    ]);
  });

  it("não promete para hoje um horário sem a antecedência mínima", () => {
    // 10h agora e bloco de hoje às 11h: o próximo livre é só na outra quarta.
    const weeks = computeAllWeeks({
      blocks: [{ weekday: 3, start_time: "11:00:00", end_time: "12:00:00" }],
      booked: [],
      now: NOW,
    });

    expect(upcomingSlotLabels(weeks, 3)).toEqual(["Qua 18, 11h"]);
  });

  it("pula o horário que já tem sessão marcada", () => {
    const weeks = computeAllWeeks({
      blocks: [{ weekday: 4, start_time: "09:00:00", end_time: "11:00:00" }],
      booked: [{ starts_at: "2026-11-12T12:00:00+00:00", ends_at: "2026-11-12T13:00:00+00:00" }],
      now: NOW,
    });

    expect(upcomingSlotLabels(weeks, 1)).toEqual(["Amanhã, 10h"]);
  });
});
