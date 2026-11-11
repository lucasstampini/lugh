import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "./ui/button";

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
      <Link href="/entrevistadores" className={buttonVariants({ className: "rounded-[10px]" })}>
        Encontrar um entrevistador
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="text-foreground inline-flex min-h-11 items-center">
        Entrar
      </Link>
      <Link href="/entrevistadores" className={buttonVariants({ className: "rounded-[10px]" })}>
        Encontrar um entrevistador
      </Link>
    </>
  );
}
