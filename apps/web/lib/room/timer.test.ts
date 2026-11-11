/**
 * Testes de lib/room/timer.ts
 *
 * O que cobre: o cronômetro do cabeçalho da sala: tempo decorrido desde o horário
 * marcado da sessão, duração total e a formatação mm:ss.
 *
 * Por que importa: os dois participantes precisam ver o mesmo relógio para combinar o
 * tempo da entrevista ("faltam 10 minutos"). Por isso ele parte do horário da sessão, e
 * não de quando cada um entrou.
 *
 * Rodar só este arquivo: npx vitest run lib/room/timer.test.ts
 */
import { describe, expect, it } from "vitest";

import { formatClock, sessionClock } from "./timer";

const startsAt = "2026-11-12T21:00:00.000Z";
const endsAt = "2026-11-12T22:00:00.000Z";

describe("sessionClock", () => {
  it("fica em zero para quem entra antes do horário marcado", () => {
    const clock = sessionClock(startsAt, endsAt, new Date("2026-11-12T20:55:00.000Z"));

    expect(clock).toEqual({ elapsedSeconds: 0, totalSeconds: 3600, overtime: false });
  });

  it("conta desde o início marcado, não desde a entrada", () => {
    const clock = sessionClock(startsAt, endsAt, new Date("2026-11-12T21:07:05.900Z"));

    expect(clock.elapsedSeconds).toBe(7 * 60 + 5);
    expect(clock.overtime).toBe(false);
  });

  it("marca que passou do horário a partir do fim da sessão", () => {
    expect(sessionClock(startsAt, endsAt, new Date("2026-11-12T21:59:59.000Z")).overtime).toBe(false);

    const clock = sessionClock(startsAt, endsAt, new Date("2026-11-12T22:05:00.000Z"));
    expect(clock.overtime).toBe(true);
    expect(clock.elapsedSeconds).toBe(65 * 60);
  });
});

describe("formatClock", () => {
  it("formata minutos e segundos com dois dígitos", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(7 * 60 + 5)).toBe("07:05");
    expect(formatClock(3600)).toBe("60:00");
  });

  it("não vira horas depois de 60 minutos", () => {
    expect(formatClock(125 * 60 + 30)).toBe("125:30");
  });
});
