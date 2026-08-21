import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { obtenerAlcance } from "@/lib/auth/institucion";

/* ───────────────────────────────────────────
   GET /api/admin/metricas?edificio_id=3

   - admin_institucion: siempre scoped a su propio edificio_id
     (el query param se ignora si lo manda).
   - superadmin: sin edificio_id -> métrica global (todos los
     usuarios, institucionales y personales). Con edificio_id ->
     métrica de esa institución específica.
   ─────────────────────────────────────────── */

type Tendencia = "subiendo" | "bajando" | "estable" | "sin_datos";

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

    // undefined = sin filtro (global). number = filtrado a esa institución.
    let edificioIdFiltro: number | undefined;

    if (alcance.rol === "admin_institucion") {
      edificioIdFiltro = alcance.edificio_id;
    } else if (edificioIdParam) {
      edificioIdFiltro = Number(edificioIdParam);
    }

    const usuarios = await prisma.usuario.findMany({
      where: edificioIdFiltro !== undefined ? { edificio_id: edificioIdFiltro } : {},
      select: { usuario_id: true },
    });

    const usuarioIds = usuarios.map((u) => u.usuario_id);

    if (usuarioIds.length === 0) {
      return NextResponse.json({
        total_usuarios: 0,
        usuarios_con_datos: 0,
        promedio_actual: null,
        distribucion: { bajo: 0, medio: 0, alto: 0 },
        tendencia: "sin_datos" as Tendencia,
        historico: [],
      });
    }

    // Snapshot más reciente de cada usuario (no queremos que alguien con
    // 50 registros pese más en el promedio que alguien con 1).
    const snapshotsRecientes = await prisma.$queryRaw<
      { usuario_id: number; valor: number }[]
    >`
      SELECT DISTINCT ON (usuario_id) usuario_id, valor
      FROM nivel_estres
      WHERE usuario_id = ANY(${usuarioIds})
      ORDER BY usuario_id, fecha DESC
    `;

    const promedio_actual =
      snapshotsRecientes.length > 0
        ? Math.round(
            snapshotsRecientes.reduce((acc, s) => acc + s.valor, 0) / snapshotsRecientes.length
          )
        : null;

    const distribucion = { bajo: 0, medio: 0, alto: 0 };
    for (const s of snapshotsRecientes) {
      if (s.valor <= 33) distribucion.bajo++;
      else if (s.valor <= 66) distribucion.medio++;
      else distribucion.alto++;
    }

    // Histórico: promedio diario de TODOS los registros (no solo el
    // más reciente por usuario) de los últimos 30 días, para la gráfica.
    const desde = new Date();
    desde.setDate(desde.getDate() - 30);

    const registros = await prisma.nivel_estres.findMany({
      where: { usuario_id: { in: usuarioIds }, fecha: { gte: desde } },
      select: { valor: true, fecha: true },
      orderBy: { fecha: "asc" },
    });

    const porDia = new Map<string, number[]>();
    for (const r of registros) {
      const dia = r.fecha.toISOString().slice(0, 10);
      if (!porDia.has(dia)) porDia.set(dia, []);
      porDia.get(dia)!.push(r.valor);
    }

    const historico = Array.from(porDia.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, valores]) => ({
        fecha,
        promedio: Math.round(valores.reduce((a, b) => a + b, 0) / valores.length),
      }));

    // Tendencia: promedio de los últimos 7 días vs los 7 anteriores.
    const hace7 = new Date();
    hace7.setDate(hace7.getDate() - 7);
    const hace14 = new Date();
    hace14.setDate(hace14.getDate() - 14);

    const ultimos7 = registros.filter((r) => r.fecha >= hace7);
    const anteriores7 = registros.filter((r) => r.fecha >= hace14 && r.fecha < hace7);

    const promUltimos7 = ultimos7.length
      ? ultimos7.reduce((a, r) => a + r.valor, 0) / ultimos7.length
      : null;
    const promAnteriores7 = anteriores7.length
      ? anteriores7.reduce((a, r) => a + r.valor, 0) / anteriores7.length
      : null;

    let tendencia: Tendencia = "sin_datos";
    if (promUltimos7 !== null && promAnteriores7 !== null) {
      const diferencia = promUltimos7 - promAnteriores7;
      if (diferencia > 5) tendencia = "subiendo";
      else if (diferencia < -5) tendencia = "bajando";
      else tendencia = "estable";
    }

    return NextResponse.json({
      total_usuarios: usuarioIds.length,
      usuarios_con_datos: snapshotsRecientes.length,
      promedio_actual,
      distribucion,
      tendencia,
      historico,
    });
  } catch (error) {
    console.error("Error en /api/admin/metricas:", error);
    return NextResponse.json({ error: "Error al calcular métricas" }, { status: 500 });
  }
}
