import { prisma } from "@/lib/prisma";

/* ═══════════════════════════════════════════════════════════
   Racha de bienestar — "racha con raíz"

   Origen: idea de producto "Enganche Sano". El scroll infinito
   engancha con rachas que castigan (se rompen a cero y borran
   el esfuerzo). Aquí hacemos lo contrario a propósito:

   - racha_actual nunca es una amenaza. Si se falta un día, no
     se reinicia a cero: se retoma desde la raíz que ya se ganó.
   - racha_raiz es un piso que solo puede subir. Cada semana
     completa (racha_actual llega a un múltiplo de 7) consolida
     la mitad del progreso como raíz, para siempre.
   - mejor_racha es un máximo histórico personal, solo visible
     para la propia persona — nunca se compara contra nadie más.

   Esta función es la única que debe escribir en la tabla
   racha_bienestar. Se llama una vez por check-in de ánimo
   (ver app/api/animo/route.ts), y es idempotente si ya se
   registró hoy.
   ═══════════════════════════════════════════════════════════ */

export type RachaSnapshot = {
  racha_actual: number;
  racha_raiz: number;
  mejor_racha: number;
};

const MS_DIA = 1000 * 60 * 60 * 24;

function normalizarFecha(fecha: Date): Date {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function diasEntre(desde: Date, hasta: Date): number {
  return Math.round(
    (normalizarFecha(hasta).getTime() - normalizarFecha(desde).getTime()) / MS_DIA
  );
}

function snapshot(r: {
  racha_actual: number;
  racha_raiz: number;
  mejor_racha: number;
}): RachaSnapshot {
  return {
    racha_actual: r.racha_actual,
    racha_raiz: r.racha_raiz,
    mejor_racha: r.mejor_racha,
  };
}

/**
 * Registra un check-in de bienestar (hoy) y devuelve la racha
 * actualizada. Idempotente: llamarla varias veces el mismo día
 * no cambia el resultado.
 */
export async function actualizarRacha(
  usuario_id: number,
  fechaCheckIn: Date
): Promise<RachaSnapshot> {
  const hoy = normalizarFecha(fechaCheckIn);

  const existente = await prisma.racha_bienestar.findUnique({
    where: { usuario_id },
  });

  // Primer check-in de la persona: nace la racha en 1.
  if (!existente) {
    const creado = await prisma.racha_bienestar.create({
      data: {
        usuario_id,
        racha_actual: 1,
        racha_raiz: 0,
        mejor_racha: 1,
        ultima_fecha: hoy,
      },
    });
    return snapshot(creado);
  }

  const gap = existente.ultima_fecha ? diasEntre(existente.ultima_fecha, hoy) : null;

  // Ya se registró hoy (o el reloj se movió hacia atrás): no tocar nada.
  if (gap !== null && gap <= 0) {
    return snapshot(existente);
  }

  const racha_actual =
    gap === 1
      ? existente.racha_actual + 1 // día consecutivo
      : existente.racha_raiz + 1; // se perdió un día o más: retoma desde la raíz, NUNCA desde 0

  // Cada semana completa consolida la mitad del progreso como raíz permanente.
  let racha_raiz = existente.racha_raiz;
  if (racha_actual % 7 === 0) {
    racha_raiz = Math.max(racha_raiz, Math.floor(racha_actual / 2));
  }

  const mejor_racha = Math.max(existente.mejor_racha, racha_actual);

  const actualizado = await prisma.racha_bienestar.update({
    where: { usuario_id },
    data: { racha_actual, racha_raiz, mejor_racha, ultima_fecha: hoy },
  });

  return snapshot(actualizado);
}

/**
 * Lectura de la racha sin modificarla. Útil para pintar la UI
 * antes de que la persona conteste el check-in de hoy.
 */
export async function obtenerRacha(usuario_id: number): Promise<RachaSnapshot> {
  const existente = await prisma.racha_bienestar.findUnique({
    where: { usuario_id },
  });

  if (!existente) {
    return { racha_actual: 0, racha_raiz: 0, mejor_racha: 0 };
  }

  return snapshot(existente);
}
