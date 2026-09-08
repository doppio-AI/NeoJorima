import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

const MAX_LARGO = 140;

/* ───────────────────────────────────────────
   POST /api/intencion
   Body: { texto: string }
   Un check-in por día por usuario (upsert), igual que /api/animo
   y /api/carga. No alimenta el cálculo de estrés — es solo un
   recordatorio que la persona se pone a sí misma.
   ─────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const texto = typeof body?.texto === "string" ? body.texto.trim() : "";

    if (!texto) {
      return NextResponse.json({ error: "Escribe una intención para hoy" }, { status: 400 });
    }
    if (texto.length > MAX_LARGO) {
      return NextResponse.json(
        { error: `La intención no puede superar los ${MAX_LARGO} caracteres` },
        { status: 400 }
      );
    }

    const usuario_id = sesion.usuario_id;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const registro = await prisma.intencion_diaria.upsert({
      where: { usuario_id_fecha: { usuario_id, fecha: hoy } },
      update: { texto },
      create: { usuario_id, texto, fecha: hoy },
    });

    return NextResponse.json({ registro });
  } catch (error: any) {
    console.error("Error en /api/intencion:", error);
    return NextResponse.json(
      { error: "Error al registrar tu intención del día" },
      { status: 500 }
    );
  }
}
