import * as tf from "@tensorflow/tfjs";
import { prisma } from "@/lib/prisma";

/*
 * Adaptación de lib/ml.ts (la red neuronal original de "Ambiente Laboral",
 * que se deja intacta) para trabajar con nivel_estres (escala 0-100,
 * donde MÁS alto = MÁS estrés) en vez de encuestas 1-5 (donde MÁS alto =
 * MÁS bienestar). Misma arquitectura y misma lógica de entrenamiento;
 * solo cambia la normalización de escala y de dónde saca los datos.
 */

type RiesgoNivel = "bajo" | "medio" | "alto" | "crítico";
type Tendencia = "subiendo" | "bajando" | "estable";

type EstadisticasModelo = {
  media: number;
  varianza: number;
  desviacion: number;
  pendiente: number;
  tendencia: Tendencia;
  muestra: number;
  mae: number;
  rmse: number;
  confianza: number;
};

type Interpretacion = {
  resumen: string;
  recomendaciones: string[];
  factores: { tendencia: number; volatilidad: number; consistencia: number };
};

export type PrediccionEstres = {
  historico: number[];
  prediccion: number;
  estadisticas: EstadisticasModelo | null;
  probabilidad: number;
  riesgo: RiesgoNivel | "sin datos" | "error";
  alerta: boolean;
  interpretacion: Interpretacion | null;
};

type PredCacheEntry = { expiresAt: number; result: PrediccionEstres };

const PREDICTION_CACHE_TTL_MS = 2 * 60 * 1000;
const predictionCache = new Map<string, PredCacheEntry>();

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function promedio(nums: number[]) {
  return nums.reduce((acc, n) => acc + n, 0) / nums.length;
}

/* ── Serie diaria de nivel_estres promedio, para el scope dado ── */
async function obtenerSerieDiaria(usuarioIds: number[]): Promise<number[]> {
  if (usuarioIds.length === 0) return [];

  const registros = await prisma.nivel_estres.findMany({
    where: { usuario_id: { in: usuarioIds } },
    orderBy: { fecha: "asc" },
    select: { fecha: true, valor: true },
  });

  const porDia = new Map<string, number[]>();
  for (const r of registros) {
    const dia = r.fecha.toISOString().slice(0, 10);
    if (!porDia.has(dia)) porDia.set(dia, []);
    porDia.get(dia)!.push(r.valor);
  }

  return Array.from(porDia.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, valores]) => Number(promedio(valores).toFixed(3)));
}

function calcularEstadisticas(data: number[]) {
  const n = data.length;
  const media = promedio(data);

  const varianza =
    data.reduce((acc, value) => acc + (value - media) ** 2, 0) / n;
  const desviacion = Math.sqrt(varianza);

  const xMean = (n - 1) / 2;
  const numerador = data.reduce((acc, y, i) => acc + (i - xMean) * (y - media), 0);
  const denominador = data.reduce((acc, _y, i) => acc + (i - xMean) ** 2, 0);
  const pendiente = denominador === 0 ? 0 : numerador / denominador;

  let tendencia: Tendencia = "estable";
  // Umbral distinto al original: aquí la escala es 0-100, no 1-5.
  if (pendiente > 0.3) tendencia = "subiendo"; // subiendo = empeorando (más estrés)
  if (pendiente < -0.3) tendencia = "bajando"; // bajando = mejorando (menos estrés)

  return { media, varianza, desviacion, pendiente, tendencia, muestra: n };
}

function crearModelo() {
  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      units: 16,
      inputShape: [1],
      activation: "relu",
      kernelInitializer: "heNormal",
    })
  );
  model.add(tf.layers.dropout({ rate: 0.08 }));
  model.add(
    tf.layers.dense({ units: 8, activation: "relu", kernelInitializer: "heNormal" })
  );
  model.add(tf.layers.dense({ units: 1, activation: "linear" }));

  model.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" });

  return model;
}

async function entrenarYPredecir(data: number[]) {
  const n = data.length;
  const xMax = Math.max(1, n - 1);

  const xValues = data.map((_v, index) => [index / xMax]);
  // Escala 0-100 -> 0-1 (antes era (value-1)/4 para escala 1-5)
  const yValues = data.map((value) => [value / 100]);

  const xs = tf.tensor2d(xValues);
  const ys = tf.tensor2d(yValues);

  const model = crearModelo();

  await model.fit(xs, ys, {
    epochs: 120,
    batchSize: Math.min(8, n),
    verbose: 0,
    shuffle: false,
  });

  const trainPred = model.predict(xs) as tf.Tensor;
  const trainPredData = await trainPred.data();

  const maeRaw =
    yValues.reduce((acc, y, i) => acc + Math.abs(y[0] - trainPredData[i]), 0) / n;
  const rmseRaw = Math.sqrt(
    yValues.reduce((acc, y, i) => acc + (y[0] - trainPredData[i]) ** 2, 0) / n
  );

  const nextInput = tf.tensor2d([[n / xMax]]);
  const nextPred = model.predict(nextInput) as tf.Tensor;
  const nextRaw = (await nextPred.data())[0];

  xs.dispose();
  ys.dispose();
  trainPred.dispose();
  nextInput.dispose();
  nextPred.dispose();
  model.dispose();

  // Escala 0-100 (antes era 1 + nextRaw*4 para escala 1-5)
  const prediccionEscala = clamp(nextRaw * 100, 0, 100);

  return {
    prediccion: Number(prediccionEscala.toFixed(2)),
    mae: Number((maeRaw * 100).toFixed(3)),
    rmse: Number((rmseRaw * 100).toFixed(3)),
    confianza: Number(clamp(1 - rmseRaw, 0, 1).toFixed(3)),
  };
}

