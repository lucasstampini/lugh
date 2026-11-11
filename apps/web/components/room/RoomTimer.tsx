"use client";

import { useEffect, useState } from "react";

import { formatClock, sessionClock } from "@/lib/room/timer";

const TEST_ROOM_SECONDS = 60 * 60;

type Props = {
  // Horário marcado da sessão. Sem eles (sala de teste) o relógio conta desde a entrada.
  startsAt?: string;
  endsAt?: string;
};

// Cronômetro do cabeçalho da sala. Na sessão real parte do horário marcado, então os dois
// participantes veem o mesmo tempo; passou do fim, fica em tom de aviso.
export function RoomTimer({ startsAt, endsAt }: Props) {
  // Guardado no primeiro render para o relógio da sala de teste não reiniciar a cada tick.
  const [joinedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const clock =
    startsAt && endsAt
      ? sessionClock(startsAt, endsAt, new Date(now))
      : {
          elapsedSeconds: Math.max(0, Math.floor((now - joinedAt) / 1000)),
          totalSeconds: TEST_ROOM_SECONDS,
          overtime: false,
        };

  return (
    <div
      role="timer"
      aria-label={clock.overtime ? "Tempo de sessão, horário encerrado" : "Tempo de sessão"}
      className="font-mono text-lg font-bold tabular-nums"
    >
      <span className={clock.overtime ? "text-destructive" : "text-primary"}>
        {formatClock(clock.elapsedSeconds)}
      </span>{" "}
      <span className="text-muted-foreground text-[13px] font-normal">
        / {formatClock(clock.totalSeconds)}
      </span>
    </div>
  );
}
