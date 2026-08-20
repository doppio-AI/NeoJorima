import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedInput from "@/components/ThemedInput";
import ThemedButton from "@/components/ThemedButton";
import { API_URL } from "@/config/api";

export default function RegisterScreen() {
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!nombre.trim() || !apellidoPaterno.trim() || !correo.trim() || !contrasena) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/api/registro/mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido_paterno: apellidoPaterno.trim(),
          apellido_materno: apellidoMaterno.trim() || undefined,
          correo: correo.trim().toLowerCase(),
          contrasena,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo crear la cuenta");
        return;
      }

      if (typeof data.token !== "string" || !data.token) {
        setError("No se pudo crear la sesión. Intenta iniciar sesión manualmente.");
        return;
      }

      await AsyncStorage.multiSet([
        ["usuario", JSON.stringify(data.usuario)],
        ["session_token", data.token],
      ]);

      router.replace("/(onboarding)/avatar");
    } catch (err) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText variant="h1" color={COLORS.primary}>
              Crear cuenta
            </ThemedText>
            <ThemedText variant="body" color={COLORS.textSecondary}>
              Regístrate para empezar a usar Jorima.
            </ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedInput placeholder="Nombre" value={nombre} onChangeText={setNombre} />
            <ThemedInput
              placeholder="Apellido paterno"
              value={apellidoPaterno}
              onChangeText={setApellidoPaterno}
            />
            <ThemedInput
              placeholder="Apellido materno (opcional)"
              value={apellidoMaterno}
              onChangeText={setApellidoMaterno}
            />
            <ThemedInput
              placeholder="Correo electrónico"
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <ThemedInput
              placeholder="Contraseña"
              secureTextEntry
              value={contrasena}
              onChangeText={setContrasena}
              autoCapitalize="none"
            />
            <ThemedInput
              placeholder="Confirmar contraseña"
              secureTextEntry
              value={confirmar}
              onChangeText={setConfirmar}
              autoCapitalize="none"
            />

            {!!error && (
              <ThemedText color={COLORS.error} variant="bodySmall">
                {error}
              </ThemedText>
            )}

            <ThemedButton
              title={loading ? "Creando cuenta..." : "Crear cuenta"}
              onPress={handleRegister}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, gap: 24, flexGrow: 1 },
  header: { gap: 6 },
  form: { gap: 14 },
});
