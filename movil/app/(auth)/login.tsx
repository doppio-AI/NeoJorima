import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedInput from "@/components/ThemedInput";
import ThemedButton from "@/components/ThemedButton";

import { API_URL } from "../../config/api";

export default function LoginScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!correo.trim() || !contrasena.trim()) {
      setError("Completa todos los campos");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/api/login/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: correo.trim(),
          contrasena: contrasena.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      if (typeof data.token !== "string" || !data.token) {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
        return;
      }

      // Guardamos ambos juntos para no dejar al usuario "logueado"
      // con solo uno de los dos si algo falla a la mitad.
      await AsyncStorage.multiSet([
        ["usuario", JSON.stringify(data.usuario)],
        ["session_token", data.token],
      ]);

      // NUEVO: si el usuario nunca terminó el wizard (por ejemplo, cerró
      // la app a la mitad), lo regresamos ahí en vez de mandarlo a home.
      if (data.usuario?.onboarding_completo === false) {
        router.replace("/(onboarding)/avatar");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText variant="h1" color={COLORS.primary}>
            Jorima
          </ThemedText>
          <ThemedText variant="body" color={COLORS.textSecondary}>
            Bienestar laboral en un solo lugar
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedInput
            placeholder="Correo electrónico"
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.inputGap} />

          <ThemedInput
            placeholder="Contraseña"
            secureTextEntry
            value={contrasena}
            onChangeText={setContrasena}
            autoCapitalize="none"
          />

          <View style={styles.buttonGap} />

          <ThemedButton
            title={loading ? "Ingresando..." : "Iniciar sesión"}
            onPress={handleLogin}
            loading={loading}
          />

          {!!error && (
            <>
              <View style={styles.buttonGap} />
              <ThemedText color={COLORS.error} variant="bodySmall">
                {error}
              </ThemedText>
            </>
          )}

          <View style={styles.buttonGap} />

          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <ThemedText color={COLORS.primary} style={{ textAlign: "center" }}>
              ¿No tienes cuenta? Regístrate
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SIZES.padding, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40, gap: 6 },
  form: { width: "100%" },
  inputGap: { height: 16 },
  buttonGap: { height: 16 },
});
