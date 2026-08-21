import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import { obtenerCatalogoRelajacion, ActividadRelajacion } from "@/lib/relajacion";

const RUTA_POR_PANTALLA: Record<string, string> = {
  RelajacionRespiracion: "/(relajacion)/respiracion",
  RelajacionEstiramiento: "/(relajacion)/estiramiento",
  RelajacionBurbujas: "/(relajacion)/burbujas",
  RelajacionMemorama: "/(relajacion)/memorama",
};

const ICONO_POR_TIPO: Record<string, keyof typeof Feather.glyphMap> = {
  respiracion: "wind",
  estiramiento: "activity",
  asmr: "circle",
  juego: "grid",
};

export default function RelajacionPickerScreen() {
  const [catalogo, setCatalogo] = useState<ActividadRelajacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerCatalogoRelajacion()
      .then(setCatalogo)
      .finally(() => setLoading(false));
  }, []);

  const irA = (actividad: ActividadRelajacion) => {
    const ruta = RUTA_POR_PANTALLA[actividad.pantalla];
    if (ruta) router.push(ruta as any);
  };

  const sorprendeme = () => {
    if (catalogo.length === 0) return;
    const aleatoria = catalogo[Math.floor(Math.random() * catalogo.length)];
    irA(aleatoria);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <ThemedText variant="h2" color={COLORS.primary}>
            Un momento para ti
          </ThemedText>
          <ThemedText variant="body" color={COLORS.textSecondary}>
            Elige algo para desconectar unos minutos, o deja que Jorima elija por ti.
          </ThemedText>
        </View>

        <ThemedButton title="Sorpréndeme" onPress={sorprendeme} />

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.grid}>
            {catalogo.map((actividad) => (
              <TouchableOpacity
                key={actividad.id}
                style={styles.card}
                onPress={() => irA(actividad)}
                activeOpacity={0.85}
              >
                <Feather
                  name={ICONO_POR_TIPO[actividad.tipo] ?? "circle"}
                  size={24}
                  color={COLORS.primary}
                />
                <ThemedText variant="h3">{actividad.titulo}</ThemedText>
                <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                  {actividad.descripcion}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, gap: 20, flexGrow: 1 },
  header: { gap: 8 },
  backButton: { width: 36, height: 36, justifyContent: "center" },
  grid: { gap: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 6,
  },
});
