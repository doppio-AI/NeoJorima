import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import OnboardingHeader from "@/components/OnboardingHeader";
import { useOnboarding } from "@/context/OnboardingContext";
import { authFetch } from "@/lib/api";

type Edificio = { edificio_id: number; nombre: string };

export default function EmpresaScreen() {
  const { avatarGenero, edificioId, setEdificioId } = useOnboarding();
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch("/api/edificios")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEdificios(
            data.map((e: any) => ({ edificio_id: e.edificio_id, nombre: e.nombre }))
          );
        } else {
          setError("No se pudo cargar la lista de organizaciones.");
        }
      })
      .catch(() => setError("No se pudo conectar con el servidor."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <OnboardingHeader
          paso={3}
          total={6}
          mensaje="¿A cuál organización perteneces?"
          avatarGenero={avatarGenero}
        />

        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : error ? (
          <ThemedText color={COLORS.error}>{error}</ThemedText>
        ) : edificios.length === 0 ? (
          <ThemedText color={COLORS.textSecondary}>
            Todavía no hay organizaciones registradas. Puedes continuar como cuenta
            personal por ahora.
          </ThemedText>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={{ gap: 12 }}>
            {edificios.map((e) => (
              <TouchableOpacity
                key={e.edificio_id}
                style={[styles.item, edificioId === e.edificio_id && styles.itemSelected]}
                onPress={() => setEdificioId(e.edificio_id)}
                activeOpacity={0.85}
              >
                <ThemedText color={edificioId === e.edificio_id ? COLORS.white : COLORS.text}>
                  {e.nombre}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <ThemedButton
            title="Continuar"
            onPress={() => router.push("/(onboarding)/carga")}
            disabled={!edificioId}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SIZES.padding },
  list: { flex: 1, marginTop: 8 },
  item: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: 16,
    backgroundColor: COLORS.white,
  },
  itemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  footer: { paddingTop: 16 },
});
