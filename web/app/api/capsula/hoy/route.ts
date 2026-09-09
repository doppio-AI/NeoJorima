import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { obtenerCapsulaDeHoy } from "@/lib/capsulas";

/* ───────────────────────────────────────────
   GET /api/capsula/hoy

   Devuelve la cápsula de contenido del día para la persona,
   elegida según la categoría de su última clasificación de chat.
   No requiere estado propio: es determinística por día, así que
   siempre se puede volver a pedir sin efectos secundarios.
   ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const capsula = await obtenerCapsulaDeHoy(sesion.usuario_id);

    return NextResponse.json({ capsula });
  } catch (error: any) {
    console.error("Error en /api/capsula/hoy:", error);
    return NextResponse.json(
      { error: "Error al obtener la cápsula de hoy" },
      { status: 500 }
    );
  }
}
