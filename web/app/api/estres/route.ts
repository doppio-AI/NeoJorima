import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { recalcularEstres } from "@/lib/estres";

/* ───────────────────────────────────────────
   GET /api/estres?dias=30
   ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dias = Number(searchParams.get("dias") ?? 30);
    const usuario_id = sesion.usuario_id;

    const desde = new Date();
    desde.setDate(desde.getDate() - dias);

    let historico = await prisma.nivel_estres.findMany({
      where: { usuario_id, fecha: { gte: desde } },
      orderBy: { fecha: "asc" },
    });

    if (historico.length === 0) {
      const primero = await recalcularEstres(usuario_id);
      historico = [primero];
    }

    const actual = historico[historico.length - 1];

    return NextResponse.json({
      actual: {
        valor: actual.valor,
        factor_animo: actual.factor_animo,
        factor_carga: actual.factor_carga,
        factor_chat: actual.factor_chat,
        fecha: actual.fecha,
      },
      historico,
    });
  } catch (error: any) {
    console.error("Error en /api/estres:", error);
    return NextResponse.json(
      { error: "Error al obtener el nivel de estrés" },
      { status: 500 }
    );
  }
}
