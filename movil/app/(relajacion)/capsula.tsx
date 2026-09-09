import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import MensajeMotivadorFinal from "@/components/MensajeMotivadorFinal";
import { obtenerCapsulaDeHoy, Capsula } from "@/lib/relajacion";

/* ─────────────────────────────────────────────────
   Cápsula de 90 segundos.

   A propósito NO hay botón de "siguiente" ni lista para
   explorar: se muestra una sola cápsula, elegida para la
   persona, y el único camino hacia adelante es cerrarla.
   ───────────────────────────────────────────────── */
export default function CapsulaScreen() {
  const [capsula, setCapsula] = useState<Capsula | null>(null);
  const [cargando, setCargando] = useState(true);
  const [terminado, setTerminado] = useState(false);
  const inicio = useRef(Date.now());

  useEffect(() => {
    obtenerCapsulaDeHoy()
      .then(setCapsula)
      .finally(() => setCargando(false));
  }, []);

  if (terminado) {
    const duracionSeg = (Date.now() - inicio.current) / 1000;
    return <MensajeMotivadorFinal tipo="capsula" duracionSeg={duracionSeg} completada />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Feather name="x" size={22} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <View style={styles.content}>
        {cargando ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : capsula ? (
          <>
            <Feather name="feather" size={28} color={COLORS.primary} />
            <ThemedText variant="h2" style={{ textAlign: "center" }}>
              {capsula.titulo}
            </ThemedText>
            <ThemedText variant="body" color={COLORS.textSecondary} style={{ textAlign: "center" }}>
              {capsula.texto}
            </ThemedText>
            <ThemedButton title="Listo por hoy" onPress={() => setTerminado(true)} />
          </>
        ) : (
          <ThemedText color={COLORS.textSecondary}>No se pudo cargar tu cápsula de hoy.</ThemedText>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  closeButton: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
    padding: SIZES.padding,
  },
});
