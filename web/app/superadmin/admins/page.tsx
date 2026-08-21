"use client";

import { useEffect, useState } from "react";
import SuperadminSidebar from "@/app/components/superadmin-sidebar";
import styles from "../superadmin.module.css";

type Institucion = {
  edificio_id: number;
  nombre: string;
};

type UsuarioApi = {
  usuario_id: number;
  nombre: string;
  apellido_paterno: string;
  correo: string;
  tipo_usuario: number;
  edificio_id: number | null;
  edificio: Institucion | null;
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<UsuarioApi[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    correo: "",
    contrasena: "",
    edificio_id: "",
  });

  const cargar = async () => {
    try {
      setLoading(true);

      const [resUsuarios, resEdificios] = await Promise.all([
        fetch("/api/usuarios", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/edificios", { credentials: "same-origin", cache: "no-store" }),
      ]);

      const dataUsuarios = await resUsuarios.json();
      const dataEdificios = await resEdificios.json();

      if (Array.isArray(dataUsuarios)) {
        setAdmins(dataUsuarios.filter((u: UsuarioApi) => u.tipo_usuario === 1));
      }
      if (Array.isArray(dataEdificios)) {
        setInstituciones(dataEdificios);
      }
    } catch (e) {
      console.error("Error cargando admins:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const crear = async () => {
    if (!form.nombre.trim() || !form.apellido_paterno.trim() || !form.correo.trim() || !form.contrasena) {
      setError("Todos los campos son obligatorios, excepto donde se indique");
      return;
    }
    if (!form.edificio_id) {
      setError("Selecciona a qué institución pertenece este admin");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          tipo_usuario: 1,
          nombre: form.nombre,
          apellido_paterno: form.apellido_paterno,
          correo: form.correo,
          contrasena: form.contrasena,
          edificio_id: Number(form.edificio_id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo crear el admin");
        return;
      }

      setForm({ nombre: "", apellido_paterno: "", correo: "", contrasena: "", edificio_id: "" });
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
      <SuperadminSidebar active="admins" />

      <main className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Admins de institución</h1>
            <p>Cada admin solo puede gestionar usuarios de su propia institución.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancelar" : "+ Nuevo admin"}
          </button>
        </div>

        {showForm && (
          <div className={styles.formCard}>
            {!!error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.formGrid}>
              <input
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
              <input
                placeholder="Apellido paterno"
                value={form.apellido_paterno}
                onChange={(e) => setForm({ ...form, apellido_paterno: e.target.value })}
              />
              <input
                placeholder="Correo"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
              />
              <input
                placeholder="Contraseña temporal"
                type="password"
                value={form.contrasena}
                onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
              />
              <select
                value={form.edificio_id}
                onChange={(e) => setForm({ ...form, edificio_id: e.target.value })}
              >
                <option value="">Selecciona institución...</option>
                {instituciones.map((inst) => (
                  <option key={inst.edificio_id} value={inst.edificio_id}>
                    {inst.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formActions}>
              <button className="btn-primary" onClick={crear} disabled={guardando}>
                {guardando ? "Guardando..." : "Crear admin"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.emptyState}>Cargando...</div>
        ) : admins.length === 0 ? (
          <div className={styles.emptyState}>Todavía no hay admins registrados.</div>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Institución</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.usuario_id}>
                    <td>{admin.nombre} {admin.apellido_paterno}</td>
                    <td>{admin.correo}</td>
                    <td>{admin.edificio?.nombre || "—"}</td>
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
