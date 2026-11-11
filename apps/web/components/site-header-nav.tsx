import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "./nav-link";
import { SiteHeaderAccount } from "./site-header-account";
import { buttonVariants } from "./ui/button";

// Isolado num Suspense próprio (ver site-header.tsx) porque acessa cookies()
// via createClient(): cacheComponents exige limite de streaming pra dado
// dinâmico fora da página.
export async function SiteHeaderNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <nav
        aria-label="Principal"
        className="flex flex-wrap items-center gap-x-7 gap-y-1 text-[15px] font-semibold"
      >
        <NavLink href="/entrevistadores">Entrevistadores</NavLink>
        <Link href="/#como-funciona" className="text-foreground inline-flex min-h-11 items-center">
          Como funciona
        </Link>
        <Link href="/login" className="text-foreground inline-flex min-h-11 items-center">
          Entrar
        </Link>
        <Link href="/login" className={buttonVariants({ className: "rounded-[10px]" })}>
          Cadastrar-se
        </Link>
      </nav>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  const navItems =
    profile?.role === "interviewer"
      ? [
          { href: "/painel", label: "Painel" },
          { href: "/sessoes", label: "Sessões" },
        ]
      : [
          { href: "/entrevistadores", label: "Entrevistadores" },
          { href: "/sessoes", label: "Sessões" },
        ];

  const profileHref = profile?.role === "interviewer" ? "/painel/perfil" : "/perfil";

  return (
    <nav
      aria-label="Principal"
      className="flex flex-wrap items-center gap-x-7 gap-y-1 text-[15px] font-semibold"
    >
      {navItems.map((item) => (
        <NavLink key={item.href} href={item.href}>
          {item.label}
        </NavLink>
      ))}

      <SiteHeaderAccount name={profile?.name ?? ""} profileHref={profileHref} />
    </nav>
  );
}
