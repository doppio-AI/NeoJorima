"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiMinus, FiPlus } from "react-icons/fi";
import JorimaAvatarWeb from "@/app/components/JorimaAvatarWeb";

function readCookie(name: string): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [cookieName, ...cookieValue] = cookie.trim().split("=");
    if (cookieName === name) return decodeURIComponent(cookieValue.join("="));
  }
  return null;
}

const TOTAL_PASOS = 4;

export default function OnboardingPage() {
  const router = useRouter();

  const [checandoSesion, setCheckandoSesion] = useState(true);
  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const [avatarGenero, setAvatarGenero] = useState<"femenino" | "masculino">("femenino");
  const [horasActividadDiaria, setHorasActividadDiaria] = useState(8);
  const [tareasPorDia, setTareasPorDia] = useState(3);
  const [tareasPendientesMes, setTareasPendientesMes] = useState(5);
  const [personasDependientes, setPersonasDependientes] = useState(0);
  const [nombresDependientes, setNombresDependientes] = useState<string[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");

  useEffect(() => {
    const verificar = async () => {
      const cookieValue = readCookie("usuario_public");

      if (!cookieValue) {
        router.replace("/");
        return;
      }

      let usuarioId: number | null = null;

      try {
        const usuarioPublic = JSON.parse(cookieValue);
        const id = Number(usuarioPublic.id ?? usuarioPublic.usuario_id);
        usuarioId = Number.isInteger(id) && id > 0 ? id : null;
      } catch {
        usuarioId = null;
      }

      if (!usuarioId) {
        router.replace("/");
        return;
      }

      try {
        const res = await fetch(`/api/usuarios/${usuarioId}`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          // Si ya terminó el wizard antes, no lo dejamos volver a verlo
          // aunque haya llegado aquí por historial del navegador, un
          // link viejo, etc.
          if (data.onboarding_completo === true) {
            router.replace("/usuarios");
            return;
          }
        }
      } catch {
        // Si falla la verificación, dejamos pasar al wizard de todos
        // modos: es mejor mostrar el wizard de más que dejar a alguien
        // atorado sin poder entrar a la app.
      }

      setCheckandoSesion(false);
    };

    void verificar();
  }, [router]);

  const agregarNombre = () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    const nuevos = [...nombresDependientes, nombre];
    setNombresDependientes(nuevos);
    setPersonasDependientes(Math.max(personasDependientes, nuevos.length));
    setNuevoNombre("");
  };

  const quitarNombre = (idx: number) => {
    setNombresDependientes(nombresDependientes.filter((_, i) => i !== idx));
  };

  const soloDigitos = (texto: string): number => {
    const limpio = texto.replace(/[^0-9]/g, "");
    return limpio ? Number(limpio) : 0;
  };

  const finalizar = async () => {
    setEnviando(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          avatar_genero: avatarGenero,
          horas_actividad_diaria: horasActividadDiaria,
          tareas_por_dia: tareasPorDia,
          tareas_pendientes_mes: tareasPendientesMes,
          personas_dependientes: personasDependientes,
          nombres_dependientes: nombresDependientes,
        }),
      });

      if (res.status === 401) {
        router.replace("/");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "No se pudo completar el registro.");
        return;
      }

      router.replace("/usuarios");
      router.refresh();
    } catch (e) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  if (checandoSesion) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#F4F6F8",
      }}
    >
      <div style={{ background: "white", borderRadius: 16, padding: 32, maxWidth: 480, width: "100%" }}>
        {/* barra de progreso */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {Array.from({ length: TOTAL_PASOS }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i < paso ? "#0F4C81" : "#E5E7EB",
              }}
            />
          ))}
        </div>

        {/* burbuja de Jorima */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 28 }}>
          <JorimaAvatarWeb mood="sereno1" size={48} />
          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: 12, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>Jorima</p>
            <p style={{ margin: "2px 0 0", fontSize: 14 }}>
              {paso === 1 && "¡Hola! Soy tu asistente de bienestar. ¿Con qué versión te sientes más a gusto?"}
              {paso === 2 && "Cuéntame un poco de tu día a día para entender tu carga actual."}
              {paso === 3 && "¿Hay personas que dependen de ti? Puedo usar esto para darte ánimo cuando lo necesites."}
              {paso === 4 && "Esto es lo que entendí. Si todo se ve bien, empecemos."}
            </p>
          </div>
        </div>

        {/* PASO 1: avatar */}
        {paso === 1 && (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
              {(["femenino", "masculino"] as const).map((genero) => (
                <div
                  key={genero}
                  onClick={() => setAvatarGenero(genero)}
                  style={{
                    flex: 1,
                    border: `1.5px solid ${avatarGenero === genero ? "#0F4C81" : "#E5E7EB"}`,
                    background: avatarGenero === genero ? "#0F4C81" : "white",
                    borderRadius: 12,
                    padding: 20,
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <JorimaAvatarWeb mood="sonrisa_amplia" size={64} />
                  <p style={{ marginTop: 8, fontWeight: 600, color: avatarGenero === genero ? "white" : "#111827" }}>
                    {genero === "femenino" ? "Jorima" : "Jorimo"}
                  </p>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={() => setPaso(2)}>
              Continuar
            </button>
          </>
        )}

        {/* PASO 2: carga */}
        {paso === 2 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 13, color: "#6B7280" }}>
                  ¿Cuántas horas al día dedicas a trabajar, estudiar u otras actividades pesadas?
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={horasActividadDiaria}
                  onChange={(e) => setHorasActividadDiaria(soloDigitos(e.target.value))}
                  className="registro-input"
                  style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 8, border: "1px solid #E5E7EB" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#6B7280" }}>
                  ¿Cuántas tareas sueles hacer en un día típico?
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tareasPorDia}
                  onChange={(e) => setTareasPorDia(soloDigitos(e.target.value))}
                  style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 8, border: "1px solid #E5E7EB" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#6B7280" }}>
                  ¿Cuántas tareas tienes pendientes antes de que termine el mes?
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tareasPendientesMes}
                  onChange={(e) => setTareasPendientesMes(soloDigitos(e.target.value))}
                  style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 8, border: "1px solid #E5E7EB" }}
                />
              </div>
            </div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={() => setPaso(3)}>
              Continuar
            </button>
          </>
        )}

        {/* PASO 3: dependientes */}
        {paso === 3 && (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: "#6B7280" }}>Número de personas que dependen de ti</label>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
                <button
                  onClick={() => setPersonasDependientes((p) => Math.max(0, p - 1))}
                  style={{ width: 36, height: 36, borderRadius: 18, border: "1px solid #E5E7EB", background: "white", cursor: "pointer" }}
                >
                  <FiMinus />
                </button>
                <strong style={{ fontSize: 20 }}>{personasDependientes}</strong>
                <button
                  onClick={() => setPersonasDependientes((p) => p + 1)}
                  style={{ width: 36, height: 36, borderRadius: 18, border: "1px solid #E5E7EB", background: "white", cursor: "pointer" }}
                >
                  <FiPlus />
                </button>
              </div>
            </div>

            {personasDependientes > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, color: "#6B7280" }}>Si quieres, dime sus nombres (opcional)</label>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="Ej. mi mamá"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && agregarNombre()}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #E5E7EB" }}
                  />
                  <button
                    onClick={agregarNombre}
                    style={{ width: 44, borderRadius: 8, border: "none", background: "#0F4C81", color: "white", cursor: "pointer" }}
                  >
                    <FiPlus />
                  </button>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {nombresDependientes.map((nombre, idx) => (
                    <span
                      key={`${nombre}-${idx}`}
                      onClick={() => quitarNombre(idx)}
                      style={{
                        border: "1px solid #0F4C81",
                        color: "#0F4C81",
                        borderRadius: 20,
                        padding: "6px 14px",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {nombre} ✕
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary" style={{ width: "100%" }} onClick={() => setPaso(4)}>
              Continuar
            </button>
          </>
        )}

        {/* PASO 4: resumen */}
        {paso === 4 && (
          <>
            {!!error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

            <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Asistente", valor: avatarGenero === "masculino" ? "Jorimo" : "Jorima" },
                { label: "Horas de actividad al día", valor: String(horasActividadDiaria) },
                { label: "Tareas por día", valor: String(tareasPorDia) },
                { label: "Tareas pendientes este mes", valor: String(tareasPendientesMes) },
                { label: "Personas dependientes", valor: String(personasDependientes) },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>{item.label}</p>
                  <p style={{ margin: 0 }}>{item.valor}</p>
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ width: "100%" }} onClick={finalizar} disabled={enviando}>
              {enviando ? "Guardando..." : "Empezar a usar Jorima"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}