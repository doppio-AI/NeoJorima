import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/* ───────────────────────────────────────────
   POST /api/auth/register

   Registro público para cuentas personales (sin institución).
   Las cuentas institucionales las crea el admin desde el dashboard,
   no se auto-registran.

   Deja al usuario logueado directamente (mismas cookies que
   /api/login), para no mandarlo de vuelta a la pantalla de login
   después de registrarse.
   ─────────────────────────────────────────── */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      correo,
      contrasena,
    } = body ?? {};

    if (
      typeof nombre !== "string" || !nombre.trim() ||
      typeof apellido_paterno !== "string" || !apellido_paterno.trim() ||
      typeof correo !== "string" || !correo.trim() ||
      typeof contrasena !== "string" || !contrasena
    ) {
      return NextResponse.json(
        { error: "Nombre, apellido paterno, correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (contrasena.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const existente = await prisma.usuario.findUnique({
      where: { correo: correoNormalizado },
      select: { usuario_id: true },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo" },
        { status: 409 }
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
        edificio_id: null,
        tipo_cuenta: "personal",
        onboarding_completo: false,
      },
    });

    const usuarioSesion = {
      id: nuevoUsuario.usuario_id,
      usuario_id: nuevoUsuario.usuario_id,
      tipo_usuario: nuevoUsuario.tipo_usuario,
      correo: nuevoUsuario.correo,
      nombre: nuevoUsuario.nombre,
      apellido_paterno: nuevoUsuario.apellido_paterno,
      apellido_materno: nuevoUsuario.apellido_materno,
      edificio_id: nuevoUsuario.edificio_id,
      turno: nuevoUsuario.turno,
      tipo_cuenta: nuevoUsuario.tipo_cuenta,
      avatar_genero: nuevoUsuario.avatar_genero,
      onboarding_completo: nuevoUsuario.onboarding_completo,
    };

    const response = NextResponse.json(
      { ok: true, message: "Cuenta creada", usuario: usuarioSesion },
      { status: 201 }
    );

    const cookieOptions = {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 30,
    };

    response.cookies.set("usuario", JSON.stringify(usuarioSesion), {
      ...cookieOptions,
      httpOnly: true,
    });

    response.cookies.set("usuario_public", JSON.stringify(usuarioSesion), {
      ...cookieOptions,
      httpOnly: false,
    });

    return response;
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { error: "Error interno al crear la cuenta" },
      { status: 500 }
    );
  }
}
