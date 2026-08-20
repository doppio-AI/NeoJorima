import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth/session";
import { isOriginAllowed, getCorsHeaders } from "@/lib/cors";

/* ───────────────────────────────────────────
   POST /api/login/mobile

   Único cambio respecto a la versión anterior:
   el select y la respuesta ahora incluyen
   tipo_cuenta, avatar_genero y onboarding_completo,
   para que la app sepa si debe mandar al usuario
   al wizard de onboarding o directo a home.
   ─────────────────────────────────────────── */

function jsonResponse(
  request: Request,
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: { ...getCorsHeaders(request), "Cache-Control": "no-store" },
  });
}

export async function OPTIONS(request: Request) {
  if (!isOriginAllowed(request)) {
    return jsonResponse(request, { error: "Origen no autorizado" }, 403);
  }
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request: Request) {
  try {
    if (!isOriginAllowed(request)) {
      return jsonResponse(request, { error: "Origen no autorizado" }, 403);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        request,
        { error: "El cuerpo de la solicitud debe ser un JSON válido" },
        400
      );
    }

    if (!body || typeof body !== "object") {
      return jsonResponse(request, { error: "Datos de inicio de sesión inválidos" }, 400);
    }

    const { correo: correoIngresado, contrasena: contrasenaIngresada } =
      body as { correo?: unknown; contrasena?: unknown };

    if (typeof correoIngresado !== "string" || typeof contrasenaIngresada !== "string") {
      return jsonResponse(request, { error: "Correo y contraseña son obligatorios" }, 400);
    }

    const correo = correoIngresado.trim().toLowerCase();
    const contrasena = contrasenaIngresada;

    if (!correo || !contrasena.trim()) {
      return jsonResponse(request, { error: "Correo y contraseña son obligatorios" }, 400);
    }

    if (correo.length > 254) {
      return jsonResponse(request, { error: "El correo electrónico no es válido" }, 400);
    }

    if (contrasena.length > 200) {
      return jsonResponse(
        request,
        { error: "Las credenciales proporcionadas no son válidas" },
        400
      );
    }

    const user = await prisma.usuario.findUnique({
      where: { correo },
      select: {
        usuario_id: true,
        nombre: true,
        correo: true,
        tipo_usuario: true,
        edificio_id: true,
        turno: true,
        contrasena: true,
        tipo_cuenta: true,
        avatar_genero: true,
        onboarding_completo: true,
      },
    });

    if (!user) {
      return jsonResponse(request, { error: "Correo o contraseña incorrectos" }, 401);
    }

    const validPassword = await bcrypt.compare(contrasena, user.contrasena);

    if (!validPassword) {
      return jsonResponse(request, { error: "Correo o contraseña incorrectos" }, 401);
    }

    const token = createSessionToken({
      usuario_id: user.usuario_id,
      tipo_usuario: user.tipo_usuario,
    });

    return jsonResponse(
      request,
      {
        message: "Login exitoso",
        token,
        usuario: {
          id: user.usuario_id,
          nombre: user.nombre,
          correo: user.correo,
          tipo_usuario: user.tipo_usuario,
          edificio_id: user.edificio_id,
          turno: user.turno,
          tipo_cuenta: user.tipo_cuenta,
          avatar_genero: user.avatar_genero,
          onboarding_completo: user.onboarding_completo,
        },
      },
      200
    );
  } catch (error) {
    console.error("LOGIN MOBILE ERROR:", error);
    return jsonResponse(request, { error: "Error interno en login móvil" }, 500);
  }
}
