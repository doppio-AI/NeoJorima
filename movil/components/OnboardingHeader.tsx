import React from "react";
import { View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import type { AvatarGenero } from "@/context/OnboardingContext";

interface Props {
  paso: number;
  total: number;
  mensaje: string;
  avatarGenero?: AvatarGenero;
}

export default function OnboardingHeader({
  paso,
  total,
  mensaje,
  avatarGenero = "femenino",
}: Props) {
  const nombre = avatarGenero === "masculino" ? "Jorimo" : "Jorima";

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < paso ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      <View style={styles.bubbleRow}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons
            name={avatarGenero === "masculino" ? "robot" : "robot-outline"}
            size={26}
            color={COLORS.white}
          />
        </View>

        <View style={styles.bubble}>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
            {nombre}
          </ThemedText>
          <ThemedText variant="body">{mensaje}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    gap: 16,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    backgroundColor: COLORS.gray200,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  bubble: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 4,
  },
});
