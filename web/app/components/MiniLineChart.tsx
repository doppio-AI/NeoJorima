"use client";

type Punto = { fecha: string; promedio: number };

interface Props {
  datos: Punto[];
  height?: number;
}

export default function MiniLineChart({ datos, height = 160 }: Props) {
  if (datos.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--neutral-400)" }}>
        Sin datos suficientes todavía
      </div>
    );
  }

  const width = 600;
  const padding = 24;
  const maxY = 100;

  const puntos = datos.map((d, i) => {
    const x = datos.length === 1 ? width / 2 : padding + (i / (datos.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.promedio / maxY) * (height - padding * 2);
    return { x, y, ...d };
  });

  const path = puntos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const colorLinea = "#0F4C81";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      {/* líneas guía de referencia */}
      {[0, 33, 66, 100].map((nivel) => {
        const y = height - padding - (nivel / maxY) * (height - padding * 2);
        return (
          <line
            key={nivel}
            x1={padding}
            x2={width - padding}
            y1={y}
            y2={y}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        );
      })}

      <path d={path} fill="none" stroke={colorLinea} strokeWidth={2.5} />

      {puntos.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={colorLinea} />
      ))}
    </svg>
  );
}
