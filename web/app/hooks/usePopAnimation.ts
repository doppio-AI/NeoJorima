"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Equivalente web del hook de "pop" de móvil (usePopAnimation.ts en
 * movil/hooks): misma curva (escala a 1.14, luego un resorte de
 * vuelta a 1), pero implementada con CSS — jorima-estilo-duolingo.md,
 * bloque 8. dispara() hace lo mismo que en móvil: dispara el pop
 * una vez. Respeta prefers-reduced-motion.
 */
export function usePopAnimation() {
  const [activo, setActivo] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const dispara = () => {
    if (reduceMotion.current) return;

    setActivo(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActivo(false), 150);
  };

  const style: React.CSSProperties = {
    transform: activo ? "scale(1.14)" : "scale(1)",
    transition: activo
      ? "transform 150ms ease-out"
      : "transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  };

  return { style, dispara };
}
