import React, { useState } from "react";
import { SafeAreaView, StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedInput from "@/components/ThemedInput";
import ThemedButton from "@/components/ThemedButton";
import OnboardingHeader from "@/components/OnboardingHeader";
import { useOnboarding } from "@/context/OnboardingContext";

export default function DependientesScreen() {
  const {
    avatarGenero,
    personasDependientes,
    setPersonasDependientes,
    nombresDependientes,
    setNombresDependientes,
  } = useOnboarding();

  const [nuevoNombre, setNuevoNombre] = useState("");

  const agregarNombre = () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    const nuevos = [...nombresDependientes, nombre];
    setNombresDependientes(nuevos);
    setPersonasDependientes(Math.max(personasDependientes, nuevos.length));
    setNuevoNombre("");
  };

  const quitarNombre = (idx: number) => {
    setNombresDependientes(nombresDependientes.filter((_, i) => i !== idx));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <OnboardingHeader
          paso={5}
          total={6}
          mensaje="¿Hay personas que dependen de ti? Puedo usar esto para darte ánimo cuando lo necesites."
          avatarGenero={avatarGenero}
        />

        <View style={styles.field}>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
            Número de personas que dependen de ti
          </ThemedText>

          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setPersonasDependientes(Math.max(0, personasDependientes - 1))}
            >
              <Feather name="minus" size={18} color={COLORS.primary} />
            </TouchableOpacity>

            <ThemedText variant="h3">{personasDependientes}</ThemedText>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setPersonasDependientes(personasDependientes + 1)}
            >
              <Feather name="plus" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {personasDependientes > 0 && (
          <View style={styles.field}>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Si quieres, dime sus nombres (opcional)
            </ThemedText>

            <View style={styles.addRow}>
              <View style={{ flex: 1 }}>
                <ThemedInput
                  placeholder="Ej. mi mamá"
                  value={nuevoNombre}
                  onChangeText={setNuevoNombre}
                  onSubmitEditing={agregarNombre}
                  returnKeyType="done"
                />
              </View>
              <TouchableOpacity style={styles.addButton} onPress={agregarNombre}>
                <Feather name="plus" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.chips}>
              {nombresDependientes.map((nombre, idx) => (
                <TouchableOpacity
                  key={`${nombre}-${idx}`}
                  style={styles.chip}
                  onPress={() => quitarNombre(idx)}
                >
                  <ThemedText variant="caption" color={COLORS.primary}>
                    {nombre} ✕
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <ThemedButton title="Continuar" onPress={() => router.push("/(onboarding)/resumen")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, gap: 24, flexGrow: 1 },
  field: { gap: 10 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 20, alignSelf: "flex-start" },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  addRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  footer: { paddingTop: 12 },
});
