import React from "react";
import { View, StyleSheet } from "react-native";

import ThemedText from "@/components/ThemedText";
import { COLORS } from "@/constants/theme";

/* ─────────────────────────────────────────────────
   Racha con raíz — pieza visual (equivalente móvil de
   RachaBienestar.tsx en web). Ver la lógica en
   web/lib/racha.ts — el backend es compartido.

   A propósito NO usa una flama: la flama es el ícono
   que asociamos con rachas que se rompen y generan
   ansiedad. Usamos un brote 🌱 porque la métafora es
   "algo que crece contigo", no "algo que puedes perder
   de golpe".
   ───────────────────────────────────────────────── */

interface Props {
  rachaActual: number;
  rachaRaiz: number;
}

export default function RachaBienestar({ rachaActual, rachaRaiz }: Props) {
  if (rachaActual <= 0) return null;

  const dias = rachaActual === 1 ? "día" : "días";
  const tooltip =
    rachaRaiz > 0
      ? `Tienes ${rachaRaiz} día${rachaRaiz === 1 ? "" : "s"} asegurados para siempre. Aunque falte un día, tu racha no vuelve a cero.`
      : "Cada semana seguida asegura la mitad de tu racha para siempre. Nunca vuelve a cero.";

  return (
    <View style={styles.badge} accessibilityLabel={tooltip}>
      <ThemedText variant="caption" color={COLORS.textSecondary}>
        🌱 <ThemedText variant="caption" color={COLORS.primary}>{rachaActual}</ThemedText> {dias} cuidándote
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginTop: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});
