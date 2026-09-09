import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

/* ───────────────────────────────────────────
   GET /api/relajacion/conteo

   Contador acumulativo de pausas activas completadas, para siempre
   (jorima-estilo-duolingo.md, bloque 11/12): "23 pausas activas
   desde que empezaste". Nunca se reinicia — es un COUNT de
   sesion_relajacion, no un valor que se pueda perder por un mal día.
   ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const total = await prisma.sesion_relajacion.count({
      where: { usuario_id: sesion.usuario_id, completada: true },
    });

    return NextResponse.json({ total });
  } catch (error: any) {
    console.error("Error en /api/relajacion/conteo:", error);
    return NextResponse.json(
      { error: "Error al obtener tu conteo de pausas activas" },
      { status: 500 }
    );
  }
}
