import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

/* ───────────────────────────────────────────
   GET /api/carga/hoy
   ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const registro = await prisma.carga_diaria.findUnique({
      where: { usuario_id_fecha: { usuario_id: sesion.usuario_id, fecha: hoy } },
    });

    return NextResponse.json({
      ya_contesto: !!registro,
      tareas_pendientes: registro?.tareas_pendientes ?? null,
    });
  } catch (error: any) {
    console.error("Error en /api/carga/hoy:", error);
    return NextResponse.json(
      { error: "Error al consultar la carga de hoy" },
      { status: 500 }
    );
  }
}
