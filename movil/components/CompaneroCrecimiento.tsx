import React from "react";
import { View, StyleSheet } from "react-native";

import ThemedText from "@/components/ThemedText";
import { COLORS } from "@/constants/theme";

/* ─────────────────────────────────────────────────
   Compañero que crece contigo (idea #4 de "Enganche Sano").
   Equivalente móvil de CompaneroCrecimiento.tsx en web.

   Crece con el conteo histórico total de check-ins
   (dias_totales), no con la racha, así que solo puede
   subir — nunca se marchita ni retrocede de etapa por
   faltar un día.
   ───────────────────────────────────────────────── */

type Etapa = { minDias: number; emoji: string; nombre: string };

const ETAPAS: Etapa[] = [
  { minDias: 0, emoji: "🌰", nombre: "Semilla" },
  { minDias: 1, emoji: "🌱", nombre: "Brote" },
  { minDias: 3, emoji: "🌿", nombre: "Planta joven" },
  { minDias: 7, emoji: "🪴", nombre: "En su maceta" },
  { minDias: 14, emoji: "🌳", nombre: "Arbolito" },
  { minDias: 30, emoji: "🌳🌸", nombre: "Floreciendo" },
];

function etapaActual(diasTotales: number): { etapa: Etapa; indice: number } {
  let indice = 0;
  for (let i = 0; i < ETAPAS.length; i++) {
    if (diasTotales >= ETAPAS[i].minDias) indice = i;
  }
  return { etapa: ETAPAS[indice], indice };
}

export default function CompaneroCrecimiento({ diasTotales }: { diasTotales: number }) {
  const { etapa, indice } = etapaActual(diasTotales);
  const siguiente = ETAPAS[indice + 1];

  return (
    <View style={styles.container}>
      <ThemedText style={styles.emoji}>{etapa.emoji}</ThemedText>
      <ThemedText variant="bodySmall" style={{ fontWeight: "600" }}>
        {etapa.nombre}
      </ThemedText>
      <ThemedText variant="caption" color={COLORS.textSecondary}>
        {siguiente
          ? `${siguiente.minDias - diasTotales} ${siguiente.minDias - diasTotales === 1 ? "día" : "días"} para crecer más`
          : "Creciendo contigo"}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 2 },
  emoji: { fontSize: 40, lineHeight: 46 },
});
