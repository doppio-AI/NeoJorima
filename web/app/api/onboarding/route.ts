import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { recalcularEstres } from "@/lib/estres";

/* ───────────────────────────────────────────
   POST /api/onboarding

   Ya NO recibe tipo_cuenta ni edificio_id: eso lo define
   /api/registro/mobile (siempre "personal") o el admin desde
   el dashboard al crear al usuario (siempre "empresa" + su
   edificio_id). Este endpoint solo llena el perfil de bienestar.

   Body: {
     avatar_genero: "femenino" | "masculino",
     horas_actividad_diaria,
     tareas_por_dia,
     tareas_pendientes_mes,
     personas_dependientes,
     nombres_dependientes?
   }
   ─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
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

    if (
      horas_actividad_diaria === undefined ||
      tareas_por_dia === undefined ||
      tareas_pendientes_mes === undefined
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const usuario_id = sesion.usuario_id;

    const [, perfil] = await prisma.$transaction([
      prisma.usuario.update({
        where: { usuario_id },
        data: {
          avatar_genero: avatar_genero ?? "femenino",
          onboarding_completo: true,
        },
      }),
      prisma.perfil_bienestar.upsert({
        where: { usuario_id },
        update: {
          horas_actividad_diaria: Number(horas_actividad_diaria),
          tareas_por_dia: Number(tareas_por_dia),
          tareas_pendientes_mes: Number(tareas_pendientes_mes),
          personas_dependientes: Number(personas_dependientes ?? 0),
          nombres_dependientes: nombres_dependientes ?? undefined,
        },
        create: {
          usuario_id,
          horas_actividad_diaria: Number(horas_actividad_diaria),
          tareas_por_dia: Number(tareas_por_dia),
          tareas_pendientes_mes: Number(tareas_pendientes_mes),
          personas_dependientes: Number(personas_dependientes ?? 0),
          nombres_dependientes: nombres_dependientes ?? undefined,
        },
      }),
    ]);

    const snapshot = await recalcularEstres(usuario_id);

    return NextResponse.json({
      mensaje: "Onboarding completado",
      perfil,
      nivel_estres: snapshot.valor,
    });
  } catch (error: any) {
    console.error("Error en /api/onboarding:", error);
    return NextResponse.json(
      { error: "Error al guardar el onboarding" },
      { status: 500 }
    );
  }
}
