import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

function getIdFromRequest(request: NextRequest): number | null {
  const id = request.nextUrl.pathname.split("/").pop();
  const parsed = id ? Number(id) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: NextRequest) {
  try {
    const sesion = getSessionUser(request);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    const edificio = await prisma.edificio.findUnique({
      where: { edificio_id: id },
      include: { usuario: { select: { usuario_id: true, nombre: true, tipo_usuario: true } } },
    });

    if (!edificio) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json(edificio);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al buscar institución", detalle: mensaje },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sesion = getSessionUser(request);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (sesion.tipo_usuario !== 3) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    const body = await request.json();

    const updated = await prisma.edificio.update({
      where: { edificio_id: id },
      data: {
        ...(typeof body.nombre === "string" && { nombre: body.nombre.trim() }),
        ...(typeof body.descripcion === "string" && { descripcion: body.descripcion.trim() }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al actualizar institución", detalle: mensaje },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sesion = getSessionUser(request);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (sesion.tipo_usuario !== 3) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    await prisma.edificio.delete({ where: { edificio_id: id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar institución", detalle: mensaje },
      { status: 500 }
    );
  }
}
