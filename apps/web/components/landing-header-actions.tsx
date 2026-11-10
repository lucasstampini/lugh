import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// getUser() lê Date.now() antes do primeiro await (ver auth-header.tsx);
// connection() evita que isso quebre a validação de prerender estático da
// "/", que é página com shell estático.
export async function LandingHeaderActions() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <Link
        href="/entrevistadores"
        className="bg-primary text-primary-foreground flex h-11 items-center rounded-lg px-5 text-sm font-semibold"
      >
        Entrevistadores
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="text-primary hidden h-11 items-center rounded-lg px-4 text-sm font-semibold sm:flex"
      >
        Entrar
      </Link>
      <Link
        href="/login"
        className="bg-primary text-primary-foreground flex h-11 items-center rounded-lg px-5 text-sm font-semibold"
      >
        Cadastrar-se
      </Link>
    </div>
  );
}
