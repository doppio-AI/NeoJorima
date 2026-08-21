import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSesionUsuario } from "@/lib/session";
import { obtenerAlcance } from "@/lib/auth/institucion";

/*
 * NUEVO: ya no es un set de roles sueltos — se usa el mismo obtenerAlcance
 * que ya scopea /api/usuarios y /api/admin/metricas por institución.
 *
 * - superadmin: ve TODAS las alertas (institucionales + de cuentas
 *   personales sin institución) — es la única vista con supervisión global.
 * - admin_institucion: ve SOLO alertas de usuarios de su propio edificio_id.
 *   Nunca ve cuentas personales (no tienen institución que las reciba).
 * - usuario (colaborador normal): 403. Un colaborador consulta su propia
 *   situación en /api/estres/mio, no en el panel agregado de alertas.
 */

/* ───────────────────────────────────────────
   GET /api/admin/alertas?atendida=false&nivel=crisis
   ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const sesion = getSesionUsuario(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const alcance = await obtenerAlcance(sesion.id, sesion.tipo_usuario);

    if (alcance.rol === "usuario") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const atendidaParam = searchParams.get("atendida");
    const nivel = searchParams.get("nivel");

    const where: Record<string, unknown> = {};
    if (atendidaParam !== null) where.atendida = atendidaParam === "true";
    if (nivel) where.nivel = nivel;

    // El filtro que faltaba: un admin_institucion SOLO ve alertas de
    // usuarios de su propio edificio_id. superadmin no agrega filtro
    // (ve todo, incluidas cuentas personales sin institución).
    if (alcance.rol === "admin_institucion") {
      where.usuario = { edificio_id: alcance.edificio_id };
    }

    const alertas = await prisma.alerta_riesgo.findMany({
      where,
      orderBy: [{ nivel: "desc" }, { created_at: "desc" }],
      take: 200,
      select: {
        alerta_id: true,
        nivel: true,
        categoria: true,
        resumen: true,
        atendida: true,
        atendida_por: true,
        atendida_en: true,
        notas_admin: true,
        created_at: true,
        conversacion_id: true,
        mensaje_id: true,
        usuario: {
          select: {
            usuario_id: true,
            nombre: true,
            apellido_paterno: true,
            edificio_id: true,
          },
        },
      },
    });

    return NextResponse.json({ alertas });
  } catch (error) {
    console.error("Error en GET /api/admin/alertas:", error);
    return NextResponse.json(
      { error: "Error al obtener alertas" },
      { status: 500 }
    );
  }
}

/* ───────────────────────────────────────────
   PATCH /api/admin/alertas
   Body: { alerta_id, atendida?, notas_admin? }
   ─────────────────────────────────────────── */

export async function PATCH(req: NextRequest) {
  try {
    const sesion = getSesionUsuario(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const alcance = await obtenerAlcance(sesion.id, sesion.tipo_usuario);

    if (alcance.rol === "usuario") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { alerta_id, atendida, notas_admin } = body;

    if (!alerta_id) {
      return NextResponse.json({ error: "Falta alerta_id" }, { status: 400 });
    }

    // Un admin_institucion solo puede tocar alertas de SU institución,
    // aunque conozca el alerta_id exacto de otra.
    if (alcance.rol === "admin_institucion") {
      const alerta = await prisma.alerta_riesgo.findUnique({
        where: { alerta_id: Number(alerta_id) },
        select: { usuario: { select: { edificio_id: true } } },
      });

      if (!alerta) {
        return NextResponse.json({ error: "Alerta no encontrada" }, { status: 404 });
      }

      if (alerta.usuario.edificio_id !== alcance.edificio_id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    const data: Record<string, unknown> = {};
    if (typeof atendida === "boolean") {
      data.atendida = atendida;
      data.atendida_por = atendida ? sesion.id : null;
      data.atendida_en = atendida ? new Date() : null;
    }
    if (typeof notas_admin === "string") {
      data.notas_admin = notas_admin;
    }

    const actualizada = await prisma.alerta_riesgo.update({
      where: { alerta_id: Number(alerta_id) },
      data,
    });

    return NextResponse.json({ alerta: actualizada });
  } catch (error) {
    console.error("Error en PATCH /api/admin/alertas:", error);
    return NextResponse.json(
      { error: "Error al actualizar alerta" },
      { status: 500 }
    );
  }
}