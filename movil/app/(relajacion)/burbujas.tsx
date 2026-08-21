import React, { useRef, useState } from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Animated } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import MensajeMotivadorFinal from "@/components/MensajeMotivadorFinal";

const TOTAL_BURBUJAS = 24;

export default function BurbujasScreen() {
  const [popped, setPopped] = useState<boolean[]>(() => Array(TOTAL_BURBUJAS).fill(false));
  const [terminado, setTerminado] = useState(false);
  const inicio = useRef(Date.now());
  const escalas = useRef(
    Array.from({ length: TOTAL_BURBUJAS }, () => new Animated.Value(1))
  ).current;

  const popCount = popped.filter(Boolean).length;

  const pop = (i: number) => {
    if (popped[i]) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.timing(escalas[i], { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(escalas[i], { toValue: 0.85, duration: 100, useNativeDriver: true }),
    ]).start();

    setPopped((prev) => {
      const next = [...prev];
      next[i] = true;

      if (next.every(Boolean)) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return next;
    });
  };

  if (terminado || popCount === TOTAL_BURBUJAS) {
    const duracionSeg = (Date.now() - inicio.current) / 1000;
    return <MensajeMotivadorFinal tipo="asmr" duracionSeg={duracionSeg} completada />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Feather name="x" size={22} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <ThemedText variant="h2" color={COLORS.primary}>
          Revienta las burbujas
        </ThemedText>
        <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
          {popCount}/{TOTAL_BURBUJAS}
        </ThemedText>
      </View>

      <View style={styles.grid}>
        {popped.map((estaPopped, i) => (
          <TouchableOpacity key={i} onPress={() => pop(i)} activeOpacity={0.8}>
            <Animated.View
              style={[
                styles.bubble,
                { transform: [{ scale: escalas[i] }] },
                estaPopped ? styles.bubblePopped : styles.bubbleActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <ThemedButton title="Terminar" onPress={() => setTerminado(true)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  closeButton: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  header: { alignItems: "center", marginTop: 40, marginBottom: 24, gap: 4 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    flex: 1,
  },
  bubble: { width: 52, height: 52, borderRadius: 26 },
  bubbleActive: { backgroundColor: COLORS.primary },
  bubblePopped: { backgroundColor: COLORS.border },
});