/* Probabilidad de riesgo: aquí ya NO se invierte (a diferencia del
   original), porque en nivel_estres alto YA significa más riesgo. */
function calcularProbabilidad(prediccionEscala100: number) {
  return clamp(prediccionEscala100 / 100, 0, 1);
}

function nivelRiesgo(probabilidad: number): RiesgoNivel {
  if (probabilidad >= 0.75) return "crítico";
  if (probabilidad >= 0.55) return "alto";
  if (probabilidad >= 0.3) return "medio";
  return "bajo";
}

function construirInterpretacion(
  stats: ReturnType<typeof calcularEstadisticas>,
  confianza: number,
  riesgo: RiesgoNivel
): Interpretacion {
  const tendenciaFactor = clamp(Math.abs(stats.pendiente) / 5, 0, 1);
  const volatilidadFactor = clamp(stats.desviacion / 40, 0, 1);
  const consistenciaFactor = clamp(confianza, 0, 1);

  let resumen = "Bienestar estable con riesgo controlado.";
  if (riesgo === "medio") resumen = "Hay señales tempranas de desgaste en el grupo.";
  if (riesgo === "alto") resumen = "El nivel de estrés es alto; se recomienda intervención pronta.";
  if (riesgo === "crítico") resumen = "El nivel de estrés es crítico; se requiere atención urgente.";

  if (stats.tendencia === "subiendo") {
    resumen += " La tendencia histórica muestra deterioro sostenido.";
  } else if (stats.tendencia === "bajando") {
    resumen += " La tendencia histórica muestra mejora gradual.";
  } else {
    resumen += " La tendencia se mantiene estable.";
  }

  const recomendaciones: string[] = [];
  if (riesgo === "alto" || riesgo === "crítico") {
    recomendaciones.push("Priorizar seguimiento individual con los usuarios de mayor riesgo (ver Alertas).");
    recomendaciones.push("Reforzar difusión del botón de relajación y recursos de apoyo dentro de la app.");
  } else {
    recomendaciones.push("Mantener monitoreo regular; el grupo está respondiendo bien por ahora.");
  }

  if (volatilidadFactor > 0.55) {
    recomendaciones.push("Hay bastante variabilidad entre usuarios — vale la pena revisar casos individuales, no solo el promedio.");
  }

  if (consistenciaFactor < 0.5) {
    recomendaciones.push("Todavía hay pocos datos para que el modelo sea confiable; la proyección mejorará con más uso de la app.");
  }

  return {
    resumen,
    recomendaciones,
    factores: {
      tendencia: Number(tendenciaFactor.toFixed(3)),
      volatilidad: Number(volatilidadFactor.toFixed(3)),
      consistencia: Number(consistenciaFactor.toFixed(3)),
    },
  };
}

const EMPTY_RESULT: PrediccionEstres = {
  historico: [],
  prediccion: 0,
  estadisticas: null,
  probabilidad: 0,
  riesgo: "sin datos",
  alerta: false,
  interpretacion: null,
};

export function invalidarPrediccionEstres(cacheKey: string) {
  predictionCache.delete(cacheKey);
}

/**
 * @param cacheKey  identificador único del scope: "global" o `edificio:${id}`
 * @param usuarioIds  usuarios dentro de ese scope (ya resueltos por obtenerAlcance)
 */
export async function predecirEstres(
  cacheKey: string,
  usuarioIds: number[]
): Promise<PrediccionEstres> {
  try {
    const cacheEntry = predictionCache.get(cacheKey);
    if (cacheEntry && cacheEntry.expiresAt > Date.now()) {
      return cacheEntry.result;
    }

    const valores = await obtenerSerieDiaria(usuarioIds);
    if (valores.length < 2) {
      return EMPTY_RESULT;
    }

    await tf.ready();

    const statsBase = calcularEstadisticas(valores);
    const pred = await entrenarYPredecir(valores);

    const probabilidad = Number(calcularProbabilidad(pred.prediccion).toFixed(3));
    const riesgo = nivelRiesgo(probabilidad);
    const alerta = probabilidad >= 0.65;

    const estadisticas: EstadisticasModelo = {
      media: Number(statsBase.media.toFixed(3)),
      varianza: Number(statsBase.varianza.toFixed(3)),
      desviacion: Number(statsBase.desviacion.toFixed(3)),
      pendiente: Number(statsBase.pendiente.toFixed(4)),
      tendencia: statsBase.tendencia,
      muestra: statsBase.muestra,
      mae: pred.mae,
      rmse: pred.rmse,
      confianza: pred.confianza,
    };

    const interpretacion = construirInterpretacion(statsBase, pred.confianza, riesgo);

    const result: PrediccionEstres = {
      historico: valores,
      prediccion: pred.prediccion,
      estadisticas,
      probabilidad,
      riesgo,
      alerta,
      interpretacion,
    };

    predictionCache.set(cacheKey, { result, expiresAt: Date.now() + PREDICTION_CACHE_TTL_MS });

    return result;
  } catch (error) {
    console.error("ML ESTRÉS ERROR:", error);
    return { ...EMPTY_RESULT, riesgo: "error" };
  }
}
