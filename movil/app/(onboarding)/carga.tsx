import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedInput from "@/components/ThemedInput";
import ThemedButton from "@/components/ThemedButton";
import OnboardingHeader from "@/components/OnboardingHeader";
import { useOnboarding } from "@/context/OnboardingContext";

function soloDigitos(texto: string): number {
  const limpio = texto.replace(/[^0-9]/g, "");
  return limpio ? Number(limpio) : 0;
}

export default function CargaScreen() {
  const {
    avatarGenero,
    horasActividadDiaria,
    setHorasActividadDiaria,
    tareasPorDia,
    setTareasPorDia,
    tareasPendientesMes,
    setTareasPendientesMes,
  } = useOnboarding();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <OnboardingHeader
            paso={2}
            total={4}
            mensaje="Cuéntame un poco de tu día a día para entender tu carga actual."
            avatarGenero={avatarGenero}
          />

          <View style={styles.field}>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              ¿Cuántas horas al día dedicas a trabajar, estudiar u otras actividades pesadas?
            </ThemedText>
            <ThemedInput
              keyboardType="numeric"
              value={String(horasActividadDiaria)}
              onChangeText={(t) => setHorasActividadDiaria(soloDigitos(t))}
            />
          </View>

          <View style={styles.field}>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              ¿Cuántas tareas sueles hacer en un día típico?
            </ThemedText>
            <ThemedInput
              keyboardType="numeric"
              value={String(tareasPorDia)}
              onChangeText={(t) => setTareasPorDia(soloDigitos(t))}
            />
          </View>

          <View style={styles.field}>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              ¿Cuántas tareas tienes pendientes antes de que termine el mes?
            </ThemedText>
            <ThemedInput
              keyboardType="numeric"
              value={String(tareasPendientesMes)}
              onChangeText={(t) => setTareasPendientesMes(soloDigitos(t))}
            />
          </View>

          <View style={styles.footer}>
            <ThemedButton
              title="Continuar"
              onPress={() => router.push("/(onboarding)/dependientes")}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, gap: 20, flexGrow: 1 },
  field: { gap: 8 },
  footer: { paddingTop: 12 },
});
