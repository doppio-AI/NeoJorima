import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { recalcularEstres } from "@/lib/estres";

const ESTADOS_VALIDOS = ["muy mal", "mal", "regular", "bien", "muy bien"];

/* ───────────────────────────────────────────
   POST /api/animo
   Body: { estado }
   Un check-in por día por usuario (upsert).
   ─────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { estado } = body;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        { error: `estado inválido, valores permitidos: ${ESTADOS_VALIDOS.join(", ")}` },
        { status: 400 }
      );
    }

    const usuario_id = sesion.usuario_id;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const registro = await prisma.estado_animo_diario.upsert({
      where: { usuario_id_fecha: { usuario_id, fecha: hoy } },
      update: { estado },
      create: { usuario_id, estado, fecha: hoy },
    });

    const snapshot = await recalcularEstres(usuario_id);

    return NextResponse.json({ registro, nivel_estres: snapshot.valor });
  } catch (error: any) {
    console.error("Error en /api/animo:", error);
    return NextResponse.json({ error: "Error al registrar el ánimo" }, { status: 500 });
  }
}
