import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import MensajeMotivadorFinal from "@/components/MensajeMotivadorFinal";
import ProgressBar from "@/components/ProgressBar";

const PASOS = [
  {
    titulo: "Estira el cuello",
    descripcion: "Inclina la cabeza suavemente hacia un hombro, sostén, y cambia de lado.",
    segundos: 20,
  },
  {
    titulo: "Rueda los hombros",
    descripcion: "Haz círculos lentos con los hombros hacia atrás, respirando con calma.",
    segundos: 20,
  },
  {
    titulo: "Estira los brazos",
    descripcion: "Entrelaza los dedos, estira los brazos frente a ti y arquea la espalda un poco.",
    segundos: 20,
  },
  {
    titulo: "Gira el torso",
    descripcion: "Sentado, gira suavemente el torso hacia un lado y luego hacia el otro.",
    segundos: 20,
  },
];

export default function EstiramientoScreen() {
  const [pasoIndex, setPasoIndex] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(PASOS[0].segundos);
  const [terminado, setTerminado] = useState(false);
  const inicio = useRef(Date.now());

  useEffect(() => {
    if (terminado) return;

    setSegundosRestantes(PASOS[pasoIndex].segundos);

    const interval = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          avanzar();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoIndex]);

  const avanzar = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setPasoIndex((prev) => {
      if (prev + 1 >= PASOS.length) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTerminado(true);
        return prev;
      }
      return prev + 1;
    });
  };

  if (terminado) {
    const duracionSeg = (Date.now() - inicio.current) / 1000;
    return <MensajeMotivadorFinal tipo="estiramiento" duracionSeg={duracionSeg} completada />;
  }

  const paso = PASOS[pasoIndex];
  const progreso = pasoIndex / PASOS.length;

  // Bloque 12: solo pide confirmación pasado el punto medio.
  const salir = () => {
    if (progreso > 0.5) {
      Alert.alert(
        "¿Salir del estiramiento?",
        "Vas a la mitad. Puedes volver cuando quieras, no se pierde nada.",
        [
          { text: "Seguir aquí", style: "cancel" },
          { text: "Salir", style: "destructive", onPress: () => router.replace("/(tabs)/home") },
        ]
      );
    } else {
      router.replace("/(tabs)/home");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={salir}>
          <Feather name="x" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.progressWrapper}>
          <ProgressBar value={progreso} color={COLORS.lavanda} />
        </View>
      </View>

      <View style={styles.content}>
        <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
          Paso {pasoIndex + 1} de {PASOS.length}
        </ThemedText>

        <View style={styles.timerCircle}>
          <ThemedText variant="h1" color={COLORS.primary}>
            {segundosRestantes}
          </ThemedText>
        </View>

        <ThemedText variant="h2" style={{ textAlign: "center" }}>
          {paso.titulo}
        </ThemedText>
        <ThemedText variant="body" color={COLORS.textSecondary} style={{ textAlign: "center" }}>
          {paso.descripcion}
        </ThemedText>

        <ThemedButton title="Siguiente" onPress={avanzar} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  closeButton: {},
  progressWrapper: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: SIZES.padding,
  },
  timerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
