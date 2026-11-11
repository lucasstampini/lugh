"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/client";

// `sentTo` vem do LoginPanel: com e-mail, mostra as ações de "link enviado"
// (reenviar, usar outro e-mail); sem, mostra o formulário.
export function MagicLinkForm({
  next,
  sentTo,
  onSentChange,
}: {
  next?: string;
  sentTo: string | null;
  onSentChange: (email: string | null) => void;
}) {
  const [email, setEmail] = useState(sentTo ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function sendLink() {
    setError(null);
    setResent(false);
    setLoading(true);

    const supabase = createClient();
    // "next" vai sempre na URL: o template do e-mail acrescenta
    // "&token_hash=..." no fim, então a URL precisa já ter uma query.
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", safeNextPath(next, "/entrevistadores"));

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        setError("Não deu para enviar o link agora. Tente de novo.");
        setLoading(false);
        return;
      }

      setResent(sentTo !== null);
      onSentChange(email);
      setLoading(false);
    } catch {
      setError("Não deu para enviar o link agora. Tente de novo.");
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendLink();
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void sendLink()}
            className="h-12"
          >
            {loading ? "Reenviando..." : "Reenviar link"}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={() => onSentChange(null)}
            className="h-12 px-1.5"
          >
            Usar outro e-mail
          </Button>
        </div>
        <p role="status" className="text-muted-foreground text-sm">
          {resent ? "Link reenviado. Vale o mais recente." : null}
        </p>
        {error ? (
          <p role="alert" className="text-destructive text-sm font-semibold">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
      <div className="flex flex-col gap-2">
        <label htmlFor="magic-link-email" className="text-sm font-bold">
          E-mail
        </label>
        <Input
          id="magic-link-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby="magic-link-help"
          className="h-[52px]"
        />
        <p id="magic-link-help" className="text-muted-foreground text-[13px]">
          Enviamos um link que entra direto na sua conta.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm font-semibold">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Enviando..." : "Enviar link de acesso"}
      </Button>
    </form>
  );
}
