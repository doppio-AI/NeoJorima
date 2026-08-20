import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth/session";
import { isOriginAllowed, getCorsHeaders } from "@/lib/cors";

/* ───────────────────────────────────────────
   POST /api/registro/mobile

   Alta de cuentas desde la app móvil. A diferencia de
   /api/usuarios (usado por el panel admin para altas
   institucionales), aquí NO se exige edificio_id: el
   tipo de cuenta (personal/empresa) y el edificio, si
   aplica, se resuelven después en /api/onboarding.

   tipo_usuario se fija en 2 (usuario regular). Las cuentas
   de tipo 1 (RH/admin) se siguen dando de alta solo desde
   el panel web.

   No hay verificación por correo (2FA): la sesión se crea
   directo, igual que en /api/login/mobile.
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
      return jsonResponse(request, { error: "Datos inválidos" }, 400);
    }

    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      correo,
      contrasena,
    } = body as Record<string, unknown>;

    if (
      typeof nombre !== "string" || !nombre.trim() ||
      typeof apellido_paterno !== "string" || !apellido_paterno.trim() ||
      typeof correo !== "string" || !correo.trim() ||
      typeof contrasena !== "string" || !contrasena
    ) {
      return jsonResponse(
        request,
        { error: "Nombre, apellido paterno, correo y contraseña son obligatorios" },
        400
      );
    }

    const correoNormalizado = correo.trim().toLowerCase();

    if (correoNormalizado.length > 254) {
      return jsonResponse(request, { error: "El correo no es válido" }, 400);
    }

    if (contrasena.length < 8 || contrasena.length > 200) {
      return jsonResponse(
        request,
        { error: "La contraseña debe tener entre 8 y 200 caracteres" },
        400
      );
    }

    const existente = await prisma.usuario.findUnique({
      where: { correo: correoNormalizado },
      select: { usuario_id: true },
    });

    if (existente) {
      // Mensaje genérico: no confirmar si el correo ya existe públicamente
      // sería mejor, pero aquí el usuario necesita saber que ya tiene cuenta.
      return jsonResponse(
        request,
        { error: "Ya existe una cuenta con este correo" },
        409
      );
    }

    const passwordHash = await bcrypt.hash(contrasena, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        tipo_usuario: 2,
        correo: correoNormalizado,
        nombre: nombre.trim(),
        apellido_paterno: apellido_paterno.trim(),
        apellido_materno:
          typeof apellido_materno === "string" && apellido_materno.trim()
            ? apellido_materno.trim()
            : null,
        contrasena: passwordHash,
        tipo_cuenta: "personal",
        onboarding_completo: false,
        // edificio_id se queda null: se resuelve en /api/onboarding
        // si el usuario elige "empresa" en el wizard.
      },
      select: {
        usuario_id: true,
        nombre: true,
        correo: true,
        tipo_usuario: true,
        tipo_cuenta: true,
        avatar_genero: true,
        onboarding_completo: true,
        edificio_id: true,
        turno: true,
      },
    });

    const token = createSessionToken({
      usuario_id: nuevoUsuario.usuario_id,
      tipo_usuario: nuevoUsuario.tipo_usuario,
    });

    return jsonResponse(
      request,
      {
        message: "Cuenta creada",
        token,
        usuario: {
          id: nuevoUsuario.usuario_id,
          nombre: nuevoUsuario.nombre,
          correo: nuevoUsuario.correo,
          tipo_usuario: nuevoUsuario.tipo_usuario,
          tipo_cuenta: nuevoUsuario.tipo_cuenta,
          avatar_genero: nuevoUsuario.avatar_genero,
          onboarding_completo: nuevoUsuario.onboarding_completo,
          edificio_id: nuevoUsuario.edificio_id,
          turno: nuevoUsuario.turno,
        },
      },
      201
    );
  } catch (error) {
    console.error("REGISTRO MOBILE ERROR:", error);
    return jsonResponse(request, { error: "Error interno al crear la cuenta" }, 500);
  }
}
