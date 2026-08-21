import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

export type JorimaMood =
  | "sereno1"
  | "sereno2"
  | "sonrisa_amplia"
  | "preocupacion"
  | "tristeza";

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
  const escala = useRef(new Animated.Value(1)).current;

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

  // "Pop" cada vez que cambia la expresión visible — hace que se sienta
  // viva en vez de solo cambiar de foto de golpe.
  useEffect(() => {
    Animated.sequence([
      Animated.timing(escala, { toValue: 1.14, duration: 150, useNativeDriver: true }),
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, friction: 4, tension: 60 }),
    ]).start();
  }, [frame]);

  const dimensiones = { width: size, height: size, borderRadius: size / 2 };

  if (avatarGenero === "masculino") {
    return (
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <View style={[styles.container, styles.iconFallback, dimensiones]}>
          <MaterialCommunityIcons name="robot" size={size * 0.55} color={COLORS.white} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <View style={[styles.container, dimensiones]}>
        <Image source={IMAGENES_FEMENINO[frame]} style={dimensiones} resizeMode="cover" />
      </View>
    </Animated.View>
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
