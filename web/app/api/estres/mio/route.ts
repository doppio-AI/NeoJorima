import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

/* ───────────────────────────────────────────
   GET /api/estres/mio

   A diferencia de /api/estres (que es para admins viendo a otros),
   este endpoint es siempre sobre uno mismo — no requiere ningún rol
   especial, cualquier usuario autenticado puede consultar el suyo.

   Devuelve no solo el score de 0-100, sino los datos crudos que lo
   alimentan (tu último ánimo reportado, tus tareas pendientes, etc.)
   para que la persona entienda de dónde sale el número, no solo verlo.
   ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario_id = sesion.usuario_id;

    const [usuario, ultimoSnapshot, ultimoAnimo, ultimaCarga] = await Promise.all([
      prisma.usuario.findUnique({
        where: { usuario_id },
        select: { tipo_cuenta: true },
      }),
      prisma.nivel_estres.findFirst({
        where: { usuario_id },
        orderBy: { fecha: "desc" },
      }),
      prisma.estado_animo_diario.findFirst({
        where: { usuario_id },
        orderBy: { fecha: "desc" },
      }),
      prisma.carga_diaria.findFirst({
        where: { usuario_id },
        orderBy: { fecha: "desc" },
      }),
    ]);

    const desde = new Date();
    desde.setDate(desde.getDate() - 30);

    const historico = await prisma.nivel_estres.findMany({
      where: { usuario_id, fecha: { gte: desde } },
      orderBy: { fecha: "asc" },
      select: { valor: true, fecha: true },
    });

    const [alertasTotal, alertasPendientes, ultimaAlerta] = await Promise.all([
      prisma.alerta_riesgo.count({ where: { usuario_id } }),
      prisma.alerta_riesgo.count({ where: { usuario_id, atendida: false } }),
      prisma.alerta_riesgo.findFirst({
        where: { usuario_id },
        orderBy: { created_at: "desc" },
        select: { created_at: true, categoria: true },
      }),
    ]);

    return NextResponse.json({
      nivel_actual: ultimoSnapshot?.valor ?? null,
      ultima_actualizacion: ultimoSnapshot?.fecha ?? null,
      factores: ultimoSnapshot
        ? {
            animo: ultimoSnapshot.factor_animo,
            carga: ultimoSnapshot.factor_carga,
            chat: ultimoSnapshot.factor_chat,
          }
        : null,

      // Datos crudos detrás de cada factor — no solo el número.
      datos_animo: ultimoAnimo
        ? { estado: ultimoAnimo.estado, fecha: ultimoAnimo.fecha }
        : null,
      datos_carga: ultimaCarga
        ? { tareas_pendientes: ultimaCarga.tareas_pendientes, fecha: ultimaCarga.fecha }
        : null,

      historico: historico.map((h) => ({ fecha: h.fecha, valor: h.valor })),

      alertas: {
        pertenece_institucion: usuario?.tipo_cuenta === "empresa",
        total: alertasTotal,
        pendientes: alertasPendientes,
        ultima_fecha: ultimaAlerta?.created_at ?? null,
        ultima_categoria: ultimaAlerta?.categoria ?? null,
      },
    });
  } catch (error) {
    console.error("Error en /api/estres/mio:", error);
    return NextResponse.json(
      { error: "Error al obtener tu nivel de estrés" },
      { status: 500 }
    );
  }
}
