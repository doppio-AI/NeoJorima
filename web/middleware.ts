import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Recursos estáticos e internos siempre públicos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // 2. Rutas de la API que SÍ deben ser públicas (Login, Registro, etc.)
  // Ajusta estas rutas a los nombres exactos de tus endpoints de autenticación
  const publicApiRoutes = ["/api/auth/login", "/api/auth/register", "/api/login"];
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 3. Obtener la sesión / cookie
  const usuarioCookie = request.cookies.get("usuario")?.value;

  // Si no hay cookie:
  if (!usuarioCookie) {
    // Si la petición va a la API, respondemos con JSON 401 (no con redirect HTML)
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida." },
        { status: 401 }
      );
    }
    // Si es una página web, redirigimos al login
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const user = JSON.parse(usuarioCookie);
    const tipo = Number(user.tipo_usuario);

    // 4. Protección por Roles en Vistas
    if (pathname.startsWith("/administrador") && tipo !== 1) {
      return NextResponse.redirect(new URL("/usuarios", request.url));
    }

    if (pathname.startsWith("/usuarios") && tipo !== 2) {
      return NextResponse.redirect(new URL("/administrador", request.url));
    }

    // 5. (Opcional) Protección por Roles en Endpoints de API si tienes rutas exclusivas de admin
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

// 6. Matcher actualizado para incluir las rutas de la API
export const config = {
  matcher: [
    "/administrador/:path*",
    "/usuarios/:path*",
    "/api/:path*" // <-- IMPORTANTE: Ahora el middleware intercepta todas las peticiones a la API
  ]
};
