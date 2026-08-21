import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth/session";
import { obtenerAlcance, type Alcance } from "@/lib/auth/institucion";

function getIdFromRequest(request: NextRequest): number | null {
  const id = request.nextUrl.pathname.split("/").pop();
  const parsed = id ? Number(id) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/*
 * Verifica que quien hace la request tenga permiso sobre el usuario
 * objetivo (target).
 *
 * NUEVO: cualquier usuario puede ver/editar SU PROPIO registro (así
 * funciona la pantalla de "Mi Perfil" y la carga inicial de /usuarios),
 * sin necesitar ser admin. Esto se puede desactivar con
 * permitirSelf: false para acciones que no deberían auto-aplicarse,
 * como borrar la propia cuenta desde este endpoint.
 */
async function autorizarSobreObjetivo(
  request: NextRequest,
  targetId: number,
  opciones: { permitirSelf?: boolean } = {}
): Promise<
  | { ok: true; alcance: Alcance }
  | { ok: false; response: NextResponse }
> {
  const sesion = getSessionUser(request);
  if (!sesion) {
    return { ok: false, response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const permitirSelf = opciones.permitirSelf ?? true;
  if (permitirSelf && sesion.usuario_id === targetId) {
    return { ok: true, alcance: { rol: "usuario" } };
  }

  const alcance = await obtenerAlcance(sesion.usuario_id, sesion.tipo_usuario);

  if (alcance.rol === "usuario") {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  if (alcance.rol === "superadmin") {
    return { ok: true, alcance };
  }

  // admin_institucion: el objetivo debe pertenecer a su mismo edificio,
  // y no puede ser un admin (1) ni un superadmin (3).
  const target = await prisma.usuario.findUnique({
    where: { usuario_id: targetId },
    select: { edificio_id: true, tipo_usuario: true },
  });

  if (!target) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 }),
    };
  }

  if (target.edificio_id !== alcance.edificio_id || target.tipo_usuario !== 2) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  return { ok: true, alcance };
}

/* ───────────────────────────────────────────
   GET /api/usuarios/[id]
   ─────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  try {
    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json({ error: "Debe enviar un id válido" }, { status: 400 });
    }

    const auth = await autorizarSobreObjetivo(request, id);
    if (!auth.ok) return auth.response;

    const usuario = await prisma.usuario.findUnique({
      where: { usuario_id: id },
      include: { edificio: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const { contrasena, ...usuarioSinPassword } = usuario;
    return NextResponse.json(usuarioSinPassword);
  } catch (error) {
    console.error("ERROR GET USUARIO:", error);
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
  }
}

/* ───────────────────────────────────────────
   PUT /api/usuarios/[id]

   Whitelist explícita de campos. Un usuario editando su propio
   registro, o un admin_institucion editando a un colaborador suyo,
   NUNCA pueden tocar tipo_usuario ni edificio_id — eso solo lo puede
   hacer un superadmin.
   ─────────────────────────────────────────── */
export async function PUT(request: NextRequest) {
  try {
    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json({ error: "Debe enviar un id válido" }, { status: 400 });
    }

    const auth = await autorizarSobreObjetivo(request, id);
    if (!auth.ok) return auth.response;

    const body = await request.json();

    const dataToUpdate: Record<string, unknown> = {};

    if (typeof body.nombre === "string") dataToUpdate.nombre = body.nombre.trim();
    if (typeof body.apellido_paterno === "string")
      dataToUpdate.apellido_paterno = body.apellido_paterno.trim();
    if (typeof body.apellido_materno === "string")
      dataToUpdate.apellido_materno = body.apellido_materno.trim();
    if (typeof body.turno === "string") dataToUpdate.turno = body.turno;
    if (body.avatar_genero === "femenino" || body.avatar_genero === "masculino") {
      dataToUpdate.avatar_genero = body.avatar_genero;
    }

    const GENEROS_VALIDOS = ["femenino", "masculino", "otro", "prefiero_no_decir"];
    if (GENEROS_VALIDOS.includes(body.genero)) {
      dataToUpdate.genero = body.genero;
    }
    if (typeof body.telefono === "string") {
      dataToUpdate.telefono = body.telefono.trim() || null;
    }
    if (typeof body.fecha_nacimiento === "string") {
      dataToUpdate.fecha_nacimiento = body.fecha_nacimiento ? new Date(body.fecha_nacimiento) : null;
    }
    if (typeof body.contrasena === "string" && body.contrasena.length >= 8) {
      dataToUpdate.contrasena = await bcrypt.hash(body.contrasena, 10);
    }

    // Solo un superadmin puede reasignar rol o institución.
    if (auth.alcance.rol === "superadmin") {
      if (body.tipo_usuario !== undefined) {
        const tipo = Number(body.tipo_usuario);
        if ([1, 2].includes(tipo)) dataToUpdate.tipo_usuario = tipo;
      }
      if (body.edificio_id !== undefined) {
        const edif = Number(body.edificio_id);
        if (Number.isInteger(edif) && edif > 0) dataToUpdate.edificio_id = edif;
      }
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { usuario_id: id },
      data: dataToUpdate,
    });

    const { contrasena, ...usuarioSinPassword } = usuarioActualizado;
    return NextResponse.json(usuarioSinPassword);
  } catch (error: any) {
    console.error("ERROR PUT USUARIO:", error);
    return NextResponse.json({ error: error.message || "Error al actualizar" }, { status: 500 });
  }
}

/* ───────────────────────────────────────────
   DELETE /api/usuarios/[id]

   permitirSelf: false a propósito — nadie borra su propia cuenta
   desde este endpoint por accidente. Solo admin/superadmin borran
   (con el mismo scoping de siempre).
   ─────────────────────────────────────────── */
export async function DELETE(request: NextRequest) {
  try {
    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json({ error: "Debe enviar un id válido" }, { status: 400 });
    }

    const auth = await autorizarSobreObjetivo(request, id, { permitirSelf: false });
    if (!auth.ok) return auth.response;

    await prisma.usuario.delete({ where: { usuario_id: id } });

    return NextResponse.json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error("ERROR DELETE USUARIO:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
