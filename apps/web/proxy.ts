import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/painel",
  "/sessoes",
  "/agendar",
  "/sala",
];

const SKIP_ROLE_CHECK_PREFIXES = ["/onboarding", "/auth", "/api", "/login"];

// Renova o cookie de sessão em cada request e protege rotas que exigem
// login, redirecionando sem sessão ou sem role pro lugar certo.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!user) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/entrevistadores";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const needsRoleCheck = !SKIP_ROLE_CHECK_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (needsRoleCheck) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile?.role) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (profile.role === "candidate" && pathname.startsWith("/painel")) {
      const url = request.nextUrl.clone();
      url.pathname = "/entrevistadores";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
