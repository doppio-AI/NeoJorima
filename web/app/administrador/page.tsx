"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebarSimple from "@/app/components/admin-sidebar-simple";

interface Usuario {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  correo: string;
  tipo_usuario: number;
  edificio_id?: number | null;
  turno?: string;
}

type UsuarioApi = {
  usuario_id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo: string;
  tipo_usuario: number;
  edificio_id: number | null;
  turno: string | null;
};

type Filtro = "todos" | "usuario" | "admin";

type FormData = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  contrasena: string;
  turno: string;
};

const FORM_VACIO: FormData = {
  nombre: "",
  apellido_paterno: "",
  apellido_materno: "",
  correo: "",
  contrasena: "",
  turno: "",
};

export default function AdminUsuarios() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState<FormData>(FORM_VACIO);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios", { credentials: "same-origin", cache: "no-store" });
      const data = await res.json();
      if (!Array.isArray(data)) return;

      setUsuarios(
        (data as UsuarioApi[]).map((u) => ({
          id: u.usuario_id,
          nombre: u.nombre,
          apellido_paterno: u.apellido_paterno,
          apellido_materno: u.apellido_materno ?? "",
          correo: u.correo,
          tipo_usuario: u.tipo_usuario,
          edificio_id: u.edificio_id,
          turno: u.turno ?? "",
        }))
      );
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/login", { method: "DELETE", credentials: "same-origin" });
    } finally {
      document.cookie = "usuario_public=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/");
      router.refresh();
    }
  };

  const getRolTexto = (tipo: number) => (tipo === 1 ? "admin" : tipo === 3 ? "superadmin" : "usuario");

  const usuariosFiltrados = usuarios
    .filter((u) => (filtro === "todos" ? true : getRolTexto(u.tipo_usuario) === filtro))
    .filter((u) => u.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  /*
   * NUEVO: ya no se manda tipo_usuario ni edificio_id — /api/usuarios
   * los ignora a propósito cuando quien llama es un admin de institución
   * (siempre fuerza tipo_usuario=2 y el edificio_id del admin), así que
   * pedirlos aquí solo confundía. Este formulario ahora SOLO crea/edita
   * colaboradores de tu propia institución.
   */
  const handleSave = async () => {
    if (!form.nombre.trim() || !form.apellido_paterno.trim() || !form.correo.trim()) {
      setErrorForm("Nombre, apellido paterno y correo son obligatorios");
      return;
    }

    if (!selectedUser && !form.contrasena.trim()) {
      setErrorForm("La contraseña es obligatoria al crear un usuario nuevo");
      return;
    }

    const body: Record<string, unknown> = {
      nombre: form.nombre.trim(),
      apellido_paterno: form.apellido_paterno.trim(),
      apellido_materno: form.apellido_materno.trim() || undefined,
      correo: form.correo.trim(),
      turno: form.turno.trim() || undefined,
    };

    if (form.contrasena.trim()) {
      body.contrasena = form.contrasena.trim();
    }

    setGuardando(true);
    setErrorForm("");

    try {
      const url = selectedUser ? `/api/usuarios/${selectedUser.id}` : "/api/usuarios";
      const method = selectedUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorForm(data.error || "No se pudo guardar el usuario");
        return;
      }

      resetForm();
      await fetchUsuarios();
    } catch (error) {
      console.error("Error al guardar:", error);
      setErrorForm("No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/usuarios/${selectedUser.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "No se pudo eliminar el usuario");
        return;
      }

      setDeleteOpen(false);
      setSelectedUser(null);
      await fetchUsuarios();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleEdit = (user: Usuario) => {
    setSelectedUser(user);
    setErrorForm("");
    setForm({
      nombre: user.nombre,
      apellido_paterno: user.apellido_paterno,
      apellido_materno: user.apellido_materno || "",
      correo: user.correo,
      contrasena: "",
      turno: user.turno || "",
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setErrorForm("");
    setForm(FORM_VACIO);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedUser(null);
    setErrorForm("");
    setForm(FORM_VACIO);
  };

  return (
    <div className="dashboard-container">
      <AdminSidebarSimple active="usuarios" onLogout={handleLogout} />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="admin-page-intro">
            <h1>Gestión de Usuarios</h1>
            <p>Administra a los colaboradores de tu institución</p>
          </div>
          <div className="admin-toolbar">
            <button className="btn-primary" onClick={handleCreate}>
              + Nuevo usuario
            </button>
          </div>
        </div>

        <div className="filters admin-filterbar">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            className="filter-select"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
          >
            <option value="todos">Todos los roles</option>
            <option value="usuario">Usuarios</option>
            <option value="admin">Administradores</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Turno</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--neutral-500)", padding: 32 }}>
                    No hay usuarios que coincidan
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nombre} {u.apellido_paterno}</td>
                    <td>{u.correo}</td>
                    <td>
                      <span className={`admin-status-badge ${u.tipo_usuario === 1 ? "is-admin" : "is-user"}`}>
                        {getRolTexto(u.tipo_usuario)}
                      </span>
                    </td>
                    <td>{u.turno || "—"}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="btn-volver"
                          style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                          onClick={() => handleEdit(u)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => { setSelectedUser(u); setDeleteOpen(true); }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="drawer-overlay" onClick={resetForm}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h3>{selectedUser ? "Editar usuario" : "Nuevo usuario"}</h3>
                <button className="drawer-close" onClick={resetForm}>✕</button>
              </div>

              <div className="drawer-body">
                {!!errorForm && (
                  <p style={{ color: "#DC2626", fontSize: "0.9rem", marginBottom: 8 }}>{errorForm}</p>
                )}

                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Nombre"
                  />
                </div>

                <div className="form-group">
                  <label>Apellido paterno</label>
                  <input
                    type="text"
                    value={form.apellido_paterno}
                    onChange={(e) => setForm((p) => ({ ...p, apellido_paterno: e.target.value }))}
                    placeholder="Apellido paterno"
                  />
                </div>

                <div className="form-group">
                  <label>Apellido materno (opcional)</label>
                  <input
                    type="text"
                    value={form.apellido_materno}
                    onChange={(e) => setForm((p) => ({ ...p, apellido_materno: e.target.value }))}
                    placeholder="Apellido materno"
                  />
                </div>

                <div className="form-group">
                  <label>Correo</label>
                  <input
                    type="email"
                    value={form.correo}
                    onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label>Contraseña {selectedUser && "(dejar vacío para no cambiar)"}</label>
                  <input
                    type="password"
                    value={form.contrasena}
                    onChange={(e) => setForm((p) => ({ ...p, contrasena: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-group">
                  <label>Turno (opcional)</label>
                  <input
                    type="text"
                    value={form.turno}
                    onChange={(e) => setForm((p) => ({ ...p, turno: e.target.value }))}
                    placeholder="Matutino, Vespertino..."
                  />
                </div>
              </div>

              <div className="drawer-footer">
                <button className="btn-volver" onClick={resetForm}>Cancelar</button>
                <button className="btn-primary" onClick={handleSave} disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteOpen && (
          <div className="modal">
            <div className="modal-content">
              <h3>Confirmar eliminación</h3>
              <p>¿Estás seguro de que deseas eliminar a <strong>{selectedUser?.nombre}</strong>? Esta acción no se puede deshacer.</p>
              <div className="admin-actions" style={{ justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn-volver" onClick={() => setDeleteOpen(false)}>Cancelar</button>
                <button className="btn-danger" onClick={handleDelete}>Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
