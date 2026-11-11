"use client";

import { useEffect, useState } from "react";

const START = 32 * 60 + 14;
const END = 49 * 60 + 50;

// Cronômetro das demonstrações (landing e login): só enfeite, não mede nada.
// Com prefers-reduced-motion fica parado em 32:14.
export function DemoTimer() {
  const [seconds, setSeconds] = useState(START);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setSeconds((value) => (value >= END ? START : value + 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <span className="tabular-nums">
      {mm}:{ss} / 50:00
    </span>
  );
}
