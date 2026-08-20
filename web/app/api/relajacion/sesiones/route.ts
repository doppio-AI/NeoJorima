import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

const TIPOS_VALIDOS = ["respiracion", "estiramiento", "juego", "asmr"];

/* ───────────────────────────────────────────
   POST /api/relajacion/sesiones
   Body: { tipo, duracion_seg, completada }
   ─────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { tipo, duracion_seg, completada } = body;

    if (!tipo || duracion_seg === undefined) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        { error: `tipo inválido, valores permitidos: ${TIPOS_VALIDOS.join(", ")}` },
        { status: 400 }
      );
    }

    const sesionRelajacion = await prisma.sesion_relajacion.create({
      data: {
        usuario_id: sesion.usuario_id,
        tipo,
        duracion_seg: Number(duracion_seg),
        completada: completada ?? true,
      },
    });

    return NextResponse.json({ sesion: sesionRelajacion });
  } catch (error: any) {
    console.error("Error en /api/relajacion/sesiones:", error);
    return NextResponse.json(
      { error: "Error al registrar la sesión de relajación" },
      { status: 500 }
    );
  }
}
