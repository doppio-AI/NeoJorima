import { BottomTabBarButtonProps } from "expo-router/js-tabs";
import { PlatformPressable } from "expo-router/react-navigation";
import * as Haptics from "expo-haptics";

/*
 * jorima-estilo-duolingo.md, bloque 6: un pequeño toque háptico de
 * "selección" al cambiar de pestaña, en ambas plataformas (el
 * scaffold original de Expo solo lo hacía en iOS con un impacto
 * genérico; selectionAsync() es el tipo pensado justo para esto —
 * elegir entre opciones de un mismo grupo, como un tab bar).
 */
export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        void Haptics.selectionAsync();
        props.onPressIn?.(ev);
      }}
    />
  );
}
