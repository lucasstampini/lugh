type Env = Record<string, string | undefined>;

const LOCAL_URL = "http://localhost:3000";

// URL absoluta de uma rota do Lugh, para links que saem do site (e-mails). A base é
// APP_URL quando definida; na Vercel, o domínio de produção do projeto (a própria Vercel
// injeta VERCEL_PROJECT_PRODUCTION_URL, sem protocolo); em local, o localhost.
export function appUrl(path: string, env: Env = process.env): string {
  const configured = env.APP_URL?.trim();
  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const base = configured || (vercelHost ? `https://${vercelHost}` : LOCAL_URL);

  return new URL(path, base).toString();
}
