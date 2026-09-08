import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

/* ───────────────────────────────────────────
   GET /api/intencion/hoy
   ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const registro = await prisma.intencion_diaria.findUnique({
      where: { usuario_id_fecha: { usuario_id: sesion.usuario_id, fecha: hoy } },
    });

    return NextResponse.json({
      ya_contesto: !!registro,
      texto: registro?.texto ?? null,
    });
  } catch (error: any) {
    console.error("Error en /api/intencion/hoy:", error);
    return NextResponse.json(
      { error: "Error al consultar la intención de hoy" },
      { status: 500 }
    );
  }
}
