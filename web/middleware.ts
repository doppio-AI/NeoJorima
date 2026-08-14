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


  const publicApiRoutes = ["/api/auth/login", "/api/auth/register", "/api/login"];
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }


  const usuarioCookie = request.cookies.get("usuario")?.value;


  if (!usuarioCookie) {

    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida." },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const user = JSON.parse(usuarioCookie);
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
    "/api/:path*" 
  ]
};
