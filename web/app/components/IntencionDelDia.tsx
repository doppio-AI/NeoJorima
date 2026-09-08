"use client";

/* ─────────────────────────────────────────────────
   "Buenos días, Jorima" — pieza visual.

   Muestra de vuelta, el resto del día, la intención
   de una línea que la persona escribió en su check-in
   matutino. No es una tarea que se marca como
   completada ni una meta que se mide — es solo un
   recordatorio suave de lo que la persona misma se
   propuso. Ver la idea completa en el documento
   "Enganche Sano".
   ───────────────────────────────────────────────── */

interface Props {
  texto: string;
  compacta?: boolean;
}

export default function IntencionDelDia({ texto, compacta = false }: Props) {
  if (!texto) return null;

  return (
    <div
      title="Tu intención para hoy"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        maxWidth: 280,
        background: "var(--neutral-100)",
        border: "1px solid var(--neutral-200)",
        borderRadius: 999,
        padding: compacta ? "5px 12px" : "7px 16px",
        cursor: "default",
      }}
    >
      <span aria-hidden style={{ fontSize: compacta ? 14 : 16 }}>
        🎯
      </span>
      <span
        style={{
          fontSize: compacta ? 12.5 : 13.5,
          color: "var(--neutral-600)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {texto}
      </span>
    </div>
  );
}
