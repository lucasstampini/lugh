"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/client";

const GENERIC_ERROR = "Não deu para entrar com o Google agora. Tente de novo.";

export function GoogleLoginButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const popupRef = useRef<Window | null>(null);

  // Espera a mensagem do popup (ver app/auth/callback/route.ts) em vez de
  // navegar a página toda pra tela de contas do Google, igual outros sites.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data?.source !== "lugh-oauth") {
        return;
      }

      setLoading(false);
      if (event.data.ok) {
        router.push(safeNextPath(next, "/entrevistadores"));
        router.refresh();
      } else {
        setError(GENERIC_ERROR);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [next, router]);

  // Se a pessoa fechar o popup sem terminar, o botão não pode ficar travado
  // em "Entrando..." pra sempre.
  useEffect(() => {
    if (!loading) {
      return;
    }
    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        setLoading(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleClick() {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("popup", "1");
    if (next) {
      callbackUrl.searchParams.set("next", next);
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        setError(GENERIC_ERROR);
        setLoading(false);
        return;
      }

      const popup = window.open(
        data.url,
        "lugh-google-login",
        "width=480,height=640,menubar=no,toolbar=no,status=no,location=no",
      );

      // Bloqueador de popup: refaz o login como redirect de página cheia. Não
      // dá pra reaproveitar data.url: ela volta pro callback com popup=1, que
      // responde com a página que só avisa a janela-mãe e se fecha (e aqui não
      // existe janela-mãe, a pessoa ficaria numa tela em branco).
      if (!popup) {
        callbackUrl.searchParams.delete("popup");
        const { error: redirectError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: callbackUrl.toString() },
        });
        if (redirectError) {
          setError(GENERIC_ERROR);
          setLoading(false);
        }
        return;
      }

      popupRef.current = popup;
      popup.focus();
    } catch {
      setError(GENERIC_ERROR);
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {/* O logo colorido é o do Google (guia de marca deles); o botão em si
          segue o padrão secundário do Lugh. */}
      <Button
        onClick={handleClick}
        disabled={loading}
        variant="outline"
        size="lg"
        className="w-full text-base"
      >
        <svg viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8445c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.3436 0-4.3273-1.5831-5.0359-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9574C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9574 4.0418L3.9641 10.71z"
          />
          <path
            fill="#EA4335"
            d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.9641 7.29C4.6727 5.1627 6.6564 3.5795 9 3.5795z"
          />
        </svg>
        {loading ? "Entrando..." : "Continuar com Google"}
      </Button>
      {error ? (
        <p role="alert" className="text-destructive text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
