"use client";

/* ─────────────────────────────────────────────────
   Racha con raíz — pieza visual.

   A propósito NO usa una flama: la flama es el ícono
   que asociamos con rachas que se rompen y generan
   ansiedad. Usamos un brote 🌱 porque la métafora es
   "algo que crece contigo", no "algo que puedes perder
   de golpe". Ver la lógica en lib/racha.ts.

   Si racha_actual es 0 no se muestra nada: no hay que
   presionar a nadie a "empezar su racha".
   ───────────────────────────────────────────────── */

interface Props {
  rachaActual: number;
  rachaRaiz: number;
  compacta?: boolean;
}

export default function RachaBienestar({ rachaActual, rachaRaiz, compacta = false }: Props) {
  if (rachaActual <= 0) return null;

  const dias = rachaActual === 1 ? "día" : "días";

  const tooltip =
    rachaRaiz > 0
      ? `Tienes ${rachaRaiz} día${rachaRaiz === 1 ? "" : "s"} asegurados para siempre. Aunque falte un día, tu racha no vuelve a cero.`
      : "Cada semana seguida asegura la mitad de tu racha para siempre. Nunca vuelve a cero.";

  return (
    <div
      title={tooltip}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "var(--neutral-100)",
        border: "1px solid var(--neutral-200)",
        borderRadius: 999,
        padding: compacta ? "5px 12px" : "7px 16px",
        cursor: "default",
      }}
    >
      <span aria-hidden style={{ fontSize: compacta ? 14 : 16 }}>
        🌱
      </span>
      <span style={{ fontSize: compacta ? 12.5 : 13.5, color: "var(--neutral-600)" }}>
        <strong style={{ color: "#0F4C81" }}>{rachaActual}</strong> {dias} cuidándote
      </span>
    </div>
  );
}
