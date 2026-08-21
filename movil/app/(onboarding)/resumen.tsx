import React, { useState } from "react";
import { SafeAreaView, StyleSheet, View, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import OnboardingHeader from "@/components/OnboardingHeader";
import { useOnboarding } from "@/context/OnboardingContext";
import { authFetch } from "@/lib/api";

export default function ResumenScreen() {
  const {
    avatarGenero,
    horasActividadDiaria,
    tareasPorDia,
    tareasPendientesMes,
    personasDependientes,
    nombresDependientes,
  } = useOnboarding();

  const [loading, setLoading] = useState(false);

  const finalizar = async () => {
    try {
      setLoading(true);

      const res = await authFetch("/api/onboarding", {
        method: "POST",
        body: JSON.stringify({
          avatar_genero: avatarGenero,
          horas_actividad_diaria: horasActividadDiaria,
          tareas_por_dia: tareasPorDia,
          tareas_pendientes_mes: tareasPendientesMes,
          personas_dependientes: personasDependientes,
          nombres_dependientes: nombresDependientes,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        await AsyncStorage.multiRemove(["usuario", "session_token"]);
        router.replace("/(auth)/login");
        return;
      }

      if (!res.ok) {
        Alert.alert("Error", data.error || "No se pudo completar el registro.");
        return;
      }

      const storedUser = await AsyncStorage.getItem("usuario");
      if (storedUser) {
        const usuario = JSON.parse(storedUser);
        await AsyncStorage.setItem(
          "usuario",
          JSON.stringify({
            ...usuario,
            avatar_genero: avatarGenero,
            onboarding_completo: true,
          })
        );
      }

      router.replace("/(tabs)/home");
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const resumenItems = [
    { label: "Asistente", valor: avatarGenero === "masculino" ? "Jorimo" : "Jorima" },
    { label: "Horas de actividad al día", valor: String(horasActividadDiaria) },
    { label: "Tareas por día", valor: String(tareasPorDia) },
    { label: "Tareas pendientes este mes", valor: String(tareasPendientesMes) },
    { label: "Personas dependientes", valor: String(personasDependientes) },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <OnboardingHeader
          paso={4}
          total={4}
          mensaje="Esto es lo que entendí. Si todo se ve bien, empecemos."
          avatarGenero={avatarGenero}
        />

        <View style={styles.card}>
          {resumenItems.map((item) => (
            <View key={item.label} style={styles.row}>
              <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                {item.label}
              </ThemedText>
              <ThemedText>{item.valor}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <ThemedButton
            title={loading ? "Guardando..." : "Empezar a usar Jorima"}
            onPress={finalizar}
            loading={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, gap: 24, flexGrow: 1 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 14,
  },
  row: { gap: 2 },
  footer: { paddingTop: 12 },
});
