import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { recalcularEstres } from "@/lib/estres";

/* ───────────────────────────────────────────
   GET /api/perfil
   ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { usuario_id: sesion.usuario_id },
      select: {
        usuario_id: true,
        nombre: true,
        tipo_cuenta: true,
        avatar_genero: true,
        onboarding_completo: true,
        perfil_bienestar: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error: any) {
    console.error("Error en GET /api/perfil:", error);
    return NextResponse.json({ error: "Error al obtener el perfil" }, { status: 500 });
  }
}

/* ───────────────────────────────────────────
   PUT /api/perfil
   Body: { avatar_genero?, ...campos de perfil_bienestar }
   ─────────────────────────────────────────── */
export async function PUT(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      avatar_genero,
      horas_actividad_diaria,
      tareas_por_dia,
      tareas_pendientes_mes,
      personas_dependientes,
      nombres_dependientes,
    } = body;

    const usuario_id = sesion.usuario_id;

    if (avatar_genero) {
      await prisma.usuario.update({
        where: { usuario_id },
        data: { avatar_genero },
      });
    }

    const perfil = await prisma.perfil_bienestar.update({
      where: { usuario_id },
      data: {
        ...(horas_actividad_diaria !== undefined && {
          horas_actividad_diaria: Number(horas_actividad_diaria),
        }),
        ...(tareas_por_dia !== undefined && {
          tareas_por_dia: Number(tareas_por_dia),
        }),
        ...(tareas_pendientes_mes !== undefined && {
          tareas_pendientes_mes: Number(tareas_pendientes_mes),
        }),
        ...(personas_dependientes !== undefined && {
          personas_dependientes: Number(personas_dependientes),
        }),
        ...(nombres_dependientes !== undefined && { nombres_dependientes }),
      },
    });

    const snapshot = await recalcularEstres(usuario_id);

    return NextResponse.json({ perfil, nivel_estres: snapshot.valor });
  } catch (error: any) {
    console.error("Error en PUT /api/perfil:", error);
    return NextResponse.json({ error: "Error al actualizar el perfil" }, { status: 500 });
  }
}
