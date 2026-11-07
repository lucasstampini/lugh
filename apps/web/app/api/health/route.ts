import { connection } from "next/server";

// GET /api/health: confirma que o app está no ar e que o Supabase responde.
export async function GET() {
  await connection(); // sempre executar na hora do request, nunca pré-renderizar

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let supabase: "ok" | "error" | "not_configured" = "not_configured";

  if (url && key) {
    try {
      const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key } });
      supabase = res.ok ? "ok" : "error";
    } catch {
      supabase = "error";
    }
  }

  return Response.json({ app: "ok", supabase });
}
