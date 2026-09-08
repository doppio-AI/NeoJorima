import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { obtenerRacha } from "@/lib/racha";

/* ───────────────────────────────────────────
   GET /api/animo/hoy
   ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [registro, racha] = await Promise.all([
      prisma.estado_animo_diario.findUnique({
        where: { usuario_id_fecha: { usuario_id: sesion.usuario_id, fecha: hoy } },
      }),
      obtenerRacha(sesion.usuario_id),
    ]);

    return NextResponse.json({
      ya_contesto: !!registro,
      estado: registro?.estado ?? null,
      racha,
    });
  } catch (error: any) {
    console.error("Error en /api/animo/hoy:", error);
    return NextResponse.json(
      { error: "Error al consultar el ánimo de hoy" },
      { status: 500 }
    );
  }
}
