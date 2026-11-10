import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Só aceita "next" como caminho relativo interno (começa com "/", não "//"),
// pra não virar um open redirect pra fora do site.
function safeNextPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/";
}

// Resposta pro fluxo de popup: a troca de código já rodou no servidor (os
// cookies de sessão já estão salvos), essa página só avisa a janela que
// abriu o popup e se fecha. postMessage com origin explícito (nunca "*"),
// pra não vazar pra janela errada.
function popupResponse(origin: string, ok: boolean) {
  const html = `<!doctype html><html><body><script>
    if (window.opener) {
      window.opener.postMessage({ source: "lugh-oauth", ok: ${ok} }, ${JSON.stringify(origin)});
    }
    window.close();
  </script></body></html>`;

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const isPopup = searchParams.get("popup") === "1";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return isPopup
        ? popupResponse(origin, true)
        : NextResponse.redirect(`${origin}${next}`);
    }
  }

  return isPopup
    ? popupResponse(origin, false)
    : NextResponse.redirect(`${origin}/login?error=callback_failed`);
}
