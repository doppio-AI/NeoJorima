import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { recalcularEstres } from "@/lib/estres";

/* ───────────────────────────────────────────
   POST /api/carga
   Body: { tareas_pendientes: number }
   Un check-in por día por usuario (upsert), igual que /api/animo.
   ─────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { tareas_pendientes } = body;

    if (
      tareas_pendientes === undefined ||
      !Number.isFinite(Number(tareas_pendientes)) ||
      Number(tareas_pendientes) < 0
    ) {
      return NextResponse.json(
        { error: "tareas_pendientes debe ser un número mayor o igual a 0" },
        { status: 400 }
      );
    }

    const usuario_id = sesion.usuario_id;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const registro = await prisma.carga_diaria.upsert({
      where: { usuario_id_fecha: { usuario_id, fecha: hoy } },
      update: { tareas_pendientes: Number(tareas_pendientes) },
      create: { usuario_id, tareas_pendientes: Number(tareas_pendientes), fecha: hoy },
    });

    const snapshot = await recalcularEstres(usuario_id);

    return NextResponse.json({ registro, nivel_estres: snapshot.valor });
  } catch (error: any) {
    console.error("Error en /api/carga:", error);
    return NextResponse.json(
      { error: "Error al registrar la carga de tareas" },
      { status: 500 }
    );
  }
}
