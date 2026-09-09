import { authFetch } from "@/lib/api";

export type ActividadRelajacion = {
  id: string;
  tipo: "respiracion" | "estiramiento" | "juego" | "asmr" | "capsula";
  titulo: string;
  descripcion: string;
  duracion_seg: number;
  pantalla: string;
};

export type Capsula = {
  id: string;
  titulo: string;
  texto: string;
  duracion_seg: number;
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

/* ── GET /api/capsula/hoy ──
   La cápsula de contenido del día, elegida por categoría. */
export async function obtenerCapsulaDeHoy(): Promise<Capsula | null> {
  try {
    const res = await authFetch("/api/capsula/hoy");
    const data = await res.json();
    return data?.capsula ?? null;
  } catch {
    return null;
  }
}

/* ── GET /api/relajacion/conteo ──
   Contador acumulativo de pausas activas completadas, para siempre
   (jorima-estilo-duolingo.md, bloque 11/12). */
export async function obtenerConteoRelajacion(): Promise<number> {
  try {
    const res = await authFetch("/api/relajacion/conteo");
    const data = await res.json();
    return typeof data?.total === "number" ? data.total : 0;
  } catch {
    return 0;
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
