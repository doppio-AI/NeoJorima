"use client";

import { useEffect, useState } from "react";
import SuperadminSidebar from "@/app/components/superadmin-sidebar";
import styles from "../superadmin.module.css";

type Institucion = {
  edificio_id: number;
  nombre: string;
  descripcion: string | null;
};

export default function InstitucionesPage() {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/edificios", { credentials: "same-origin", cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setInstituciones(data);
    } catch (e) {
      console.error("Error cargando instituciones:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const crear = async () => {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const res = await fetch("/api/edificios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ nombre, descripcion }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo crear la institución");
        return;
      }

      setNombre("");
      setDescripcion("");
      setShowForm(false);
      await cargar();
    } catch (e) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="dashboard-container">
      <SuperadminSidebar active="instituciones" />

      <main className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Instituciones</h1>
            <p>Empresas y escuelas registradas en Jorima for Enterprises &amp; Education.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancelar" : "+ Nueva institución"}
          </button>
        </div>

        {showForm && (
          <div className={styles.formCard}>
            {!!error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.formGrid}>
              <input
                placeholder="Nombre de la institución"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <input
                placeholder="Descripción (opcional)"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className={styles.formActions}>
              <button className="btn-primary" onClick={crear} disabled={guardando}>
                {guardando ? "Guardando..." : "Crear institución"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.emptyState}>Cargando...</div>
        ) : instituciones.length === 0 ? (
          <div className={styles.emptyState}>Todavía no hay instituciones registradas.</div>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {instituciones.map((inst) => (
                  <tr key={inst.edificio_id}>
                    <td>{inst.nombre}</td>
                    <td>{inst.descripcion || "—"}</td>
                    <td>{inst.edificio_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
