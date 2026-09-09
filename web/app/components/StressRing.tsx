"use client";

import { useEffect, useState } from "react";

/*
 * Anillo de nivel de estrés (jorima-estilo-duolingo.md, bloque 7).
 * El color cambia por rango, pero sin lenguaje de fracaso — el
 * texto que lo acompaña siempre lo dice en palabras, nunca un
 * juicio. La mascota va en el centro, pasada como children.
 *
 * Anima con una transición CSS de stroke-dashoffset, arrancando en
 * 0 al montar y moviéndose al valor real un tick después — el
 * truco usual para animar un <svg> al aparecer en React. Respeta
 * prefers-reduced-motion.
 */

export function colorPorNivel(valor: number): string {
  if (valor <= 33) return "#16A34A";
  if (valor <= 66) return "var(--c-sol, #F4A62A)";
  return "var(--c-coral, #E76F51)";
}

interface Props {
  valor: number; // 0–100
  size?: number;
  grosor?: number;
  children?: React.ReactNode;
}

export default function StressRing({ valor, size = 180, grosor = 14, children }: Props) {
  const [animado, setAnimado] = useState(0);
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;

  useEffect(() => {
    const reducido =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reducido) {
      setAnimado(valor);
      return;
    }

    // Arranca en 0 (ya lo está) y en el siguiente frame anima al valor
    // real — si se setea en el mismo tick, no hay transición que ver.
    const id = requestAnimationFrame(() => setAnimado(valor));
    return () => cancelAnimationFrame(id);
  }, [valor]);

  const offset = circunferencia * (1 - Math.max(0, Math.min(100, animado)) / 100);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={radio} stroke="var(--c-border)" strokeWidth={grosor} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          stroke={colorPorNivel(valor)}
          strokeWidth={grosor}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="jorima-ring-fill"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
      <style>{`
        .jorima-ring-fill { transition: stroke-dashoffset 600ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .jorima-ring-fill { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
