import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { obtenerAlcance } from "@/lib/auth/institucion";

/* ───────────────────────────────────────────
   GET /api/admin/metricas/usuarios?edificio_id=3

   Devuelve, por cada usuario en el alcance del admin, su snapshot
   más reciente de nivel_estres (con el desglose por factor), para
   que el admin vea a nivel individual quién necesita atención.
   Mismo scoping que /api/admin/metricas.
   ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const alcance = await obtenerAlcance(sesion.usuario_id, sesion.tipo_usuario);
    if (alcance.rol === "usuario") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const edificioIdParam = searchParams.get("edificio_id");

    let edificioIdFiltro: number | undefined;
    if (alcance.rol === "admin_institucion") {
      edificioIdFiltro = alcance.edificio_id;
    } else if (edificioIdParam) {
      edificioIdFiltro = Number(edificioIdParam);
    }

    const usuarios = await prisma.usuario.findMany({
      where: {
        ...(edificioIdFiltro !== undefined ? { edificio_id: edificioIdFiltro } : {}),
        tipo_usuario: 2, // solo colaboradores/usuarios finales, no admins ni superadmins
      },
      select: {
        usuario_id: true,
        nombre: true,
        apellido_paterno: true,
        correo: true,
        edificio: { select: { nombre: true } },
      },
      orderBy: { nombre: "asc" },
    });

    if (usuarios.length === 0) {
      return NextResponse.json({ usuarios: [] });
    }

    const usuarioIds = usuarios.map((u) => u.usuario_id);

    const snapshots = await prisma.$queryRaw<
      { usuario_id: number; valor: number; factor_animo: number; factor_carga: number; factor_chat: number; fecha: Date }[]
    >`
      SELECT DISTINCT ON (usuario_id) usuario_id, valor, factor_animo, factor_carga, factor_chat, fecha
      FROM nivel_estres
      WHERE usuario_id = ANY(${usuarioIds})
      ORDER BY usuario_id, fecha DESC
    `;

    const snapshotPorUsuario = new Map(snapshots.map((s) => [s.usuario_id, s]));

    const resultado = usuarios
      .map((u) => {
        const snap = snapshotPorUsuario.get(u.usuario_id);
        return {
          usuario_id: u.usuario_id,
          nombre: `${u.nombre} ${u.apellido_paterno}`,
          correo: u.correo,
          institucion: u.edificio?.nombre ?? null,
          nivel_estres: snap?.valor ?? null,
          factores: snap
            ? { animo: snap.factor_animo, carga: snap.factor_carga, chat: snap.factor_chat }
            : null,
          ultima_actualizacion: snap?.fecha ?? null,
        };
      })
      // usuarios con dato van primero, ordenados de mayor a menor estrés;
      // los que no tienen dato aún se quedan al final.
      .sort((a, b) => {
        if (a.nivel_estres === null && b.nivel_estres === null) return 0;
        if (a.nivel_estres === null) return 1;
        if (b.nivel_estres === null) return -1;
        return b.nivel_estres - a.nivel_estres;
      });

    return NextResponse.json({ usuarios: resultado });
  } catch (error) {
    console.error("Error en /api/admin/metricas/usuarios:", error);
    return NextResponse.json({ error: "Error al obtener el detalle por usuario" }, { status: 500 });
  }
}
