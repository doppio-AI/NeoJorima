import React from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import OnboardingHeader from "@/components/OnboardingHeader";
import { useOnboarding } from "@/context/OnboardingContext";

export default function TipoCuentaScreen() {
  const { avatarGenero, tipoCuenta, setTipoCuenta } = useOnboarding();

  const handleContinuar = () => {
    if (!tipoCuenta) return;
    router.push(
      tipoCuenta === "empresa" ? "/(onboarding)/empresa" : "/(onboarding)/carga"
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <OnboardingHeader
          paso={2}
          total={6}
          mensaje="¿Vas a usar Jorima por tu cuenta o formas parte de una organización que ya trabaja con nosotros?"
          avatarGenero={avatarGenero}
        />

        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.card, tipoCuenta === "personal" && styles.cardSelected]}
            onPress={() => setTipoCuenta("personal")}
            activeOpacity={0.85}
          >
            <Feather
              name="user"
              size={26}
              color={tipoCuenta === "personal" ? COLORS.white : COLORS.primary}
            />
            <ThemedText variant="h3" color={tipoCuenta === "personal" ? COLORS.white : COLORS.text}>
              Uso personal
            </ThemedText>
            <ThemedText
              variant="bodySmall"
              color={tipoCuenta === "personal" ? COLORS.white : COLORS.textSecondary}
            >
              Estudiante, freelancer o cualquier persona que quiera manejar su estrés.
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, tipoCuenta === "empresa" && styles.cardSelected]}
            onPress={() => setTipoCuenta("empresa")}
            activeOpacity={0.85}
          >
            <Feather
              name="briefcase"
              size={26}
              color={tipoCuenta === "empresa" ? COLORS.white : COLORS.primary}
            />
            <ThemedText variant="h3" color={tipoCuenta === "empresa" ? COLORS.white : COLORS.text}>
              Empresa / institución
            </ThemedText>
            <ThemedText
              variant="bodySmall"
              color={tipoCuenta === "empresa" ? COLORS.white : COLORS.textSecondary}
            >
              Perteneces a una organización que ya está dada de alta en Jorima.
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedButton title="Continuar" onPress={handleContinuar} disabled={!tipoCuenta} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SIZES.padding, justifyContent: "space-between" },
  options: { gap: 16 },
  card: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: 20,
    gap: 8,
    backgroundColor: COLORS.white,
  },
  cardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  footer: { paddingTop: 24 },
});
