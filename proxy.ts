import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// "/" est la page publique (landing marketing) ; /login et /register redirigent
// vers le tableau de bord si l'utilisateur est déjà connecté.
const PUBLIC_ONLY_WHEN_LOGGED_OUT = ["/login", "/register"];

// Pages et API accessibles sans compte : le localisateur d'ateliers doit fonctionner
// pour un visiteur qui n'a pas encore d'espace client.
const TOUJOURS_PUBLIC = ["/centres", "/api/centres"];

const STATIC_FILE_PATTERN = /\.[a-zA-Z0-9]+$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_FILE_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname === "/" || TOUJOURS_PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (PUBLIC_ONLY_WHEN_LOGGED_OUT.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    if (!session) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
