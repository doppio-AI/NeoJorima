"use client";

/* ─────────────────────────────────────────────────
   Mapa de energía (idea #3 de "Enganche Sano").

   Un calendario visual tipo Apple Health / Oura: cada día
   pinta un color según el ánimo que la persona registró ese
   día. La idea no es que Jorima le diga a la persona cómo
   estuvo su mes — es que la persona misma vuelva a mirar su
   propio pasado y note sus propios patrones. Los días sin
   registro quedan en gris, no en rojo: faltar un día no es
   una falla que haya que señalar.
   ───────────────────────────────────────────────── */

type Registro = { fecha: string; estado: string };

const COLOR_POR_ESTADO: Record<string, string> = {
  "muy mal": "#DC2626",
  mal: "#F59E0B",
  regular: "#FDE68A",
  bien: "#86EFAC",
  "muy bien": "#16A34A",
};

const SIN_REGISTRO = "var(--neutral-150, #E5E7EB)";
const SEMANAS = 17;

function aClaveDia(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function construirSemanas(): Date[][] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Retroceder hasta el domingo de la semana más antigua a mostrar.
  const inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - (SEMANAS * 7 - 1));
  inicio.setDate(inicio.getDate() - inicio.getDay());

  const semanas: Date[][] = [];
  const cursor = new Date(inicio);

  for (let s = 0; s < SEMANAS; s++) {
    const semana: Date[] = [];
    for (let d = 0; d < 7; d++) {
      semana.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(semana);
  }

  return semanas;
}

export default function MapaEnergia({ registros }: { registros: Registro[] }) {
  const porDia = new Map<string, string>();
  for (const r of registros) {
    porDia.set(aClaveDia(new Date(r.fecha)), r.estado);
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const semanas = construirSemanas();

  return (
    <div>
      <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
        {semanas.map((semana, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {semana.map((dia) => {
              const clave = aClaveDia(dia);
              const esFuturo = dia > hoy;
              const estado = porDia.get(clave);
              const color = esFuturo ? "transparent" : estado ? COLOR_POR_ESTADO[estado] ?? SIN_REGISTRO : SIN_REGISTRO;

              const etiqueta = dia.toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={clave}
                  title={esFuturo ? undefined : `${etiqueta}${estado ? ` — ${estado}` : " — sin registro"}`}
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: 3,
                    background: color,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14, fontSize: 12, color: "var(--neutral-500)" }}>
        {Object.entries(COLOR_POR_ESTADO).map(([estado, color]) => (
          <div key={estado} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: color, display: "inline-block" }} />
            {estado}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: SIN_REGISTRO, display: "inline-block" }} />
          sin registro
        </div>
      </div>
    </div>
  );
}
