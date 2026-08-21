import { authFetch } from "@/lib/api";

export type ActividadRelajacion = {
  id: string;
  tipo: "respiracion" | "estiramiento" | "juego" | "asmr";
  titulo: string;
  descripcion: string;
  duracion_seg: number;
  pantalla: string;
};

/* ── GET /api/relajacion/catalogo ──
   No requiere sesión a nivel de lógica de negocio, pero el middleware
   sí exige que la petición traiga Authorization: Bearer (o cookie) para
   cualquier /api/*, así que usamos authFetch igual. */
export async function obtenerCatalogoRelajacion(): Promise<ActividadRelajacion[]> {
  try {
    const res = await authFetch("/api/relajacion/catalogo");
    const data = await res.json();
    return Array.isArray(data.catalogo) ? data.catalogo : [];
  } catch {
    return [];
  }
}

/* ── POST /api/relajacion/sesiones ──
   No bloqueamos la experiencia si falla: es un registro secundario. */
export async function registrarSesionRelajacion(params: {
  tipo: string;
  duracion_seg: number;
  completada: boolean;
}): Promise<void> {
  try {
    await authFetch("/api/relajacion/sesiones", {
      method: "POST",
      body: JSON.stringify(params),
    });
  } catch {
    // silencioso a propósito
  }
}

/* ── GET /api/perfil → nombres_dependientes ──
   Usado por el mensaje motivador al final de cada actividad. */
export async function obtenerNombresDependientes(): Promise<string[]> {
  try {
    const res = await authFetch("/api/perfil");
    const data = await res.json();
    const nombres = data?.perfil_bienestar?.nombres_dependientes;
    return Array.isArray(nombres) ? nombres.filter((n: unknown) => typeof n === "string") : [];
  } catch {
    return [];
  }
}
