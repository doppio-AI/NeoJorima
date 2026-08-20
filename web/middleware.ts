import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const publicApiRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/login",
    "/api/registro/mobile", // NUEVO: alta de cuentas personales desde la app móvil
    "/api/public-key",      // el login web lo pide antes de autenticarse; ya era necesario
  ];
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const usuarioCookie = request.cookies.get("usuario")?.value;

  /*
   * NUEVO: la app móvil no manda la cookie "usuario" — manda
   * "Authorization: Bearer <token>" (ver lib/auth/session.ts).
   * Aquí solo verificamos que el header exista y tenga forma de
   * bearer token; la verificación criptográfica real (firma HMAC)
   * ocurre en getSessionUser() dentro de cada route handler.
   * Esto es equivalente en rigor a lo que ya se hacía con la cookie:
   * el middleware tampoco valida la firma de la cookie, solo que
   * exista y sea JSON parseable.
   */
  const authHeader = request.headers.get("authorization");
  const tieneBearer = !!authHeader?.toLowerCase().startsWith("bearer ");

  if (!usuarioCookie && !tieneBearer) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida." },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Peticiones móviles (bearer, sin cookie): las reglas de rol de abajo
  // son para las páginas web (/administrador, /usuarios), que no existen
  // en móvil. Dejamos pasar y que cada route handler valide con getSessionUser.
  if (!usuarioCookie && tieneBearer) {
    return NextResponse.next();
  }

  try {
    const user = JSON.parse(usuarioCookie!);
    const tipo = Number(user.tipo_usuario);

    if (pathname.startsWith("/administrador") && tipo !== 1) {
      return NextResponse.redirect(new URL("/usuarios", request.url));
    }

    if (pathname.startsWith("/usuarios") && tipo !== 2) {
      return NextResponse.redirect(new URL("/administrador", request.url));
    }

    if (pathname.startsWith("/api/admin") && tipo !== 1) {
      return NextResponse.json(
        { error: "Acceso denegado: permisos insuficientes." },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (err) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Sesión inválida." },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: [
    "/administrador/:path*",
    "/usuarios/:path*",
    "/api/:path*",
  ],
};
