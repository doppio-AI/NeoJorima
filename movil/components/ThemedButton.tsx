import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  PressableProps,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SIZES, FONTS } from "@/constants/theme";

/*
 * Botón "chunky" (jorima-estilo-duolingo.md, bloque 3): borde
 * inferior sólido de 4px que desaparece al presionar, moviendo el
 * botón hacia abajo. No es una sombra, es un borde — por eso el
 * contenedor externo reserva la altura completa (56 + DEPTH):
 * si no, el layout brinca cuando el botón se hunde.
 */

type Variant = "primary" | "secondary" | "outline" | "lavanda";

interface ThemedButtonProps extends PressableProps {
  title: string;
  variant?: Variant;
  loading?: boolean;
  // Angosta el tipo heredado de PressableProps (que también admite una
  // función de estado): este componente solo lo reenvía a un arreglo de
  // estilos estático, nunca a la forma de callback.
  style?: StyleProp<ViewStyle>;
}

const DEPTH = 4;
const HEIGHT = 56;

const PALETAS: Record<Variant, { bg: string; shadow: string; text: string; border?: string }> = {
  primary: { bg: COLORS.primary, shadow: COLORS.primaryShadow, text: COLORS.white },
  secondary: { bg: COLORS.secondary, shadow: COLORS.secondaryShadow, text: COLORS.white },
  lavanda: { bg: COLORS.lavanda, shadow: COLORS.lavandaShadow, text: COLORS.white },
  outline: { bg: COLORS.white, shadow: COLORS.borderStrong, text: COLORS.primary, border: COLORS.border },
};

export default function ThemedButton({
  title,
  variant = "primary",
  loading = false,
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: ThemedButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;
  const paleta = PALETAS[variant];

  const handlePressIn = (e: GestureResponderEvent) => {
    setPressed(true);
    if (!isDisabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    setPressed(false);
    onPressOut?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[styles.wrapper, style]}
      {...rest}
    >
      <View
        style={[
          styles.base,
          {
            backgroundColor: isDisabled ? COLORS.border : paleta.bg,
            borderWidth: variant === "outline" ? 2 : 0,
            borderColor: paleta.border,
            borderBottomWidth: isDisabled || pressed ? 0 : DEPTH,
            borderBottomColor: paleta.shadow,
            marginTop: !isDisabled && pressed ? DEPTH : 0,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isDisabled ? "#9AA6AE" : paleta.text} />
        ) : (
          <Text style={[styles.text, { color: isDisabled ? "#9AA6AE" : paleta.text }]}>
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: HEIGHT + DEPTH,
    justifyContent: "flex-start",
  },
  base: {
    height: HEIGHT,
    borderRadius: SIZES.radius,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.large,
  },
  text: {
    ...FONTS.button,
    letterSpacing: 0.5,
  },
});
