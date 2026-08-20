import React from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import OnboardingHeader from "@/components/OnboardingHeader";
import { useOnboarding } from "@/context/OnboardingContext";

export default function AvatarScreen() {
  const { avatarGenero, setAvatarGenero } = useOnboarding();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <OnboardingHeader
          paso={1}
          total={6}
          mensaje="¡Hola! Soy tu asistente de bienestar. Antes de empezar, ¿con qué versión te sientes más a gusto?"
          avatarGenero={avatarGenero}
        />

        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.option, avatarGenero === "femenino" && styles.optionSelected]}
            onPress={() => setAvatarGenero("femenino")}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="robot-outline"
              size={40}
              color={avatarGenero === "femenino" ? COLORS.white : COLORS.primary}
            />
            <ThemedText
              variant="h3"
              color={avatarGenero === "femenino" ? COLORS.white : COLORS.text}
            >
              Jorima
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, avatarGenero === "masculino" && styles.optionSelected]}
            onPress={() => setAvatarGenero("masculino")}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="robot"
              size={40}
              color={avatarGenero === "masculino" ? COLORS.white : COLORS.primary}
            />
            <ThemedText
              variant="h3"
              color={avatarGenero === "masculino" ? COLORS.white : COLORS.text}
            >
              Jorimo
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedButton
            title="Continuar"
            onPress={() => router.push("/(onboarding)/tipo-cuenta")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SIZES.padding, justifyContent: "space-between" },
  options: { flexDirection: "row", gap: 16 },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingVertical: 28,
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  footer: { paddingTop: 24 },
});
