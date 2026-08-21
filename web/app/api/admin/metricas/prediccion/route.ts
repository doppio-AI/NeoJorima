import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { obtenerAlcance } from "@/lib/auth/institucion";
import { predecirEstres } from "@/lib/ml-estres";

export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const alcance = await obtenerAlcance(sesion.usuario_id, sesion.tipo_usuario);
    if (alcance.rol === "usuario") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const edificioIdParam = searchParams.get("edificio_id");

    let edificioIdFiltro: number | undefined;
    let cacheKey: string;

    if (alcance.rol === "admin_institucion") {
      edificioIdFiltro = alcance.edificio_id;
      cacheKey = `edificio:${edificioIdFiltro}`;
    } else if (edificioIdParam) {
      edificioIdFiltro = Number(edificioIdParam);
      cacheKey = `edificio:${edificioIdFiltro}`;
    } else {
      cacheKey = "global";
    }

    const usuarios = await prisma.usuario.findMany({
      where: edificioIdFiltro !== undefined ? { edificio_id: edificioIdFiltro } : {},
      select: { usuario_id: true },
    });

    const usuarioIds = usuarios.map((u) => u.usuario_id);

    const prediccion = await predecirEstres(cacheKey, usuarioIds);

    return NextResponse.json(prediccion);
  } catch (error) {
    console.error("Error en /api/admin/metricas/prediccion:", error);
    return NextResponse.json({ error: "Error al calcular la predicción" }, { status: 500 });
  }
}
