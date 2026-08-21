import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth/session";
import { obtenerAlcance } from "@/lib/auth/institucion";

/* ───────────────────────────────────────────
   GET /api/usuarios

   - superadmin: ve todos los usuarios.
   - admin_institucion: ve SOLO los usuarios de su edificio_id.
   - usuario normal: 403 (esto no es para ellos, su propio
     perfil se consulta con GET /api/perfil).
   ─────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  try {
    const sesion = getSessionUser(request);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const alcance = await obtenerAlcance(sesion.usuario_id, sesion.tipo_usuario);

    if (alcance.rol === "usuario") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const where =
      alcance.rol === "admin_institucion" ? { edificio_id: alcance.edificio_id } : {};

    const usuarios = await prisma.usuario.findMany({
      where,
      include: { edificio: true },
      orderBy: { usuario_id: "asc" },
    });

    // No exponer el hash de contraseña nunca, ni siquiera a un superadmin.
    const usuariosSinPassword = usuarios.map(({ contrasena, ...resto }) => resto);

    return NextResponse.json(usuariosSinPassword);
  } catch (error: unknown) {
    console.error("ERROR GET USUARIOS:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al obtener usuarios", detalle: mensaje },
      { status: 500 }
    );
  }
}

/* ───────────────────────────────────────────
   POST /api/usuarios

   - admin_institucion: SOLO puede crear colaboradores (tipo_usuario=2)
     dentro de su propia institución. tipo_usuario y edificio_id que
     mande en el body se IGNORAN a propósito — se fuerzan desde la
     sesión, para que no pueda auto-promoverse ni crear en otro edificio.
   - superadmin: puede crear admins de institución (1) o colaboradores (2)
     en cualquier edificio_id que exista. NO puede crear otro superadmin (3)
     desde este endpoint (eso solo por el script de siembra, ver scripts/).
   ─────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    const sesion = getSessionUser(request);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const alcance = await obtenerAlcance(sesion.usuario_id, sesion.tipo_usuario);

    if (alcance.rol === "usuario") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    if (
      !body.correo ||
      !body.contrasena ||
      !body.nombre ||
      !body.apellido_paterno
    ) {
      return NextResponse.json(
        { error: "correo, contrasena, nombre y apellido_paterno son requeridos" },
        { status: 400 }
      );
    }

    let tipo_usuario: number;
    let edificio_id: number;

    if (alcance.rol === "admin_institucion") {
      tipo_usuario = 2;
      edificio_id = alcance.edificio_id;
    } else {
      // superadmin
      tipo_usuario = Number(body.tipo_usuario);

      if (![1, 2].includes(tipo_usuario)) {
        return NextResponse.json(
          { error: "tipo_usuario debe ser 1 (admin) o 2 (usuario)" },
          { status: 400 }
        );
      }

      const edificioIdRecibido = Number(body.edificio_id);
      if (!Number.isInteger(edificioIdRecibido) || edificioIdRecibido <= 0) {
        return NextResponse.json(
          { error: "edificio_id es requerido y debe ser válido" },
          { status: 400 }
        );
      }

      const edificioExiste = await prisma.edificio.findUnique({
        where: { edificio_id: edificioIdRecibido },
        select: { edificio_id: true },
      });

      if (!edificioExiste) {
        return NextResponse.json({ error: "edificio_id no existe" }, { status: 400 });
      }

      edificio_id = edificioIdRecibido;
    }

    const correoNormalizado = String(body.correo).trim().toLowerCase();

    const avatarGeneroRecibido = body.avatar_genero === "masculino" ? "masculino" : "femenino";

    const GENEROS_VALIDOS = ["femenino", "masculino", "otro", "prefiero_no_decir"];
    const generoRecibido = GENEROS_VALIDOS.includes(body.genero) ? body.genero : null;
    const telefonoRecibido =
      typeof body.telefono === "string" && body.telefono.trim() ? body.telefono.trim() : null;
    const fechaNacimientoRecibida =
      typeof body.fecha_nacimiento === "string" && body.fecha_nacimiento
        ? new Date(body.fecha_nacimiento)
        : null;

    const yaExiste = await prisma.usuario.findUnique({
      where: { correo: correoNormalizado },
      select: { usuario_id: true },
    });

    if (yaExiste) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(String(body.contrasena), 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        tipo_usuario,
        correo: correoNormalizado,
        nombre: String(body.nombre).trim(),
        apellido_paterno: String(body.apellido_paterno).trim(),
        apellido_materno: body.apellido_materno ? String(body.apellido_materno).trim() : null,
        contrasena: passwordHash,
        edificio_id,
        turno: body.turno ? String(body.turno) : null,
        tipo_cuenta: "empresa",
        avatar_genero: avatarGeneroRecibido,
        genero: generoRecibido,
        telefono: telefonoRecibido,
        fecha_nacimiento: fechaNacimientoRecibida,
        // onboarding_completo queda en false a propósito: el admin fija
        // institución y rol, pero el usuario sigue necesitando llenar
        // su propio perfil de bienestar (horas, tareas, dependientes)
        // la primera vez que entra a la app móvil.
      },
    });

    const { contrasena, ...usuarioSinPassword } = nuevoUsuario;
    return NextResponse.json(usuarioSinPassword, { status: 201 });
  } catch (error: unknown) {
    console.error("ERROR POST USUARIOS:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear usuario", detalle: mensaje },
      { status: 500 }
    );
  }
}
