"use client";

import { useEffect, useState } from "react";

type UsuarioEstres = {
  usuario_id: number;
  nombre: string;
  correo: string;
  institucion: string | null;
  nivel_estres: number | null;
  factores: { animo: number; carga: number; chat: number } | null;
  ultima_actualizacion: string | null;
};

interface Props {
  endpoint: string;
  mostrarInstitucion?: boolean;
}

function colorNivel(valor: number): string {
  if (valor <= 33) return "#16A34A";
  if (valor <= 66) return "#F59E0B";
  return "#DC2626";
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  const diffMin = Math.round((Date.now() - fecha.getTime()) / 60000);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `hace ${diffHrs} h`;
  const diffDias = Math.round(diffHrs / 24);
  return `hace ${diffDias} día${diffDias === 1 ? "" : "s"}`;
}

export default function TablaEstresUsuarios({ endpoint, mostrarInstitucion = false }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioEstres[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(endpoint, { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.usuarios)) setUsuarios(data.usuarios);
      })
      .catch((e) => console.error("Error cargando estrés por usuario:", e))
      .finally(() => setLoading(false));
  }, [endpoint]);

  const filtrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20, marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Nivel de estrés por usuario</h3>
        <input
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 13, minWidth: 220 }}
        />
      </div>

      {loading ? (
        <p style={{ color: "#6B7280", fontSize: 14 }}>Cargando...</p>
      ) : filtrados.length === 0 ? (
        <p style={{ color: "#6B7280", fontSize: 14 }}>No hay usuarios que coincidan.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtrados.map((u) => (
            <div key={u.usuario_id} style={{ border: "1px solid #F3F4F6", borderRadius: 10 }}>
              <button
                onClick={() => setExpandido(expandido === u.usuario_id ? null : u.usuario_id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.nombre}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>
                    {u.correo}
                    {mostrarInstitucion && u.institucion ? ` · ${u.institucion}` : ""}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {u.ultima_actualizacion && (
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                      {formatearFecha(u.ultima_actualizacion)}
                    </span>
                  )}

                  {u.nivel_estres === null ? (
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>Sin datos</span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 44,
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "white",
                        background: colorNivel(u.nivel_estres),
                      }}
                    >
                      {u.nivel_estres}
                    </span>
                  )}
                </div>
              </button>

              {expandido === u.usuario_id && u.factores && (
                <div style={{ padding: "0 14px 14px", display: "flex", gap: 16, fontSize: 12, color: "#4B5563" }}>
                  <span>Ánimo: <strong>{u.factores.animo}</strong></span>
                  <span>Carga de tareas: <strong>{u.factores.carga}</strong></span>
                  <span>Señales del chat: <strong>{u.factores.chat}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
