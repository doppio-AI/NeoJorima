import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View, ScrollView, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import { authFetch } from "@/lib/api";

type Respuesta = {
  nivel_actual: number | null;
  ultima_actualizacion: string | null;
  factores: { animo: number; carga: number; chat: number } | null;
  datos_animo: { estado: string; fecha: string } | null;
  datos_carga: { tareas_pendientes: number; fecha: string } | null;
  alertas: {
    pertenece_institucion: boolean;
    total: number;
    pendientes: number;
    ultima_fecha: string | null;
  };
};

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

export default function MiBienestarScreen() {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/estres/mio")
      .then((res) => res.json())
      .then((data) => setDatos(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!datos || datos.nivel_actual === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ThemedText variant="body" color={COLORS.textSecondary} style={{ textAlign: "center" }}>
            Todavía no tenemos suficiente información tuya. Contesta el quiz de ánimo, el de
            tareas pendientes, o platica con Jorima para que empecemos a calcular esto.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const nivel = datos.nivel_actual;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText variant="h2" color={COLORS.primary}>
          Mi Bienestar
        </ThemedText>

        <View style={styles.card}>
          <View style={styles.nivelRow}>
            <View style={[styles.nivelCircle, { borderColor: colorNivel(nivel) }]}>
              <ThemedText variant="h1" color={colorNivel(nivel)}>
                {nivel}
              </ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                Tu nivel de estrés actual
              </ThemedText>
              <ThemedText variant="body" style={{ marginTop: 4 }}>
                {nivel <= 33
                  ? "Va bien — sigue así."
                  : nivel <= 66
                  ? "Hay señales de que las cosas están un poco pesadas."
                  : "Las señales apuntan a que estás bajo bastante presión."}
              </ThemedText>
              {datos.ultima_actualizacion && (
                <ThemedText variant="caption" color={COLORS.textSecondary} style={{ marginTop: 6 }}>
                  Actualizado: {formatearFecha(datos.ultima_actualizacion)}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary} style={styles.labelUpper}>
            Ánimo
          </ThemedText>
          <ThemedText variant="h3">{datos.factores?.animo ?? "—"}</ThemedText>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary} style={{ marginTop: 4 }}>
            Se calcula con cómo dijiste sentirte en el quiz diario.
          </ThemedText>
          {datos.datos_animo && (
            <ThemedText variant="caption" color={COLORS.textSecondary} style={{ marginTop: 8 }}>
              Tu último reporte: {datos.datos_animo.estado} ({formatearFecha(datos.datos_animo.fecha)})
            </ThemedText>
          )}
        </View>

        <View style={styles.card}>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary} style={styles.labelUpper}>
            Carga de tareas
          </ThemedText>
          <ThemedText variant="h3">{datos.factores?.carga ?? "—"}</ThemedText>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary} style={{ marginTop: 4 }}>
            Se calcula con tus tareas pendientes y tu carga diaria reportada.
          </ThemedText>
          {datos.datos_carga && (
            <ThemedText variant="caption" color={COLORS.textSecondary} style={{ marginTop: 8 }}>
              Reportaste: {datos.datos_carga.tareas_pendientes} tareas pendientes (
              {formatearFecha(datos.datos_carga.fecha)})
            </ThemedText>
          )}
        </View>

        <View style={styles.card}>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary} style={styles.labelUpper}>
            Señales del chat
          </ThemedText>
          <ThemedText variant="h3">{datos.factores?.chat ?? "—"}</ThemedText>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary} style={{ marginTop: 4 }}>
            Se calcula analizando el tono general de tus conversaciones recientes con Jorima.
          </ThemedText>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <Feather
              name="alert-circle"
              size={20}
              color={datos.alertas.total > 0 ? "#DC2626" : COLORS.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <ThemedText variant="h3" style={{ marginBottom: 4 }}>
                Alertas
              </ThemedText>

              {datos.alertas.pertenece_institucion ? (
                datos.alertas.total > 0 ? (
                  <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                    Tu institución ha sido notificada {datos.alertas.total}{" "}
                    {datos.alertas.total === 1 ? "vez" : "veces"} sobre señales detectadas en tus
                    conversaciones
                    {datos.alertas.pendientes > 0 ? `, ${datos.alertas.pendientes} sin revisar todavía` : ""}.
                    {datos.alertas.ultima_fecha
                      ? ` Última: ${formatearFecha(datos.alertas.ultima_fecha)}.`
                      : ""}
                  </ThemedText>
                ) : (
                  <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                    No se ha notificado a nadie sobre tu cuenta. Todo tranquilo por ahora.
                  </ThemedText>
                )
              ) : (
                <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                  Tu cuenta es personal, sin institución asociada — nadie más ve tu actividad. Si
                  en algún momento necesitas apoyo, Jorima siempre te va a ofrecer recursos de
                  ayuda profesional cuando lo detecte.
                </ThemedText>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, gap: 16 },
  centerState: { flex: 1, justifyContent: "center", alignItems: "center", padding: SIZES.padding },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  nivelRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  nivelCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  labelUpper: { textTransform: "uppercase", letterSpacing: 0.5 },
});
