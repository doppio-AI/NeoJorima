"use client";

import { useCallback, useEffect, useState } from "react";
import AdminSidebarSimple from "@/app/components/admin-sidebar-simple";
import styles from "./alertas.module.css";

type Nivel = "alto" | "crisis";
type Categoria = "riesgo" | "renuncia";

type Alerta = {
  alerta_id: number;
  nivel: Nivel;
  categoria: Categoria;
  resumen: string | null;
  atendida: boolean;
  atendida_por: number | null;
  atendida_en: string | null;
  notas_admin: string | null;
  created_at: string;
  conversacion_id: number;
  mensaje_id: number;
  usuario: {
    usuario_id: number;
    nombre: string;
    apellido_paterno: string;
    edificio_id: number | null;
  };
};

type Filtro = "pendientes" | "atendidas" | "todas";

const REFRESH_MS = 30_000;

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  const ahora = Date.now();
  const diffMin = Math.round((ahora - fecha.getTime()) / 60000);

  if (diffMin < 1) return "hace unos segundos";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `hace ${diffHrs} h`;
  const diffDias = Math.round(diffHrs / 24);
  return `hace ${diffDias} día${diffDias === 1 ? "" : "s"}`;
}

export default function AlertasAdminPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("pendientes");
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState<number | null>(null);

  const cargarAlertas = useCallback(async (mostrarLoading = false) => {
    if (mostrarLoading) setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filtro === "pendientes") params.set("atendida", "false");
      if (filtro === "atendidas") params.set("atendida", "true");

      const res = await fetch(`/api/admin/alertas?${params.toString()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();
      const lista: Alerta[] = Array.isArray(data.alertas) ? data.alertas : [];
      setAlertas(lista);

      setNotas((prev) => {
        const next = { ...prev };
        for (const a of lista) {
          if (next[a.alerta_id] === undefined) {
            next[a.alerta_id] = a.notas_admin ?? "";
          }
        }
        return next;
      });
    } catch (error) {
      console.error("Error cargando alertas:", error);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    void cargarAlertas(true);

    const interval = setInterval(() => void cargarAlertas(false), REFRESH_MS);
    return () => clearInterval(interval);
  }, [cargarAlertas]);

  const marcarAtendida = async (alerta: Alerta, atendida: boolean) => {
    setGuardando(alerta.alerta_id);

    try {
      const res = await fetch("/api/admin/alertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          alerta_id: alerta.alerta_id,
          atendida,
          notas_admin: notas[alerta.alerta_id] ?? "",
        }),
      });

      if (res.ok) {
        await cargarAlertas(false);
      }
    } catch (error) {
      console.error("Error actualizando alerta:", error);
    } finally {
      setGuardando(null);
    }
  };

  const guardarNota = async (alerta: Alerta) => {
    setGuardando(alerta.alerta_id);

    try {
      await fetch("/api/admin/alertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          alerta_id: alerta.alerta_id,
          notas_admin: notas[alerta.alerta_id] ?? "",
        }),
      });
    } catch (error) {
      console.error("Error guardando nota:", error);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="dashboard-container">
      <AdminSidebarSimple active="alertas" />

      <main className={styles.page}>
        <div className={styles.header}>
          <h1>Alertas de riesgo</h1>
          <p>
            Detectadas automáticamente por el asistente cuando identifica señales de estrés
            severo, ideación suicida u otras conductas de riesgo. Solo se muestra un resumen
            generado por el modelo, no el mensaje textual del usuario.
          </p>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${filtro === "pendientes" ? styles.tabActive : ""}`}
              onClick={() => setFiltro("pendientes")}
            >
              Pendientes
            </button>
            <button
              type="button"
              className={`${styles.tab} ${filtro === "atendidas" ? styles.tabActive : ""}`}
              onClick={() => setFiltro("atendidas")}
            >
              Atendidas
            </button>
            <button
              type="button"
              className={`${styles.tab} ${filtro === "todas" ? styles.tabActive : ""}`}
              onClick={() => setFiltro("todas")}
            >
              Todas
            </button>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => void cargarAlertas(true)}
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Cargando alertas...</div>
        ) : alertas.length === 0 ? (
          <div className={styles.emptyState}>
            {filtro === "pendientes"
              ? "No hay alertas pendientes en este momento."
              : "No hay alertas en esta vista."}
          </div>
        ) : (
          <div className={styles.list}>
            {alertas.map((alerta) => {
              const esRenuncia = alerta.categoria === "renuncia";

              return (
              <div
                key={alerta.alerta_id}
                className={`${styles.card} ${
                  esRenuncia
                    ? styles.cardRenuncia
                    : alerta.nivel === "crisis"
                    ? styles.cardCrisis
                    : styles.cardAlto
                }`}
              >
                <div className={styles.cardTop}>
                  <div>
                    <span
                      className={`${styles.badge} ${
                        esRenuncia
                          ? styles.badgeRenuncia
                          : alerta.nivel === "crisis"
                          ? styles.badgeCrisis
                          : styles.badgeAlto
                      }`}
                    >
                      {esRenuncia ? "posible renuncia" : alerta.nivel}
                    </span>{" "}
                    <span className={styles.usuario}>
                      {alerta.usuario.nombre} {alerta.usuario.apellido_paterno}
                    </span>
                  </div>
                  <span className={styles.fecha}>{formatearFecha(alerta.created_at)}</span>
                </div>

                <p className={styles.resumen}>
                  {alerta.resumen || "El modelo no generó un resumen para esta alerta."}
                </p>

                <div className={styles.acciones}>
                  <input
                    type="text"
                    className={styles.notaInput}
                    placeholder="Notas de seguimiento (opcional)"
                    value={notas[alerta.alerta_id] ?? ""}
                    onChange={(e) =>
                      setNotas((prev) => ({ ...prev, [alerta.alerta_id]: e.target.value }))
                    }
                    onBlur={() => void guardarNota(alerta)}
                    disabled={guardando === alerta.alerta_id}
                  />

                  {alerta.atendida ? (
                    <button
                      type="button"
                      className={styles.botonReabrir}
                      onClick={() => void marcarAtendida(alerta, false)}
                      disabled={guardando === alerta.alerta_id}
                    >
                      Reabrir
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.botonAtender}
                      onClick={() => void marcarAtendida(alerta, true)}
                      disabled={guardando === alerta.alerta_id}
                    >
                      Marcar como atendida
                    </button>
                  )}
                </div>

                {alerta.atendida && alerta.atendida_en && (
                  <p className={styles.atendidaInfo}>
                    Atendida {formatearFecha(alerta.atendida_en)}
                  </p>
                )}
              </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
