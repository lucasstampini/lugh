import { GoogleLoginButton } from "./google-login-button";
import { MagicLinkForm } from "./magic-link-form";

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  callback_failed: "O login não foi concluído. Tente de novo.",
};

// searchParams é uma API de request-time: fica isolado aqui e dentro de
// <Suspense> na página, pra não bloquear o resto do /login do shell estático.
export async function AuthSection({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { error, next } = await searchParams;
  const errorKey = Array.isArray(error) ? error[0] : error;
  const message = errorKey ? CALLBACK_ERROR_MESSAGES[errorKey] : null;
  const nextPath = Array.isArray(next) ? next[0] : next;

  return (
    <div className="flex w-full flex-col gap-4">
      {message ? <p className="text-destructive text-sm">{message}</p> : null}
      <GoogleLoginButton next={nextPath} />

      <div className="flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">ou</span>
        <div className="bg-border h-px flex-1" />
      </div>

      <MagicLinkForm next={nextPath} />
    </div>
  );
}
