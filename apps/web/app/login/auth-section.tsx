import { LoginPanel } from "./login-panel";

const CALLBACK_ERRORS: Record<string, { title: string; body: string }> = {
  callback_failed: {
    title: "O login não foi concluído",
    body: "O link pode ter expirado ou já ter sido usado. Peça um novo link abaixo para entrar.",
  },
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
  const callbackError = errorKey ? (CALLBACK_ERRORS[errorKey] ?? null) : null;
  const nextPath = Array.isArray(next) ? next[0] : next;

  return <LoginPanel next={nextPath} callbackError={callbackError} />;
}
