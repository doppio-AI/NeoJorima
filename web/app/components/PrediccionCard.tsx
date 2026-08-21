"use client";

import { useState } from "react";

type Prediccion = {
  historico: number[];
  prediccion: number;
  estadisticas: {
    media: number;
    desviacion: number;
    tendencia: "subiendo" | "bajando" | "estable";
    muestra: number;
    mae: number;
    rmse: number;
    confianza: number;
  } | null;
  probabilidad: number;
  riesgo: "bajo" | "medio" | "alto" | "crítico" | "sin datos" | "error";
  alerta: boolean;
  interpretacion: {
    resumen: string;
    recomendaciones: string[];
  } | null;
};

const riesgoColores: Record<string, string> = {
  bajo: "#16A34A",
  medio: "#F59E0B",
  alto: "#F97316",
  "crítico": "#DC2626",
  "sin datos": "#9CA3AF",
  error: "#9CA3AF",
};

interface Props {
  endpoint: string; // ya con el query param resuelto (o sin él para global)
}

export default function PrediccionCard({ endpoint }: Props) {
  const [prediccion, setPrediccion] = useState<Prediccion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(endpoint, { credentials: "same-origin", cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo calcular la predicción");
        return;
      }

      setPrediccion(data);
    } catch (e) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20, marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Proyección (red neuronal)</h3>
        <button
          onClick={cargar}
          disabled={loading}
          style={{
            border: "1px solid #0F4C81",
            color: "#0F4C81",
            background: "white",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Entrenando modelo..." : prediccion ? "Recalcular" : "Calcular proyección"}
        </button>
      </div>

      {!!error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}

      {!prediccion && !loading && !error && (
        <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
          Entrena un modelo pequeño sobre el histórico diario para proyectar los próximos días.
          Toma unos segundos.
        </p>
      )}

      {prediccion && prediccion.riesgo === "sin datos" && (
        <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
          Todavía no hay suficiente histórico (se necesitan al menos 2 días con datos) para
          entrenar el modelo.
        </p>
      )}

      {prediccion && prediccion.estadisticas && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 2px", textTransform: "uppercase" }}>
                Próxima ventana
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {prediccion.prediccion.toFixed(1)} / 100
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 2px", textTransform: "uppercase" }}>
                Nivel proyectado
              </p>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "white",
                  background: riesgoColores[prediccion.riesgo] || "#9CA3AF",
                }}
              >
                {prediccion.riesgo}
              </span>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 2px", textTransform: "uppercase" }}>
                Confianza del modelo
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {(prediccion.estadisticas.confianza * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 2px", textTransform: "uppercase" }}>
                Muestra
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {prediccion.estadisticas.muestra} días
              </p>
            </div>
          </div>

          {prediccion.interpretacion && (
            <>
              <p style={{ fontSize: 14, color: "#374151", marginBottom: 10 }}>
                {prediccion.interpretacion.resumen}
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#4B5563" }}>
                {prediccion.interpretacion.recomendaciones.map((r, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
