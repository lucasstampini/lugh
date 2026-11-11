import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  "email",
  "magiclink",
  "signup",
];

function isEmailOtpType(type: string | null): type is EmailOtpType {
  return EMAIL_OTP_TYPES.some((allowed) => allowed === type);
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
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));
  const isPopup = searchParams.get("popup") === "1";

  // Link de e-mail com token_hash (templates em supabase/templates): funciona
  // em qualquer navegador ou aparelho. O fluxo com "code" (PKCE) depende de um
  // cookie gravado no navegador que pediu o link, então abrir o e-mail no
  // celular depois de pedir no computador falhava.
  if (tokenHash && isEmailOtpType(otpType)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

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
