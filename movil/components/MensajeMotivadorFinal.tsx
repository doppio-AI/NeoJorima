import React, { useEffect, useState } from "react";
import { SafeAreaView, View, StyleSheet, AccessibilityInfo, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import ConfettiCannon from "react-native-confetti-cannon";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import JorimaAvatar from "@/components/JorimaAvatar";
import {
  registrarSesionRelajacion,
  obtenerNombresDependientes,
  obtenerConteoRelajacion,
} from "@/lib/relajacion";

const MENSAJES_GENERICOS = [
  "Tómate este momento como tuyo. Lo hiciste bien.",
  "Cada pausa cuenta. Gracias por cuidarte hoy.",
  "Un respiro a la vez. Vas por buen camino.",
  "Cuidarte a ti también es productivo.",
];

interface Props {
  tipo: "respiracion" | "estiramiento" | "juego" | "asmr" | "capsula";
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
  const [conteo, setConteo] = useState<number | null>(null);
  const [mostrarConfeti, setMostrarConfeti] = useState(false);
  const { width } = useWindowDimensions();

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

      // El conteo se pide DESPUÉS de registrar la sesión, para que ya
      // incluya la que se acaba de completar.
      const total = await obtenerConteoRelajacion();

      if (!activo) return;

      setMensaje(
        nombres.length > 0
          ? `Te tomaste este momento para ti. Eso también es cuidar de ${
              nombres[Math.floor(Math.random() * nombres.length)]
            }.`
          : MENSAJES_GENERICOS[Math.floor(Math.random() * MENSAJES_GENERICOS.length)]
      );
      setConteo(total);

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Celebración sin castigo (bloque 11): confeti al completar, nunca
      // al fallar o al faltar un día — aquí solo existe el camino de éxito.
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      if (!reduceMotion) setMostrarConfeti(true);

      setCargando(false);
    };

    void finalizar();

    return () => {
      activo = false;
    };
  }, [tipo, duracionSeg, completada]);

  return (
    <SafeAreaView style={styles.container}>
      {mostrarConfeti && (
        <ConfettiCannon
          count={80}
          origin={{ x: width / 2, y: 0 }}
          fadeOut
          fallSpeed={2500}
        />
      )}

      <View style={styles.content}>
        <JorimaAvatar mood="sonrisa_amplia" avatarGenero={avatarGenero} size={150} />

        {cargando ? (
          <ThemedText color={COLORS.textSecondary}>Un momento...</ThemedText>
        ) : (
          <>
            <ThemedText variant="h3" style={{ textAlign: "center" }}>
              {mensaje}
            </ThemedText>

            {/* Contador acumulativo que nunca se reinicia — nunca una racha
                consecutiva que se pueda perder por faltar un día. */}
            {!!conteo && conteo > 0 && (
              <View style={styles.contadorBadge}>
                <ThemedText variant="caption" color={COLORS.textSecondary}>
                  🌿 {conteo} {conteo === 1 ? "pausa activa" : "pausas activas"} desde que empezaste
                </ThemedText>
              </View>
            )}
          </>
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
  contadorBadge: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});
