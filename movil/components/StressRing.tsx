import React, { useEffect } from "react";
import { View, StyleSheet, AccessibilityInfo } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from "react-native-reanimated";
import { COLORS } from "@/constants/theme";

/*
 * Anillo de nivel de estrés (jorima-estilo-duolingo.md, bloque 7).
 * El color cambia por rango, pero sin lenguaje de fracaso — el
 * texto que lo acompaña siempre lo dice en palabras (ver
 * etiquetaPorNivel en las pantallas que lo usan), nunca un juicio.
 * La mascota va en el centro, pasada como children.
 *
 * Anima una sola vez al llegar el valor real, no en cada
 * re-render, y respeta reduce-motion.
 */

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function colorPorNivel(valor: number): string {
  if (valor <= 33) return COLORS.success;
  if (valor <= 66) return COLORS.sol;
  return COLORS.coral;
}

interface Props {
  valor: number; // 0–100
  size?: number;
  grosor?: number;
  children?: React.ReactNode;
}

export default function StressRing({ valor, size = 180, grosor = 14, children }: Props) {
  const progreso = useSharedValue(0);
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;

  useEffect(() => {
    let activo = true;

    AccessibilityInfo.isReduceMotionEnabled().then((reducido) => {
      if (!activo) return;
      progreso.value = reducido
        ? valor
        : withTiming(valor, { duration: 600, easing: Easing.out(Easing.ease) });
    });

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  const propsAnimadas = useAnimatedProps(() => ({
    strokeDashoffset: circunferencia * (1 - Math.max(0, Math.min(100, progreso.value)) / 100),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        <Circle cx={size / 2} cy={size / 2} r={radio} stroke={COLORS.border} strokeWidth={grosor} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          stroke={colorPorNivel(valor)}
          strokeWidth={grosor}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          animatedProps={propsAnimadas}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.centro}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: "center", justifyContent: "center" },
});
