import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

const DIAS_HISTORIAL = 119; // 17 semanas completas, para armar un mapa de energía en columnas

/* ───────────────────────────────────────────
   GET /api/animo/historial

   Alimenta el "mapa de energía" (idea #3 de Enganche Sano):
   un registro por día de estado_animo_diario, para pintar un
   calendario visual en vez de un número o una gráfica de línea.
   ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - DIAS_HISTORIAL);

    const registros = await prisma.estado_animo_diario.findMany({
      where: { usuario_id: sesion.usuario_id, fecha: { gte: desde } },
      orderBy: { fecha: "asc" },
      select: { fecha: true, estado: true },
    });

    return NextResponse.json({ registros });
  } catch (error: any) {
    console.error("Error en /api/animo/historial:", error);
    return NextResponse.json(
      { error: "Error al obtener tu historial de ánimo" },
      { status: 500 }
    );
  }
}
