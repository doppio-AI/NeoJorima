import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, View, Animated, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import MensajeMotivadorFinal from "@/components/MensajeMotivadorFinal";

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

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Feather name="x" size={22} color={COLORS.textSecondary} />
      </TouchableOpacity>

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
  closeButton: { position: "absolute", top: 50, right: 20, zIndex: 10 },
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
