"use client";

/* ─────────────────────────────────────────────────
   Compañero que crece contigo (idea #4 de "Enganche Sano").

   Un elemento visual que crece con cada check-in de ánimo,
   inspirado en Finch: nunca se marchita ni retrocede de etapa
   por faltar un día — a propósito usa el conteo histórico total
   de check-ins (dias_totales), no la racha, así que solo puede
   subir. Elimina la culpa como motor: no hay nada que "cuidar"
   para que no se muera, solo algo que sigue creciendo cuando
   vuelves.
   ───────────────────────────────────────────────── */

type Etapa = {
  minDias: number;
  emoji: string;
  nombre: string;
};

const ETAPAS: Etapa[] = [
  { minDias: 0, emoji: "🌰", nombre: "Semilla" },
  { minDias: 1, emoji: "🌱", nombre: "Brote" },
  { minDias: 3, emoji: "🌿", nombre: "Planta joven" },
  { minDias: 7, emoji: "🪴", nombre: "En su maceta" },
  { minDias: 14, emoji: "🌳", nombre: "Arbolito" },
  { minDias: 30, emoji: "🌳🌸", nombre: "Floreciendo" },
];

function etapaActual(diasTotales: number): { etapa: Etapa; indice: number } {
  let indice = 0;
  for (let i = 0; i < ETAPAS.length; i++) {
    if (diasTotales >= ETAPAS[i].minDias) indice = i;
  }
  return { etapa: ETAPAS[indice], indice };
}

export default function CompaneroCrecimiento({ diasTotales }: { diasTotales: number }) {
  const { etapa, indice } = etapaActual(diasTotales);
  const siguiente = ETAPAS[indice + 1];

  return (
    <div
      title={`${etapa.nombre} — ${diasTotales} ${diasTotales === 1 ? "día" : "días"} cuidándote en total`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 44, lineHeight: 1 }}>{etapa.emoji}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#12201F" }}>{etapa.nombre}</div>
      <div style={{ fontSize: 11.5, color: "var(--neutral-500)" }}>
        {siguiente
          ? `${siguiente.minDias - diasTotales} ${siguiente.minDias - diasTotales === 1 ? "día" : "días"} para crecer más`
          : "Creciendo contigo"}
      </div>
    </div>
  );
}
