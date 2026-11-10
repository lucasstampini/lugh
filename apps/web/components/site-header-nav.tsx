import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeaderAccount } from "./site-header-account";

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
      <Link
        href="/entrevistadores"
        className="hover:text-primary text-sm font-semibold transition-colors"
      >
        Entrevistadores
      </Link>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  // Links sempre visíveis (Figma node 47:2, "Navigation"). "Minha evolução"
  // não entrou: não existe rota pra ela ainda.
  const navItems =
    profile?.role === "interviewer"
      ? [
          { href: "/painel", label: "Painel do entrevistador" },
          { href: "/sessoes", label: "Sessões" },
        ]
      : [
          { href: "/entrevistadores", label: "Encontrar profissionais" },
          { href: "/sessoes", label: "Minhas sessões" },
        ];

  const profileHref = profile?.role === "interviewer" ? "/painel/perfil" : "/perfil";

  return (
    <div className="flex items-center gap-8">
      <nav className="hidden items-center gap-8 md:flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="hover:text-primary text-sm font-semibold transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <SiteHeaderAccount name={profile?.name ?? ""} profileHref={profileHref} />
    </div>
  );
}
