"use client";

import { useEffect, useState } from "react";
import AdminSidebarSimple from "@/app/components/admin-sidebar-simple";
import MiniLineChart from "@/app/components/MiniLineChart";
import PrediccionCard from "@/app/components/PrediccionCard";
import TablaEstresUsuarios from "@/app/components/TablaEstresUsuarios";
import styles from "./metricas.module.css";

type Metricas = {
  total_usuarios: number;
  usuarios_con_datos: number;
  promedio_actual: number | null;
  distribucion: { bajo: number; medio: number; alto: number };
  tendencia: "subiendo" | "bajando" | "estable" | "sin_datos";
  historico: { fecha: string; promedio: number }[];
};

const TENDENCIA_TEXTO: Record<Metricas["tendencia"], string> = {
  subiendo: "↑ Subiendo",
  bajando: "↓ Bajando",
  estable: "→ Estable",
  sin_datos: "Sin datos suficientes",
};

const TENDENCIA_CLASE: Record<Metricas["tendencia"], string> = {
  subiendo: "tendenciaSubiendo",
  bajando: "tendenciaBajando",
  estable: "tendenciaEstable",
  sin_datos: "tendenciaSinDatos",
};

export default function MetricasAdminPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch("/api/admin/metricas", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await res.json();
        setMetricas(data);
      } catch (e) {
        console.error("Error cargando métricas:", e);
      } finally {
        setLoading(false);
      }
    };

    void cargar();
  }, []);

  return (
    <div className="dashboard-container">
      <AdminSidebarSimple active="usuarios" />

      <main className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Métricas de bienestar</h1>
            <p>Nivel de estrés agregado de tu institución, medido en tiempo real.</p>
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Cargando...</div>
        ) : !metricas || metricas.total_usuarios === 0 ? (
          <div className={styles.emptyState}>
            Todavía no hay usuarios en tu institución con datos suficientes.
          </div>
        ) : (
          <>
            <div className={styles.cardsRow}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Nivel promedio actual</p>
                <p className={styles.statValue}>
                  {metricas.promedio_actual !== null ? metricas.promedio_actual : "—"}
                  {metricas.promedio_actual !== null && <span style={{ fontSize: 14 }}> / 100</span>}
                </p>
              </div>

              <div className={styles.statCard}>
                <p className={styles.statLabel}>Tendencia (7 días)</p>
                <span className={`${styles.tendenciaBadge} ${styles[TENDENCIA_CLASE[metricas.tendencia]]}`}>
                  {TENDENCIA_TEXTO[metricas.tendencia]}
                </span>
              </div>

              <div className={styles.statCard}>
                <p className={styles.statLabel}>Usuarios con datos</p>
                <p className={styles.statValue}>
                  {metricas.usuarios_con_datos}
                  <span style={{ fontSize: 14 }}> / {metricas.total_usuarios}</span>
                </p>
              </div>

              <div className={styles.statCard}>
                <p className={styles.statLabel}>Distribución</p>
                <div className={styles.distribucionRow}>
                  <span className={`${styles.distribucionChip} ${styles.chipBajo}`}>
                    {metricas.distribucion.bajo} bajo
                  </span>
                  <span className={`${styles.distribucionChip} ${styles.chipMedio}`}>
                    {metricas.distribucion.medio} medio
                  </span>
                  <span className={`${styles.distribucionChip} ${styles.chipAlto}`}>
                    {metricas.distribucion.alto} alto
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Últimos 30 días</h3>
              <MiniLineChart datos={metricas.historico} />
            </div>

            <PrediccionCard endpoint="/api/admin/metricas/prediccion" />

            <TablaEstresUsuarios endpoint="/api/admin/metricas/usuarios" />
          </>
        )}
      </main>
    </div>
  );
}
