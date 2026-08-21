import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

/* ───────────────────────────────────────────
   GET /api/edificios
   Cualquier usuario autenticado puede listarlas (nombres nada más) —
   lo necesita, por ejemplo, cualquier flujo que muestre instituciones
   disponibles. No expone nada sensible.
   ─────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  try {
    const sesion = getSessionUser(request);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const edificios = await prisma.edificio.findMany({
      select: { edificio_id: true, nombre: true, descripcion: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(edificios);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al listar instituciones", detalle: mensaje },
      { status: 500 }
    );
  }
}

/* ───────────────────────────────────────────
   POST /api/edificios
   Exclusivo de superadmin (tipo_usuario === 3).
   ─────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    const sesion = getSessionUser(request);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (sesion.tipo_usuario !== 3) {
      return NextResponse.json(
        { error: "Solo un superadmin puede registrar instituciones" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (typeof body.nombre !== "string" || !body.nombre.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const nueva = await prisma.edificio.create({
      data: {
        nombre: body.nombre.trim(),
        descripcion: typeof body.descripcion === "string" ? body.descripcion.trim() : null,
      },
    });

    return NextResponse.json(nueva, { status: 201 });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear institución", detalle: mensaje },
      { status: 500 }
    );
  }
}
