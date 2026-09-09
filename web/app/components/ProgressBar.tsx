"use client";

/*
 * Barra de progreso "física" (jorima-estilo-duolingo.md, bloque 7):
 * gruesa, extremos redondeados, con un brillo interior en el tercio
 * superior de la porción llena. La transición de ancho es CSS puro
 * (400ms ease-out) y se apaga sola con prefers-reduced-motion.
 */

interface Props {
  value: number; // 0–1
  color?: string;
  label?: string;
}

export default function ProgressBar({ value, color = "var(--c-secondary)", label }: Props) {
  const acotado = Math.max(0, Math.min(1, value));

  return (
    <div style={{ width: "100%" }}>
      {label && (
        <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--neutral-500)" }}>{label}</p>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(acotado * 100)}
        style={{
          width: "100%",
          height: 16,
          borderRadius: 999,
          background: "var(--c-border)",
          overflow: "hidden",
        }}
      >
        <div
          className="jorima-progress-fill"
          style={{
            position: "relative",
            height: "100%",
            width: `${acotado * 100}%`,
            background: color,
            borderRadius: 999,
            transition: "width 400ms ease-out",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "34%",
              background: "rgba(255,255,255,0.3)",
            }}
          />
        </div>
      </div>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .jorima-progress-fill { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
