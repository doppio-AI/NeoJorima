import React, { useEffect, useState } from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import JorimaAvatar from "@/components/JorimaAvatar";
import { registrarSesionRelajacion, obtenerNombresDependientes } from "@/lib/relajacion";

const MENSAJES_GENERICOS = [
  "Tómate este momento como tuyo. Lo hiciste bien.",
  "Cada pausa cuenta. Gracias por cuidarte hoy.",
  "Un respiro a la vez. Vas por buen camino.",
  "Cuidarte a ti también es productivo.",
];

interface Props {
  tipo: "respiracion" | "estiramiento" | "juego" | "asmr";
  duracionSeg: number;
  completada?: boolean;
}

export default function MensajeMotivadorFinal({
  tipo,
  duracionSeg,
  completada = true,
}: Props) {
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [avatarGenero, setAvatarGenero] = useState<"femenino" | "masculino">("femenino");

  useEffect(() => {
    let activo = true;

    const finalizar = async () => {
      const storedUser = await AsyncStorage.getItem("usuario");
      if (storedUser) {
        try {
          const usuario = JSON.parse(storedUser);
          if (usuario?.avatar_genero === "masculino") setAvatarGenero("masculino");
        } catch {
          // ignorar
        }
      }

      const [nombres] = await Promise.all([
        obtenerNombresDependientes(),
        registrarSesionRelajacion({
          tipo,
          duracion_seg: Math.max(1, Math.round(duracionSeg)),
          completada,
        }),
      ]);

      if (!activo) return;

      setMensaje(
        nombres.length > 0
          ? `Te tomaste este momento para ti. Eso también es cuidar de ${
              nombres[Math.floor(Math.random() * nombres.length)]
            }.`
          : MENSAJES_GENERICOS[Math.floor(Math.random() * MENSAJES_GENERICOS.length)]
      );

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCargando(false);
    };

    void finalizar();

    return () => {
      activo = false;
    };
  }, [tipo, duracionSeg, completada]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <JorimaAvatar mood="sonrisa_amplia" avatarGenero={avatarGenero} size={150} />

        {cargando ? (
          <ThemedText color={COLORS.textSecondary}>Un momento...</ThemedText>
        ) : (
          <ThemedText variant="h3" style={{ textAlign: "center" }}>
            {mensaje}
          </ThemedText>
        )}

        <ThemedButton title="Volver a inicio" onPress={() => router.replace("/(tabs)/home")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: SIZES.padding,
  },
});
