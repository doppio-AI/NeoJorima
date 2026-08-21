import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import { API_URL } from "@/config/api";
import JorimaAvatar, { JorimaMood } from "@/components/JorimaAvatar";
import AlertaRiesgoModal from "@/components/AlertaRiesgoModal";

type Usuario = {
  id?: number;
  nombre?: string;
  correo?: string;
  tipo_usuario?: number;
  edificio_id?: number;
  turno?: string | null;
  avatar_genero?: "femenino" | "masculino";
  tipo_cuenta?: "personal" | "empresa";
};

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

/* ── Coincide con la forma real de /api/chat (POST) ── */
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

function crearIdMensaje(): string {
  return `${Date.now()}-${Math.random()}`;
}

export default function HomeScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // ── Ánimo del día ──
  const [mood, setMood] = useState<string | null>(null);
  const [sendingMood, setSendingMood] = useState(false);
  const [moodAnswered, setMoodAnswered] = useState(false);
  const [checkingMood, setCheckingMood] = useState(true);

  // ── Tareas pendientes del día ──
  const [tareasPendientes, setTareasPendientes] = useState(0);
  const [sendingCarga, setSendingCarga] = useState(false);
  const [cargaAnswered, setCargaAnswered] = useState(false);
  const [checkingCarga, setCheckingCarga] = useState(true);

  // ── Avatar ──
  const [avatarMood, setAvatarMood] = useState<JorimaMood>("sereno1");
  const [avatarTalking, setAvatarTalking] = useState(false);

  // ── Alerta de riesgo (watchdog) ──
  const [alertaVisible, setAlertaVisible] = useState(false);
  const [alertaNivel, setAlertaNivel] = useState<"alto" | "crisis">("alto");

  const [messages, setMessages] = useState<Message[]>([MENSAJE_BIENVENIDA]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [conversacionId, setConversacionId] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  const avatarGenero = usuario?.avatar_genero ?? "femenino";

  /* =========================
     Sesión cerrada / token inválido
  ========================= */
  const forzarLogout = async () => {
    await AsyncStorage.multiRemove(["usuario", "session_token"]);
    router.replace("/(auth)/login");
  };

  const authHeaders = (): Record<string, string> =>
    sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};

  /* =========================
     CARGAR SESIÓN
  ========================= */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const entries = await AsyncStorage.multiGet(["usuario", "session_token"]);

        const storedUser = entries.find(([key]) => key === "usuario")?.[1];
        const storedToken = entries.find(([key]) => key === "session_token")?.[1];

        if (!storedUser || !storedToken) {
          await forzarLogout();
          return;
        }

        setUsuario(JSON.parse(storedUser));
        setSessionToken(storedToken);
      } catch (error) {
        await forzarLogout();
      } finally {
        setCheckingSession(false);
      }
    };

    loadUser();
  }, []);

  /*
   * NUEVO: ya NO se restaura la conversación guardada de sesiones
   * anteriores. Cada vez que el usuario se loguea (esta pantalla se
   * vuelve a montar), el chat arranca en blanco. Los mensajes viejos
   * siguen en la base de datos (se pueden ver en Historial, y el
   * cálculo de estrés los sigue usando) — solo dejamos de precargarlos
   * aquí para que la conversación se sienta "fresca" cada sesión.
   */
  useEffect(() => {
    if (!usuario?.id) return;
    // Limpiamos cualquier id de conversación que haya quedado guardado
    // de la versión anterior de la app, para no dejar basura en AsyncStorage.
    AsyncStorage.removeItem(`jorima_conversacion_${usuario.id}`).catch(() => {});
  }, [usuario?.id]);

  /* =========================
     CHECAR SI YA CONTESTÓ EL ÁNIMO DE HOY
  ========================= */
  useEffect(() => {
    if (!usuario?.id || !sessionToken) return;

    const checarAnimoHoy = async () => {
      setCheckingMood(true);

      try {
        const res = await fetch(`${API_URL}/api/animo/hoy`, {
          method: "GET",
          headers: { ...authHeaders() },
        });

        if (res.status === 401) {
          await forzarLogout();
          return;
        }

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ya_contesto) {
          setMoodAnswered(true);
          if (typeof data.estado === "string") {
            setMood(data.estado);
          }
        }
      } catch (error) {
        // Si falla la consulta, dejamos el quiz visible por si acaso;
        // no es crítico bloquear la pantalla por esto.
      } finally {
        setCheckingMood(false);
      }
    };

    void checarAnimoHoy();
  }, [usuario?.id, sessionToken]);

  /* =========================
     CHECAR SI YA CONTESTÓ LA CARGA DE HOY
  ========================= */
  useEffect(() => {
    if (!usuario?.id || !sessionToken) return;

    const checarCargaHoy = async () => {
      setCheckingCarga(true);

      try {
        const res = await fetch(`${API_URL}/api/carga/hoy`, {
          method: "GET",
          headers: { ...authHeaders() },
        });

        if (res.status === 401) {
          await forzarLogout();
          return;
        }

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ya_contesto) {
          setCargaAnswered(true);
          if (typeof data.tareas_pendientes === "number") {
            setTareasPendientes(data.tareas_pendientes);
          }
        }
      } catch (error) {
        // no bloqueamos la pantalla si falla
      } finally {
        setCheckingCarga(false);
      }
    };

    void checarCargaHoy();
  }, [usuario?.id, sessionToken]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  /* =========================
     GUARDAR ÁNIMO DEL DÍA
  ========================= */
  const saveMood = async (selectedMood: string) => {
    try {
      setSendingMood(true);

      const opcion = MOOD_OPCIONES.find((o) => o.value === selectedMood);
      if (opcion) {
        setAvatarMood(opcion.avatarMood);
      }

      const res = await fetch(`${API_URL}/api/animo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ estado: selectedMood }),
      });

      if (res.status === 401) {
        await forzarLogout();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.error || "No se pudo guardar tu respuesta.");
        return;
      }

      // Se oculta el quiz una vez contestado, como pidió el flujo.
      setMoodAnswered(true);

      setTimeout(() => setAvatarMood("sereno1"), 2500);
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setSendingMood(false);
    }
  };

  /* =========================
     GUARDAR CARGA DE TAREAS DEL DÍA
  ========================= */
  const saveCarga = async () => {
    try {
      setSendingCarga(true);

      const res = await fetch(`${API_URL}/api/carga`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ tareas_pendientes: tareasPendientes }),
      });

      if (res.status === 401) {
        await forzarLogout();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.error || "No se pudo guardar tu respuesta.");
        return;
      }

      setCargaAnswered(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setSendingCarga(false);
    }
  };

  /* =========================
     ENVIAR MENSAJE
  ========================= */
  const sendMessage = async () => {
    const textoUsuario = input.trim();

    if (!textoUsuario || loading || !usuario?.id) {
      return;
    }

    if (textoUsuario.length > MAX_MENSAJE_LENGTH) {
      setChatError(`El mensaje no puede superar los ${MAX_MENSAJE_LENGTH} caracteres.`);
      return;
    }

    setMessages((prev) => [...prev, { id: crearIdMensaje(), role: "user", text: textoUsuario }]);
    setInput("");
    setChatError("");
    setLoading(true);
    setAvatarTalking(true);
    scrollToBottom();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          mensaje: textoUsuario,
          conversacion_id: conversacionId,
        }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        await forzarLogout();
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

      // El avatar reacciona brevemente según si hubo una señal de riesgo.
      setAvatarMood(data.alerta ? "preocupacion" : "sonrisa_amplia");
      setTimeout(() => setAvatarMood("sereno1"), 2500);

      if (data.alerta) {
        setAlertaNivel(data.nivel === "crisis" ? "crisis" : "alto");
        setAlertaVisible(true);
      }
    } catch (error) {
      const mensajeError =
        error instanceof Error ? error.message : "No se pudo conectar con el servidor.";

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
      clearTimeout(timeoutId);
      setLoading(false);
      setAvatarTalking(false);
      scrollToBottom();
    }
  };

  const logout = async () => {
    await forzarLogout();
  };

  const startNewConversation = () => {
    setConversacionId(null);
    setMessages([MENSAJE_BIENVENIDA]);
    setInput("");
    setChatError("");
  };

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ThemedText variant="body" color={COLORS.textSecondary}>
            Cargando sesión...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const mostrarQuizAnimo = !checkingMood && !moodAnswered;
  const mostrarQuizCarga = !checkingCarga && !cargaAnswered;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Bienvenido de vuelta
            </ThemedText>
            <ThemedText variant="h2" color={COLORS.primary}>
              Hola, {usuario?.nombre || usuario?.correo || "Usuario"}
            </ThemedText>
            {!!usuario?.turno && (
              <ThemedText variant="caption" color={COLORS.textSecondary}>
                Turno: {usuario.turno}
              </ThemedText>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Feather name="log-out" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Avatar grande arriba del chat */}
        <View style={styles.avatarSection}>
          <JorimaAvatar
            mood={avatarMood}
            avatarGenero={avatarGenero}
            talking={avatarTalking}
            size={180}
          />
          <ThemedText variant="bodySmall" color={COLORS.textSecondary} style={{ marginTop: 8 }}>
            {avatarGenero === "masculino" ? "Jorimo" : "Jorima"}
          </ThemedText>

          <TouchableOpacity
            style={styles.relaxButton}
            onPress={() => router.push("/(relajacion)")}
          >
            <Feather name="wind" size={16} color={COLORS.white} />
            <ThemedText variant="bodySmall" color={COLORS.white}>
              Necesito relajarme
            </ThemedText>
          </TouchableOpacity>
        </View>

        {mostrarQuizAnimo && (
          <View style={styles.card}>
            <ThemedText variant="h3" color={COLORS.text}>
              ¿Cómo te sientes hoy antes de empezar?
            </ThemedText>

            <View style={styles.moodGrid}>
              {MOOD_OPCIONES.map((item) => {
                const selected = mood === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.moodOption, selected && styles.moodOptionSelected]}
                    onPress={async () => {
                      setMood(item.value);
                      await saveMood(item.value);
                    }}
                    disabled={sendingMood}
                  >
                    <ThemedText
                      variant="bodySmall"
                      color={selected ? COLORS.white : COLORS.text}
                      style={styles.moodLabel}
                    >
                      {item.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {sendingMood && (
              <View style={styles.thanksBox}>
                <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                  Guardando respuesta...
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {mostrarQuizCarga && (
          <View style={styles.card}>
            <ThemedText variant="h3" color={COLORS.text}>
              ¿Cuántas tareas tienes pendientes hoy?
            </ThemedText>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Del trabajo, la escuela, o cualquier pendiente que traigas encima.
            </ThemedText>

            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setTareasPendientes((prev) => Math.max(0, prev - 1))}
                disabled={sendingCarga}
              >
                <Feather name="minus" size={18} color={COLORS.primary} />
              </TouchableOpacity>

              <ThemedText variant="h2" color={COLORS.primary}>
                {tareasPendientes}
              </ThemedText>

              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setTareasPendientes((prev) => prev + 1)}
                disabled={sendingCarga}
              >
                <Feather name="plus" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitCargaButton, sendingCarga && styles.sendButtonDisabled]}
              onPress={() => void saveCarga()}
              disabled={sendingCarga}
            >
              <ThemedText variant="bodySmall" color={COLORS.white}>
                {sendingCarga ? "Guardando..." : "Confirmar"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.chatHeaderRow}>
            <View style={styles.chatHeader}>
              <ThemedText variant="h3">Chat Privado y Seguro</ThemedText>
              <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                Tus conversaciones son confidenciales
              </ThemedText>
            </View>

            <TouchableOpacity style={styles.newChatButton} onPress={startNewConversation}>
              <Feather name="edit-3" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.chatMessages}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.role === "assistant" ? styles.assistantMessage : styles.userMessage,
                ]}
              >
                <ThemedText
                  variant="bodySmall"
                  color={msg.role === "user" ? COLORS.white : COLORS.text}
                >
                  {msg.text}
                </ThemedText>
              </View>
            ))}

            {loading && (
              <View style={[styles.messageBubble, styles.assistantMessage]}>
                <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                  Escribiendo...
                </ThemedText>
              </View>
            )}
          </View>

          {!!chatError && (
            <ThemedText variant="caption" color={COLORS.error ?? "#D14343"} style={{ marginTop: 4 }}>
              {chatError}
            </ThemedText>
          )}

          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor={COLORS.textSecondary}
              value={input}
              onChangeText={(text) => {
                setInput(text);
                setChatError("");
              }}
              maxLength={MAX_MENSAJE_LENGTH}
              editable={!loading}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={() => void sendMessage()}
              disabled={loading || !input.trim()}
            >
              <Feather name={loading ? "clock" : "send"} size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <AlertaRiesgoModal
        visible={alertaVisible}
        onClose={() => setAlertaVisible(false)}
        tipoCuenta={usuario?.tipo_cuenta === "empresa" ? "empresa" : "personal"}
        nivel={alertaNivel}
        avatarGenero={avatarGenero}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SIZES.padding, gap: 16, flexGrow: 1 },
  centerState: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextBlock: { gap: 2 },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },

  avatarSection: { alignItems: "center", paddingVertical: 8 },
  relaxButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 14,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },

  moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moodOption: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  moodOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  moodLabel: { textAlign: "center" },
  thanksBox: { alignItems: "center" },

  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  submitCargaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: 12,
    alignItems: "center",
  },

  chatHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  chatHeader: { gap: 2 },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  chatMessages: { gap: 10 },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
  },

  chatInputRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    color: COLORS.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { opacity: 0.5 },
});
