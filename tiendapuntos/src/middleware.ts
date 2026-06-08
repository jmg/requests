import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "tp_session";

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

// Extrae el subdominio de negocio del host, si el dominio raíz está configurado
// (no aplica en localhost).
function getTenantSubdomain(host: string): string | null {
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000").toLowerCase();
  const h = host.toLowerCase();
  if (root.startsWith("localhost") || root.startsWith("127.")) return null;
  if (!h.endsWith(root)) return null;
  const prefix = h.slice(0, h.length - root.length).replace(/\.$/, "");
  if (!prefix || prefix === "www" || prefix === "app") return null;
  return prefix;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const subdomain = getTenantSubdomain(host);

  // En un subdominio de negocio, la raíz sirve el portal público de ese negocio.
  if (subdomain) {
    if (pathname === "/" || pathname === "") {
      const url = req.nextUrl.clone();
      url.pathname = `/p/${subdomain}`;
      return NextResponse.rewrite(url);
    }
    // El panel y la auth viven en el dominio principal, no en los subdominios.
    if (
      pathname.startsWith("/dashboard") ||
      pathname === "/login" ||
      pathname === "/register"
    ) {
      const url = req.nextUrl.clone();
      url.pathname = `/p/${subdomain}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Dominio principal: protección de rutas por sesión.
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const authed = await isValidSession(token);
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isDashboard && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (isAuthPage && authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Corre en todas las rutas salvo assets estáticos, PWA y endpoints de API/webhooks.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|sw.js|manifest.webmanifest|icon.svg|icon-maskable.svg).*)",
  ],
};
