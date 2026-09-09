import { authFetch } from "@/lib/api";

export type RegistroAnimo = { fecha: string; estado: string };

/* ── GET /api/animo/historial ──
   Alimenta el mapa de energía: un registro por día de ánimo. */
export async function obtenerHistorialAnimo(): Promise<RegistroAnimo[]> {
  try {
    const res = await authFetch("/api/animo/historial");
    const data = await res.json();
    return Array.isArray(data?.registros) ? data.registros : [];
  } catch {
    return [];
  }
}
