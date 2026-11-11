import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "./database.types";

// Cliente para Server Components, Server Actions e Route Handlers.
// Usa a sessão do usuário (cookies) e respeita RLS.
export async function createClient() {
  // O cliente lê Date.now() para checar a validade do token da sessão. Com
  // cacheComponents, o Next acusa "unstable value Date.now() while
  // prerendering" em toda página logada se a rota não for marcada como de
  // request-time antes disso. connection() faz essa marcação num lugar só.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component: ignorar.
            // A renovação de sessão fica no proxy (fase 2).
          }
        },
      },
    },
  );
}

// Cliente com service role: ignora RLS. Só usar no servidor,
// para escritas sensíveis (status de sessão, pagamentos, webhooks).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
