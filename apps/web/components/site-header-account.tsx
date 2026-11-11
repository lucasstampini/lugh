"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { initials } from "@/lib/initials";
import { createClient } from "@/lib/supabase/client";
import { springSoft } from "./motion/springs";

// Avatar com as iniciais e menu da conta (meu perfil, sair).
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fechar menu da conta" : "Abrir menu da conta"}
        aria-expanded={open}
        className="flex min-h-11 items-center gap-1.5"
      >
        <span className="edge bg-accent flex size-10 items-center justify-center rounded-full font-mono text-xs font-bold">
          {initials(name)}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.97 }}
              transition={springSoft}
              style={{ transformOrigin: "top right" }}
              className="edge bg-card absolute top-full right-0 z-10 mt-2 flex w-48 flex-col gap-1 rounded-xl p-2 font-semibold"
            >
              <Link
                href={profileHref}
                onClick={() => setOpen(false)}
                className="hover:bg-accent rounded-lg px-3 py-2.5 text-sm transition-colors duration-150"
              >
                Meu perfil
              </Link>

              <div className="border-border-dashed my-1 border-t-[1.5px] border-dashed" />
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-destructive hover:bg-destructive-soft rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 disabled:opacity-60"
              >
                {loggingOut ? "Saindo..." : "Sair"}
              </button>
            </motion.div>
          ) : null}
      </AnimatePresence>
    </div>
  );
}
