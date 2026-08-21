import { prisma } from "@/lib/prisma";

/*
 * Roles (tipo_usuario):
 *   1 = admin de institución (solo ve/gestiona su propio edificio_id)
 *   2 = usuario / colaborador
 *   3 = superadmin (todas las instituciones)
 *
 * El alcance de un admin de institución se resuelve consultando su
 * edificio_id FRESCO en cada request (no se guarda en el token/cookie),
 * para que si un superadmin reasigna a un admin a otra institución,
 * el cambio aplique de inmediato sin esperar a que expire su sesión.
 */

export type Alcance =
  | { rol: "superadmin" }
  | { rol: "admin_institucion"; edificio_id: number }
  | { rol: "usuario" };

export async function obtenerAlcance(
  usuario_id: number,
  tipo_usuario: number
): Promise<Alcance> {
  if (tipo_usuario === 3) {
    return { rol: "superadmin" };
  }

  if (tipo_usuario === 1) {
    const admin = await prisma.usuario.findUnique({
      where: { usuario_id },
      select: { edificio_id: true },
    });

    if (!admin?.edificio_id) {
      // Un admin sin institución asignada no debería poder gestionar nada.
      return { rol: "usuario" };
    }

    return { rol: "admin_institucion", edificio_id: admin.edificio_id };
  }

  return { rol: "usuario" };
}
