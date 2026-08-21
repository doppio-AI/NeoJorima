"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiActivity,
  FiAlertCircle,
} from "react-icons/fi";
import MiniLineChart from "@/app/components/MiniLineChart";
import Sidebar from "@/app/components/sidebar";

type Respuesta = {
  nivel_actual: number | null;
  ultima_actualizacion: string | null;
  factores: { animo: number; carga: number; chat: number } | null;
  datos_animo: { estado: string; fecha: string } | null;
  datos_carga: { tareas_pendientes: number; fecha: string } | null;
  historico: { fecha: string; valor: number }[];
  alertas: {
    pertenece_institucion: boolean;
    total: number;
    pendientes: number;
    ultima_fecha: string | null;
    ultima_categoria: string | null;
  };
};

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function colorNivel(valor: number): string {
  if (valor <= 33) return "#16A34A";
  if (valor <= 66) return "#F59E0B";
  return "#DC2626";
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MiBienestarPage() {
  const router = useRouter();
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!readCookie("usuario_public")) {
      router.replace("/");
      return;
    }

    fetch("/api/estres/mio", { credentials: "same-origin", cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setDatos(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const logout = async () => {
    try {
      await fetch("/api/login", { method: "DELETE", credentials: "same-origin", cache: "no-store" });
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar active="bienestar" />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Mi Bienestar</h1>
        </div>

        {loading ? (
          <p style={{ color: "var(--neutral-500)" }}>Cargando...</p>
        ) : !datos || datos.nivel_actual === null ? (
          <div style={{ background: "white", border: "1px solid var(--neutral-200)", borderRadius: 12, padding: 24 }}>
            <p style={{ margin: 0, color: "var(--neutral-500)" }}>
              Todavía no tenemos suficiente información tuya. Contesta el quiz de ánimo, el de
              tareas pendientes, o platica con Jorima para que empecemos a calcular esto.
            </p>
          </div>
        ) : (
          <>
            <div style={{ background: "white", border: "1px solid var(--neutral-200)", borderRadius: 12, padding: 24, marginBottom: 20, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  border: `6px solid ${colorNivel(datos.nivel_actual)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  fontWeight: 700,
                  color: colorNivel(datos.nivel_actual),
                  flexShrink: 0,
                }}
              >
                {datos.nivel_actual}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--neutral-500)" }}>Tu nivel de estrés actual</p>
                <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--neutral-600)" }}>
                  {datos.nivel_actual <= 33
                    ? "Va bien — sigue así."
                    : datos.nivel_actual <= 66
                    ? "Hay señales de que las cosas están un poco pesadas."
                    : "Las señales apuntan a que estás bajo bastante presión."}
                </p>
                {datos.ultima_actualizacion && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--neutral-400)" }}>
                    Actualizado por última vez: {formatearFecha(datos.ultima_actualizacion)}
                  </p>
                )}
              </div>
            </div>

            {/* DESGLOSE POR FACTOR, CON DATOS CRUDOS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "white", border: "1px solid var(--neutral-200)", borderRadius: 12, padding: 18 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--neutral-500)", textTransform: "uppercase" }}>Ánimo</p>
                <p style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>{datos.factores?.animo ?? "—"}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--neutral-600)" }}>
                  Se calcula con cómo dijiste sentirte en el quiz diario.
                </p>
                {datos.datos_animo && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--neutral-500)" }}>
                    Tu último reporte: <strong>{datos.datos_animo.estado}</strong> ({formatearFecha(datos.datos_animo.fecha)})
                  </p>
                )}
              </div>

              <div style={{ background: "white", border: "1px solid var(--neutral-200)", borderRadius: 12, padding: 18 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--neutral-500)", textTransform: "uppercase" }}>Carga de tareas</p>
                <p style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>{datos.factores?.carga ?? "—"}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--neutral-600)" }}>
                  Se calcula con tus tareas pendientes y tu carga diaria reportada.
                </p>
                {datos.datos_carga && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--neutral-500)" }}>
                    Reportaste: <strong>{datos.datos_carga.tareas_pendientes} tareas pendientes</strong> ({formatearFecha(datos.datos_carga.fecha)})
                  </p>
                )}
              </div>

              <div style={{ background: "white", border: "1px solid var(--neutral-200)", borderRadius: 12, padding: 18 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--neutral-500)", textTransform: "uppercase" }}>Señales del chat</p>
                <p style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>{datos.factores?.chat ?? "—"}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--neutral-600)" }}>
                  Se calcula analizando el tono general de tus conversaciones recientes con Jorima.
                </p>
              </div>
            </div>

            {/* GRÁFICA */}
            <div style={{ background: "white", border: "1px solid var(--neutral-200)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Últimos 30 días</h3>
              <MiniLineChart datos={datos.historico.map((h) => ({ fecha: h.fecha, promedio: h.valor }))} />
            </div>

            {/* ALERTAS */}
            <div style={{ background: "white", border: "1px solid var(--neutral-200)", borderRadius: 12, padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <FiAlertCircle size={22} color={datos.alertas.total > 0 ? "#DC2626" : "#9CA3AF"} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ margin: "0 0 6px" }}>Alertas</h3>
                {datos.alertas.pertenece_institucion ? (
                  datos.alertas.total > 0 ? (
                    <p style={{ margin: 0, fontSize: 14, color: "var(--neutral-600)" }}>
                      Tu institución ha sido notificada <strong>{datos.alertas.total}</strong>{" "}
                      {datos.alertas.total === 1 ? "vez" : "veces"} sobre señales detectadas en tus
                      conversaciones{datos.alertas.pendientes > 0 ? `, ${datos.alertas.pendientes} sin revisar todavía` : ""}.
                      {datos.alertas.ultima_fecha && (
                        <> Última: {formatearFecha(datos.alertas.ultima_fecha)}.</>
                      )}
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, color: "var(--neutral-600)" }}>
                      No se ha notificado a nadie sobre tu cuenta. Todo tranquilo por ahora.
                    </p>
                  )
                ) : (
                  <p style={{ margin: 0, fontSize: 14, color: "var(--neutral-600)" }}>
                    Tu cuenta es personal, sin institución asociada — nadie más ve tu actividad.
                    Si en algún momento necesitas apoyo, recuerda que Jorima siempre te va a
                    ofrecer recursos de ayuda profesional cuando detecte que lo necesitas.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
