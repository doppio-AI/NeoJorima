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
    "/api/registro/mobile",
    "/api/public-key",
    "/api/setup/superadmin", // TEMPORAL — quitar de esta lista cuando borres el endpoint
  ];
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const usuarioCookie = request.cookies.get("usuario")?.value;

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

  if (!usuarioCookie && tieneBearer) {
    return NextResponse.next();
  }

  try {
    const user = JSON.parse(usuarioCookie!);
    const tipo = Number(user.tipo_usuario);

    /*
     * Tres zonas de páginas web, una por rol:
     *   1 = /administrador   (admin de institución)
     *   2 = /usuarios        (colaborador / usuario final)
     *   3 = /superadmin      (superadmin)
     * Si alguien cae en la zona que no le toca, se le manda a la suya.
     */
    const destinoParaRol = (tipoActual: number): string => {
      if (tipoActual === 1) return "/administrador";
      if (tipoActual === 3) return "/superadmin";
      return "/usuarios";
    };

    if (pathname.startsWith("/administrador") && tipo !== 1) {
      return NextResponse.redirect(new URL(destinoParaRol(tipo), request.url));
    }

    if (pathname.startsWith("/usuarios") && tipo !== 2) {
      return NextResponse.redirect(new URL(destinoParaRol(tipo), request.url));
    }

    if (pathname.startsWith("/superadmin") && tipo !== 3) {
      return NextResponse.redirect(new URL(destinoParaRol(tipo), request.url));
    }

    if (pathname.startsWith("/api/admin") && tipo !== 1 && tipo !== 3) {
      return NextResponse.json(
        { error: "Acceso denegado: permisos insuficientes." },
        { status: 403 }
      );
    }

    if (pathname.startsWith("/api/superadmin") && tipo !== 3) {
      return NextResponse.json(
        { error: "Acceso denegado: permisos insuficientes." },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (err) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: [
    "/administrador/:path*",
    "/usuarios/:path*",
    "/superadmin/:path*",
    "/api/:path*",
  ],
};
