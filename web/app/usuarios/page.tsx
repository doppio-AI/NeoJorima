"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FiSend,
  FiLoader,
  FiMinus,
  FiPlus,
  FiWind,
} from "react-icons/fi";

import JorimaAvatarWeb, { JorimaMood } from "@/app/components/JorimaAvatarWeb";
import AlertaRiesgoModalWeb from "@/app/components/AlertaRiesgoModalWeb";
import Sidebar from "@/app/components/sidebar";

type Usuario = {
  id: number;
  nombre?: string;
  correo?: string;
  tipo_cuenta?: "personal" | "empresa";
};

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type ChatPostResponse = {
  conversacion_id?: number;
  respuesta?: string;
  error?: string;
  temporal?: boolean;
  alerta?: boolean;
  nivel?: "alto" | "crisis";
};

const MENSAJE_BIENVENIDA: Message = {
  id: "bienvenida",
  role: "assistant",
  text: "Inicia tu conversación con Jorima, tu asistente de bienestar emocional.",
};

const MAX_MENSAJE_LENGTH = 2000;

const MOOD_OPCIONES: Array<{ label: string; value: string; avatarMood: JorimaMood }> = [
  { label: "Muy mal", value: "muy mal", avatarMood: "tristeza" },
  { label: "Mal", value: "mal", avatarMood: "tristeza" },
  { label: "Regular", value: "regular", avatarMood: "sereno2" },
  { label: "Bien", value: "bien", avatarMood: "sonrisa_amplia" },
  { label: "Muy bien", value: "muy bien", avatarMood: "sonrisa_amplia" },
];

function readCookie(name: string): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [cookieName, ...cookieValue] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(cookieValue.join("="));
    }
  }
  return null;
}

function crearIdMensaje(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
}

