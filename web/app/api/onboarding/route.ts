import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { recalcularEstres } from "@/lib/estres";

/* ───────────────────────────────────────────
   POST /api/onboarding
   Body: {
     tipo_cuenta: "personal" | "empresa",
     avatar_genero: "femenino" | "masculino",
     edificio_id?,               // solo si tipo_cuenta === "empresa"
     horas_actividad_diaria,
     tareas_por_dia,
     tareas_pendientes_mes,
     personas_dependientes,
     nombres_dependientes?       // string[]
   }
   usuario_id sale de la sesión, no del body.
   ─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const sesion = getSessionUser(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      tipo_cuenta,
      avatar_genero,
      edificio_id,
      horas_actividad_diaria,
      tareas_por_dia,
      tareas_pendientes_mes,
      personas_dependientes,
      nombres_dependientes,
    } = body;

    if (
      !tipo_cuenta ||
      horas_actividad_diaria === undefined ||
      tareas_por_dia === undefined ||
      tareas_pendientes_mes === undefined
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (!["personal", "empresa"].includes(tipo_cuenta)) {
      return NextResponse.json({ error: "tipo_cuenta inválido" }, { status: 400 });
    }

    if (tipo_cuenta === "empresa" && !edificio_id) {
      return NextResponse.json(
        { error: "edificio_id es requerido para cuentas de empresa" },
        { status: 400 }
      );
    }

    const usuario_id = sesion.usuario_id;

    const [, perfil] = await prisma.$transaction([
      prisma.usuario.update({
        where: { usuario_id },
        data: {
          tipo_cuenta,
          avatar_genero: avatar_genero ?? "femenino",
          onboarding_completo: true,
          ...(tipo_cuenta === "empresa" ? { edificio_id: Number(edificio_id) } : {}),
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
