import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, View, Animated, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import MensajeMotivadorFinal from "@/components/MensajeMotivadorFinal";
import ProgressBar from "@/components/ProgressBar";

const CICLOS = 4;
const FASES = [
  { nombre: "Inhala", duracionMs: 4000, escala: 1.4 },
  { nombre: "Sostén", duracionMs: 7000, escala: 1.4 },
  { nombre: "Exhala", duracionMs: 8000, escala: 0.7 },
] as const;

export default function RespiracionScreen() {
  const [faseIndex, setFaseIndex] = useState(0);
  const [ciclo, setCiclo] = useState(1);
  const [terminado, setTerminado] = useState(false);

  const escala = useRef(new Animated.Value(0.7)).current;
  const detenido = useRef(false);
  const inicio = useRef(Date.now());

  useEffect(() => {
    const correr = async () => {
      for (let c = 1; c <= CICLOS; c++) {
        if (detenido.current) return;
        setCiclo(c);

        for (let f = 0; f < FASES.length; f++) {
          if (detenido.current) return;
          setFaseIndex(f);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          await new Promise<void>((resolve) => {
            Animated.timing(escala, {
              toValue: FASES[f].escala,
              duration: FASES[f].duracionMs,
              useNativeDriver: true,
            }).start(() => resolve());
          });
        }
      }

      if (!detenido.current) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTerminado(true);
      }
    };

    void correr();

    return () => {
      detenido.current = true;
    };
  }, []);

  if (terminado) {
    const duracionSeg = (Date.now() - inicio.current) / 1000;
    return <MensajeMotivadorFinal tipo="respiracion" duracionSeg={duracionSeg} completada />;
  }

  const progreso = ((ciclo - 1) * FASES.length + faseIndex) / (CICLOS * FASES.length);

  // Bloque 12: salir a la mitad no pide confirmación — solo se pregunta
  // pasado el punto medio, para no atrapar a alguien que quiere irse.
  const salir = () => {
    if (progreso > 0.5) {
      Alert.alert(
        "¿Salir de la respiración?",
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
          Ciclo {ciclo} de {CICLOS}
        </ThemedText>

        <View style={styles.circleWrapper}>
          <Animated.View style={[styles.circle, { transform: [{ scale: escala }] }]} />
        </View>

        <ThemedText variant="h1" color={COLORS.primary}>
          {FASES[faseIndex].nombre}
        </ThemedText>

        <ThemedText variant="body" color={COLORS.textSecondary} style={{ textAlign: "center" }}>
          Sigue el ritmo del círculo. No hay prisa.
        </ThemedText>
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
  circleWrapper: { width: 220, height: 220, justifyContent: "center", alignItems: "center" },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.primary,
    opacity: 0.85,
  },
});