export default function UsuariosPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  // ── Ánimo del día ──
  const [mood, setMood] = useState<string | null>(null);
  const [enviandoMood, setEnviandoMood] = useState(false);
  const [moodAnswered, setMoodAnswered] = useState(false);
  const [checkingMood, setCheckingMood] = useState(true);

  // ── Tareas pendientes del día ──
  const [tareasPendientes, setTareasPendientes] = useState(0);
  const [enviandoCarga, setEnviandoCarga] = useState(false);
  const [cargaAnswered, setCargaAnswered] = useState(false);
  const [checkingCarga, setCheckingCarga] = useState(true);

  // ── Avatar ──
  const [avatarMood, setAvatarMood] = useState<JorimaMood>("sereno1");
  const [avatarTalking, setAvatarTalking] = useState(false);

  // ── Alerta de riesgo ──
  const [alertaVisible, setAlertaVisible] = useState(false);
  const [alertaNivel, setAlertaNivel] = useState<"alto" | "crisis">("alto");

  const [messages, setMessages] = useState<Message[]>([MENSAJE_BIENVENIDA]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [conversacionId, setConversacionId] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  /* =========================
     VALIDAR SESIÓN
  ========================= */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const cookieValue = readCookie("usuario_public");
        if (!cookieValue) {
          router.replace("/");
          return;
        }

        const usuarioPublic = JSON.parse(cookieValue);
        const usuarioId = Number(usuarioPublic.id ?? usuarioPublic.usuario_id);

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
          router.replace("/");
          return;
        }

        const response = await fetch(`/api/usuarios/${usuarioId}`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("No fue posible recuperar la información del usuario");
        }

        const data = await response.json();

        setUsuario({
          id: usuarioId,
          nombre: data.nombre ?? usuarioPublic.nombre,
          correo: data.correo ?? usuarioPublic.correo,
          tipo_cuenta: data.tipo_cuenta ?? "personal",
        });
      } catch (error) {
        console.error("Error validando sesión:", error);
        router.replace("/");
      } finally {
        setCargandoSesion(false);
      }
    };

    void checkSession();
  }, [router]);

  /*
   * NUEVO: ya no se restaura la conversación desde localStorage.
   * Cada vez que el usuario se loguea, el chat arranca en blanco.
   * Los mensajes viejos siguen en la base (historial y cálculo de
   * estrés los siguen usando), solo dejamos de precargarlos aquí.
   */
  useEffect(() => {
    if (!usuario?.id) return;
    localStorage.removeItem(`jorima_conversacion_${usuario.id}`);
  }, [usuario?.id]);

  /* =========================
     CHECAR ÁNIMO Y CARGA DE HOY
  ========================= */
  useEffect(() => {
    if (!usuario?.id) return;

    const checarAnimoHoy = async () => {
      setCheckingMood(true);
      try {
        const res = await fetch("/api/animo/hoy", { credentials: "same-origin", cache: "no-store" });
        if (res.status === 401) {
          router.replace("/");
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ya_contesto) {
          setMoodAnswered(true);
          if (typeof data.estado === "string") setMood(data.estado);
        }
      } catch (e) {
        // no bloqueamos la pantalla
      } finally {
        setCheckingMood(false);
      }
    };

    const checarCargaHoy = async () => {
      setCheckingCarga(true);
      try {
        const res = await fetch("/api/carga/hoy", { credentials: "same-origin", cache: "no-store" });
        if (res.status === 401) {
          router.replace("/");
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ya_contesto) {
          setCargaAnswered(true);
          if (typeof data.tareas_pendientes === "number") setTareasPendientes(data.tareas_pendientes);
        }
      } catch (e) {
        // no bloqueamos la pantalla
      } finally {
        setCheckingCarga(false);
      }
    };

    void checarAnimoHoy();
    void checarCargaHoy();
  }, [usuario?.id, router]);

  /* =========================
     GUARDAR ÁNIMO
  ========================= */
  const enviarMood = async (selectedMood: string) => {
    setEnviandoMood(true);

    const opcion = MOOD_OPCIONES.find((o) => o.value === selectedMood);
    if (opcion) setAvatarMood(opcion.avatarMood);

    try {
      const res = await fetch("/api/animo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ estado: selectedMood }),
      });

      if (res.status === 401) {
        router.replace("/");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error || "No se pudo guardar tu respuesta de ánimo.");
        return;
      }

      setMoodAnswered(true);
      setTimeout(() => setAvatarMood("sereno1"), 2500);
    } catch (e) {
      setChatError("No se pudo conectar con el servidor.");
    } finally {
      setEnviandoMood(false);
    }
  };

  /* =========================
     GUARDAR CARGA DE TAREAS
  ========================= */
  const enviarCarga = async () => {
    setEnviandoCarga(true);

    try {
      const res = await fetch("/api/carga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ tareas_pendientes: tareasPendientes }),
      });

      if (res.status === 401) {
        router.replace("/");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error || "No se pudo guardar tu respuesta.");
        return;
      }

      setCargaAnswered(true);
    } catch (e) {
      setChatError("No se pudo conectar con el servidor.");
    } finally {
      setEnviandoCarga(false);
    }
  };

  /* =========================
     ENVIAR MENSAJE
  ========================= */
  const sendMessage = async () => {
    const textoUsuario = input.trim();
    if (!textoUsuario || loading || !usuario?.id) return;

    if (textoUsuario.length > MAX_MENSAJE_LENGTH) {
      setChatError(`El mensaje no puede superar los ${MAX_MENSAJE_LENGTH} caracteres.`);
      return;
    }

    setMessages((prev) => [...prev, { id: crearIdMensaje(), role: "user", text: textoUsuario }]);
    setInput("");
    setChatError("");
    setLoading(true);
    setAvatarTalking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ mensaje: textoUsuario, conversacion_id: conversacionId }),
      });

      if (res.status === 401) {
        router.replace("/");
        return;
      }

      const data = (await res.json().catch(() => ({}))) as ChatPostResponse;

      if (!res.ok) {
        throw new Error(data.error || "No fue posible procesar tu mensaje");
      }

      if (typeof data.respuesta !== "string" || !data.respuesta.trim()) {
        throw new Error("El asistente devolvió una respuesta inválida");
      }

      if (typeof data.conversacion_id === "number" && data.conversacion_id > 0) {
        setConversacionId(data.conversacion_id);
      }

      setMessages((prev) => [
        ...prev,
        { id: crearIdMensaje(), role: "assistant", text: data.respuesta!.trim() },
      ]);

      setAvatarMood(data.alerta ? "preocupacion" : "sonrisa_amplia");
      setTimeout(() => setAvatarMood("sereno1"), 2500);

      if (data.alerta) {
        setAlertaNivel(data.nivel === "crisis" ? "crisis" : "alto");
        setAlertaVisible(true);
      }
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : "No se pudo conectar con el servidor.";
      setChatError(mensajeError);
      setMessages((prev) => [
        ...prev,
        {
          id: crearIdMensaje(),
          role: "assistant",
          text: "Lo siento, ocurrió un problema al procesar tu mensaje. Puedes intentarlo nuevamente.",
        },
      ]);
    } finally {
      setLoading(false);
      setAvatarTalking(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendMessage();
    }
  };

  const startNewConversation = () => {
    setConversacionId(null);
    setMessages([MENSAJE_BIENVENIDA]);
    setInput("");
    setChatError("");
  };

  const logout = async () => {
    try {
      await fetch("/api/login", { method: "DELETE", credentials: "same-origin", cache: "no-store" });
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    } finally {
      if (usuario?.id) localStorage.removeItem(`jorima_conversacion_${usuario.id}`);
      window.location.href = "/";
    }
  };

  if (cargandoSesion) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <FiLoader className="spin" size={30} />
      </main>
    );
  }

  const mostrarQuizAnimo = !checkingMood && !moodAnswered;
  const mostrarQuizCarga = !checkingCarga && !cargaAnswered;

  return (
    <div className="dashboard-container">
      <Sidebar active="inicio" />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Hola, {usuario?.nombre || usuario?.correo}</h1>
        </div>

        {/* AVATAR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0 20px" }}>
          <JorimaAvatarWeb mood={avatarMood} talking={avatarTalking} size={150} />
          <p style={{ marginTop: 8, color: "var(--neutral-500)", fontSize: 14 }}>Jorima</p>

          <a
            href="/relajacion"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#0F4C81",
              color: "white",
              textDecoration: "none",
              padding: "10px 18px",
              borderRadius: 24,
              fontSize: 14,
              fontWeight: 600,
              marginTop: 14,
            }}
          >
            <FiWind size={16} />
            Necesito relajarme
          </a>
        </div>

        {/* QUIZ DE ÁNIMO */}
        {mostrarQuizAnimo && (
          <div className="mood-card">
            <h3>¿Cómo te sientes hoy antes de empezar?</h3>

            <div className="mood-selector">
              {MOOD_OPCIONES.map((item) => (
                <div
                  key={item.value}
                  className={`mood-option ${mood === item.value ? "selected" : ""}`}
                  onClick={() => {
                    if (!enviandoMood) {
                      setMood(item.value);
                      void enviarMood(item.value);
                    }
                  }}
                >
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {enviandoMood && <div className="mood-thanks">Guardando respuesta...</div>}
          </div>
        )}

        {/* QUIZ DE CARGA */}
        {mostrarQuizCarga && (
          <div className="mood-card">
            <h3>¿Cuántas tareas tienes pendientes hoy?</h3>
            <p style={{ color: "var(--neutral-500)", fontSize: 14, marginTop: 4 }}>
              Del trabajo, la escuela, o cualquier pendiente que traigas encima.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, margin: "16px 0" }}>
              <button
                onClick={() => setTareasPendientes((p) => Math.max(0, p - 1))}
                disabled={enviandoCarga}
                style={{ width: 36, height: 36, borderRadius: 18, border: "1px solid var(--neutral-200)", background: "white", cursor: "pointer" }}
              >
                <FiMinus />
              </button>
              <strong style={{ fontSize: 22, color: "#0F4C81" }}>{tareasPendientes}</strong>
              <button
                onClick={() => setTareasPendientes((p) => p + 1)}
                disabled={enviandoCarga}
                style={{ width: 36, height: 36, borderRadius: 18, border: "1px solid var(--neutral-200)", background: "white", cursor: "pointer" }}
              >
                <FiPlus />
              </button>
            </div>

            <button
              className="btn-primary"
              onClick={enviarCarga}
              disabled={enviandoCarga}
              style={{ width: "100%" }}
            >
              {enviandoCarga ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        )}

        {/* CHAT */}
        <div className="chat-card">
          <div className="chat-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <strong>Chat privado y seguro</strong>
              <p className="chat-subtitle">Tus conversaciones son confidenciales</p>
            </div>
            <button
              onClick={startNewConversation}
              style={{ border: "1px solid var(--neutral-200)", background: "white", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}
            >
              Nuevo chat
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role === "assistant" ? "assistant" : "user"}`}>
                {message.text}
              </div>
            ))}

            {loading && (
              <div className="chat-message assistant">
                <span className="typing-indicator">
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {chatError && <p className="error-text" style={{ margin: "8px 16px 0" }}>{chatError}</p>}

          <div className="chat-input">
            <input
              type="text"
              placeholder="Escribe tu mensaje..."
              value={input}
              maxLength={MAX_MENSAJE_LENGTH}
              onChange={(event) => {
                setInput(event.target.value);
                setChatError("");
              }}
              onKeyDown={handleKeyDown}
              disabled={loading || !usuario}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
            >
              {loading ? <FiLoader className="spin" size={18} /> : <FiSend size={18} />}
            </button>
          </div>
        </div>
      </main>

      <AlertaRiesgoModalWeb
        visible={alertaVisible}
        onClose={() => setAlertaVisible(false)}
        tipoCuenta={usuario?.tipo_cuenta === "empresa" ? "empresa" : "personal"}
        nivel={alertaNivel}
      />
    </div>
  );
}
