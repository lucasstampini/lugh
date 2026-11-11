"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { initials } from "@/lib/initials";
import { createClient } from "@/lib/supabase/client";
import { springSoft } from "./motion/springs";

// Sino e avatar+nome+chevron do cabeçalho logado (Figma node 47:2,
// "Account"). O sino é só visual por enquanto: não existe sistema de
// notificações no PROJETO.md ainda.
export function SiteHeaderAccount({
  name,
  profileHref,
}: {
  name: string;
  profileHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label="Notificações"
        className="text-muted-foreground hover:text-primary flex size-9 items-center justify-center rounded-full transition-colors"
      >
        <Bell aria-hidden="true" size={18} />
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Fechar menu da conta" : "Abrir menu da conta"}
          aria-expanded={open}
          className="flex items-center gap-2"
        >
          <span className="bg-secondary text-primary font-heading flex size-9 items-center justify-center rounded-full text-xs font-bold">
            {initials(name)}
          </span>
          <span className="hidden text-sm font-bold sm:inline">
            {name.split(" ")[0]}
          </span>
          <ChevronDown
            aria-hidden="true"
            size={16}
            className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.nav
              initial={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.97 }}
              transition={springSoft}
              style={{ transformOrigin: "top right" }}
              className="border-border bg-card absolute top-full right-0 z-10 mt-2 flex w-48 flex-col gap-1 rounded-xl border p-2 shadow-lg"
            >
              <Link
                href={profileHref}
                onClick={() => setOpen(false)}
                className="hover:bg-muted rounded-lg px-3 py-2.5 text-sm transition-colors duration-150"
              >
                Meu perfil
              </Link>

              <div className="bg-border my-1 h-px" />
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-destructive hover:bg-muted rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 disabled:opacity-60"
              >
                {loggingOut ? "Saindo..." : "Sair"}
              </button>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
