"use client";

import { useState } from "react";

const PREFERENCES = [
  {
    key: "reminders",
    title: "Lembretes das suas sessões",
    description: "Avisos úteis sobre os treinos que você agendar.",
    defaultOn: true,
  },
  {
    key: "news",
    title: "Dicas e novidades por e-mail",
    description: "Opcional. Sem ativar automaticamente.",
    defaultOn: false,
  },
];

// Figma node 47:179: não existe coluna de preferência de notificação no
// banco ainda. Só visual, estado fica no cliente.
export function PreferenceToggles() {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFERENCES.map((p) => [p.key, p.defaultOn])),
  );

  return (
    <div className="flex flex-col gap-4">
      {PREFERENCES.map((pref) => {
        const on = state[pref.key];
        return (
          <div key={pref.key} className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-bold">{pref.title}</p>
              <p className="text-muted-foreground text-xs">{pref.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={pref.title}
              onClick={() => setState((s) => ({ ...s, [pref.key]: !s[pref.key] }))}
              className={`edge flex h-6 w-[42px] shrink-0 items-center rounded-full p-[3px] transition-colors ${
                on ? "bg-primary justify-end" : "bg-muted justify-start"
              }`}
            >
              {/* O botão leva borda de tinta: sem ela, o branco sobre o trilho
                  claro do estado desligado fica invisível. */}
              <span className="edge bg-card size-[15px] rounded-full" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
