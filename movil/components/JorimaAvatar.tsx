import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

/**
 * Expresiones disponibles. Los nombres coinciden con los archivos
 * en assets/jorima/*.png para que sea fácil ubicar cuál es cuál.
 */
export type JorimaMood =
  | "sereno1"        // neutral, ojos abiertos
  | "sereno2"        // neutral, variante (para simular que "habla")
  | "sonrisa_amplia" // contenta / respuesta positiva
  | "preocupacion"   // alerta leve / mensaje del usuario con riesgo
  | "tristeza";      // mood del usuario reportado como "mal" / "muy mal"

// TODO: cuando existan las imágenes de "Jorimo" (versión masculina),
// agregar aquí un segundo mapa IMAGENES_MASCULINO con la misma forma
// y quitar el fallback de ícono de abajo.
const IMAGENES_FEMENINO: Record<JorimaMood, any> = {
  sereno1: require("../assets/jorima/sereno1.png"),
  sereno2: require("../assets/jorima/sereno2.png"),
  sonrisa_amplia: require("../assets/jorima/sonrisa_amplia.png"),
  preocupacion: require("../assets/jorima/preocupacion.png"),
  tristeza: require("../assets/jorima/tristeza.png"),
};

interface Props {
  mood: JorimaMood;
  avatarGenero?: "femenino" | "masculino";
  /** Si está "hablando", alterna sereno1/sereno2 para simular movimiento. */
  talking?: boolean;
  size?: number;
}

export default function JorimaAvatar({
  mood,
  avatarGenero = "femenino",
  talking = false,
  size = 96,
}: Props) {
  const [frame, setFrame] = useState<JorimaMood>(mood);

  useEffect(() => {
    if (!talking) {
      setFrame(mood);
      return;
    }

    const interval = setInterval(() => {
      setFrame((prev) => (prev === "sereno1" ? "sereno2" : "sereno1"));
    }, 450);

    return () => clearInterval(interval);
  }, [talking, mood]);

  const dimensiones = { width: size, height: size, borderRadius: size / 2 };

  if (avatarGenero === "masculino") {
    // Placeholder hasta tener el set de imágenes de Jorimo.
    return (
      <View style={[styles.container, styles.iconFallback, dimensiones]}>
        <MaterialCommunityIcons name="robot" size={size * 0.55} color={COLORS.white} />
      </View>
    );
  }

  return (
    <View style={[styles.container, dimensiones]}>
      <Image source={IMAGENES_FEMENINO[frame]} style={dimensiones} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  iconFallback: {
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
