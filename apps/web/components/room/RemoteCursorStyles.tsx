"use client";

import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";

import { remoteCursorCss, type RemoteCursor } from "@/lib/room/cursor-styles";

type AwarenessUser = { name?: unknown; color?: unknown };

function remoteCursors(awareness: Awareness): RemoteCursor[] {
  return [...awareness.getStates()]
    .filter(([clientId]) => clientId !== awareness.clientID)
    .map(([clientId, state]) => {
      const user = (state.user ?? {}) as AwarenessUser;
      return { clientId, name: user.name, color: user.color };
    });
}

// Pinta o cursor de cada participante remoto com a cor e o nome dele.
// Recalcula o CSS sempre que alguém entra, sai ou muda os dados no awareness.
export function RemoteCursorStyles({ awareness }: { awareness: Awareness }) {
  const [css, setCss] = useState(() => remoteCursorCss(remoteCursors(awareness)));

  useEffect(() => {
    const update = () => setCss(remoteCursorCss(remoteCursors(awareness)));
    awareness.on("change", update);
    return () => awareness.off("change", update);
  }, [awareness]);

  return <style>{css}</style>;
}
