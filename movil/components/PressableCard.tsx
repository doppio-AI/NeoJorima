import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  PressableProps,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from "react-native";
import { COLORS, SIZES } from "@/constants/theme";

/*
 * Tarjeta presionable (jorima-estilo-duolingo.md, bloque 4): misma
 * anatomía que ThemedButton — borde inferior de 4px que desaparece
 * y la tarjeta baja al presionar. El wrapper reserva el espacio
 * abajo (paddingBottom: DEPTH) en vez de una altura fija, porque
 * a diferencia de un botón el contenido de una tarjeta es variable.
 */

const DEPTH = 4;

interface Props extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  // Color del borde inferior (la "profundidad"). Por defecto es neutro;
  // el catálogo de relajación, por ejemplo, lo pinta de lavanda.
  acento?: string;
}

export default function PressableCard({ children, style, acento, onPressIn, onPressOut, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);

  const handlePressIn = (e: GestureResponderEvent) => {
    setPressed(true);
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    setPressed(false);
    onPressOut?.(e);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.wrapper} {...rest}>
      <View
        style={[
          styles.card,
          {
            borderBottomWidth: pressed ? 0 : DEPTH,
            borderBottomColor: acento ?? COLORS.borderStrong,
            marginTop: pressed ? DEPTH : 0,
          },
          style,
        ]}
      >
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: DEPTH,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderBottomColor: COLORS.borderStrong,
    borderRadius: SIZES.radiusLg,
    padding: 20,
  },
});
