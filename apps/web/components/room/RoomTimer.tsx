"use client";

import { useEffect, useState } from "react";

const SESSION_MINUTES = 50;

// Tempo desde que este participante entrou na sala. É só local: a sala ainda não conhece
// o horário real da sessão (fase 5), então cada um vê o próprio relógio.
export function RoomTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div role="timer" aria-label="Tempo na sala" className="font-mono text-lg font-bold tabular-nums">
      <span className="text-primary">
        {mm}:{ss}
      </span>{" "}
      <span className="text-muted-foreground text-[13px] font-normal">/ {SESSION_MINUTES}:00</span>
    </div>
  );
}
