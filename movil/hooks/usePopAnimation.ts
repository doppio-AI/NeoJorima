import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated } from "react-native";

/*
 * Hook de "pop" reutilizable (jorima-estilo-duolingo.md, bloque 8):
 * el mismo patrón que ya vivía a mano dentro de JorimaAvatar —
 * escala a 1.14 y luego un spring de vuelta a 1 — pero disponible
 * para cualquier componente (tarjetas al seleccionarse, el contador
 * de tareas, etc.), así que móvil entero comparte la misma curva.
 *
 * dispara(): dispara el pop una vez. trigger (segundo valor
 * devuelto): pásalo como dependencia si quieres que el pop se
 * dispare automáticamente cada vez que cambie (ver JorimaAvatar).
 *
 * Respeta reduce-motion: si está activo, no anima — el valor
 * simplemente se queda en 1.
 */
export function usePopAnimation() {
  const escala = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      reduceMotion.current = valor;
    });
  }, []);

  const dispara = () => {
    if (reduceMotion.current) return;

    Animated.sequence([
      Animated.timing(escala, { toValue: 1.14, duration: 150, useNativeDriver: true }),
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, friction: 4, tension: 60 }),
    ]).start();
  };

  return { escala, dispara };
}
