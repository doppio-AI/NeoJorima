import { prisma } from "@/lib/prisma";

/* ───────────────────────────────────────────
   nivel_estres = 0.4 * factor_animo
                + 0.3 * factor_carga
                + 0.3 * factor_chat
   ─────────────────────────────────────────── */

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(n)));

const VALOR_ANIMO: Record<string, number> = {
  "muy mal": 100,
  mal: 75,
  regular: 50,
  bien: 25,
  "muy bien": 0,
};

const VALOR_RIESGO: Record<string, number> = {
  crisis: 100,
  alto: 85,
  medio: 50,
  bajo: 0,
};

async function calcularFactorAnimo(usuario_id: number): Promise<number> {
  const ultimoAnimo = await prisma.estado_animo_diario.findFirst({
    where: { usuario_id },
    orderBy: { fecha: "desc" },
  });

  if (!ultimoAnimo) return 50;

  const diasSinCheckin = Math.floor(
    (Date.now() - new Date(ultimoAnimo.fecha).getTime()) / (1000 * 60 * 60 * 24)
  );

  const base = VALOR_ANIMO[ultimoAnimo.estado] ?? 50;

  if (diasSinCheckin <= 1) return base;
  const decaimiento = Math.min(diasSinCheckin * 5, 50);
  return base > 50 ? base - decaimiento : base + decaimiento;
}

/* ── Factor de carga ──
   NUEVO: ahora prioriza el check-in diario (carga_diaria) sobre el
   valor fijo capturado en el onboarding. Si el usuario nunca ha hecho
   el check-in diario, se usa perfil_bienestar.tareas_pendientes_mes
   como antes (fallback). */
async function calcularFactorCarga(usuario_id: number): Promise<number> {
  const perfil = await prisma.perfil_bienestar.findUnique({
    where: { usuario_id },
  });

  if (!perfil) return 50;

  const ultimaCarga = await prisma.carga_diaria.findFirst({
    where: { usuario_id },
    orderBy: { fecha: "desc" },
  });

  const { horas_actividad_diaria, tareas_por_dia } = perfil;

  // Si hay un check-in diario reciente (últimos 3 días), pesa más que
  // el estimado fijo del onboarding. Si está viejo, se ignora y se
  // usa el valor del perfil para no operar con un dato obsoleto.
  const diasSinCheckin = ultimaCarga
    ? Math.floor((Date.now() - new Date(ultimaCarga.fecha).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const tareasPendientes =
    ultimaCarga && diasSinCheckin !== null && diasSinCheckin <= 3
      ? ultimaCarga.tareas_pendientes
      : perfil.tareas_pendientes_mes;

  const capacidadDiaria = Math.max(1, tareas_por_dia - horas_actividad_diaria / 4);

  const hoy = new Date();
  const finDeMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diasRestantes = Math.max(1, finDeMes - hoy.getDate());

  const capacidadRestante = capacidadDiaria * diasRestantes;
  const proporcion = tareasPendientes / capacidadRestante;

  return clamp(proporcion * 50);
}

async function calcularFactorChat(usuario_id: number): Promise<number> {
  const conversaciones = await prisma.conversacion.findMany({
    where: { usuario_id },
    select: { conversacion_id: true },
  });

  if (conversaciones.length === 0) return 0;

  const mensajesRecientes = await prisma.mensaje.findMany({
    where: {
      conversacion_id: { in: conversaciones.map((c) => c.conversacion_id) },
      role: "user",
      riesgo: { not: null },
    },
    orderBy: { fecha: "desc" },
    take: 10,
  });

  if (mensajesRecientes.length === 0) return 0;

  const suma = mensajesRecientes.reduce(
    (acc, m) => acc + (VALOR_RIESGO[m.riesgo ?? ""] ?? 0),
    0
  );

  return clamp(suma / mensajesRecientes.length);
}

export async function recalcularEstres(usuario_id: number) {
  const [factor_animo, factor_carga, factor_chat] = await Promise.all([
    calcularFactorAnimo(usuario_id),
    calcularFactorCarga(usuario_id),
    calcularFactorChat(usuario_id),
  ]);

  const valor = clamp(0.4 * factor_animo + 0.3 * factor_carga + 0.3 * factor_chat);

  return prisma.nivel_estres.create({
    data: { usuario_id, valor, factor_animo, factor_carga, factor_chat },
  });
}
