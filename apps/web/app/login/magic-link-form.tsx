"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function MagicLinkForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (next) {
      callbackUrl.searchParams.set("next", next);
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        console.error("signInWithOtp retornou erro:", error);
        setError("Não deu para enviar o link agora. Tente de novo.");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch (err) {
      console.error("signInWithOtp lançou exceção:", err);
      setError("Não deu para enviar o link agora. Tente de novo.");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="text-muted-foreground text-sm">
        Mandamos um link de entrada para <strong>{email}</strong>. Abra sua
        caixa de entrada (e a lixeira) para continuar.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="magic-link-email" className="sr-only">
          E-mail
        </label>
        <input
          id="magic-link-email"
          name="email"
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border-input bg-background h-11 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button
        type="submit"
        variant="outline"
        disabled={loading}
        className="h-11 w-full"
      >
        {loading ? "Enviando..." : "Entrar com link mágico"}
      </Button>
    </form>
  );
}
