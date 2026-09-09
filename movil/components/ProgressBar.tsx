import React, { useEffect } from "react";
import { View, StyleSheet, AccessibilityInfo } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { COLORS } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";

/*
 * Barra de progreso "física" (jorima-estilo-duolingo.md, bloque 7):
 * gruesa, extremos redondeados, con un brillo interior en el tercio
 * superior de la porción llena — eso es lo que la hace leer como
 * plástico y no como un <progress> plano.
 *
 * Anima una sola vez, cuando `value` cambia (típicamente al llegar
 * el dato real, no en cada re-render), y respeta reduce-motion.
 */

interface Props {
  value: number; // 0–1
  color?: string;
  label?: string;
}

export default function ProgressBar({ value, color = COLORS.secondary, label }: Props) {
  const progreso = useSharedValue(0);
  const acotado = Math.max(0, Math.min(1, value));

  useEffect(() => {
    let activo = true;

    AccessibilityInfo.isReduceMotionEnabled().then((reducido) => {
      if (!activo) return;
      progreso.value = reducido
        ? acotado
        : withTiming(acotado, { duration: 400, easing: Easing.out(Easing.ease) });
    });

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acotado]);

  const estiloRelleno = useAnimatedStyle(() => ({
    width: `${progreso.value * 100}%`,
  }));

  return (
    <View>
      {!!label && (
        <ThemedText variant="caption" color={COLORS.textSecondary} style={styles.label}>
          {label}
        </ThemedText>
      )}
      <View style={styles.pista} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(acotado * 100) }}>
        <Animated.View style={[styles.relleno, { backgroundColor: color }, estiloRelleno]}>
          <View style={styles.brillo} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  pista: {
    height: 16,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  relleno: {
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
  },
  brillo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "34%",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
});
