import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";

import ThemedText from "@/components/ThemedText";
import { COLORS } from "@/constants/theme";
import type { RegistroAnimo } from "@/lib/animo";

/* ─────────────────────────────────────────────────
   Mapa de energía (idea #3 de "Enganche Sano").

   Calendario visual tipo Apple Health / Oura: cada día pinta
   un color según el ánimo registrado ese día. Los días sin
   registro quedan en gris, no en rojo — faltar un día no es
   una falla que haya que señalar.
   ───────────────────────────────────────────────── */

const COLOR_POR_ESTADO: Record<string, string> = {
  "muy mal": "#DC2626",
  mal: "#F59E0B",
  regular: "#FDE68A",
  bien: "#86EFAC",
  "muy bien": "#16A34A",
};

const SIN_REGISTRO = COLORS.gray200;
const SEMANAS = 12; // menos columnas que en web: pantalla angosta

function aClaveDia(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function construirSemanas(): Date[][] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

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

export default function MapaEnergia({ registros }: { registros: RegistroAnimo[] }) {
  const porDia = new Map<string, string>();
  for (const r of registros) {
    porDia.set(aClaveDia(new Date(r.fecha)), r.estado);
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const semanas = construirSemanas();

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 3 }}>
          {semanas.map((semana, i) => (
            <View key={i} style={{ gap: 3 }}>
              {semana.map((dia) => {
                const clave = aClaveDia(dia);
                const esFuturo = dia > hoy;
                const estado = porDia.get(clave);
                const color = esFuturo
                  ? "transparent"
                  : estado
                  ? COLOR_POR_ESTADO[estado] ?? SIN_REGISTRO
                  : SIN_REGISTRO;

                return <View key={clave} style={[styles.celda, { backgroundColor: color }]} />;
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.leyenda}>
        {Object.entries(COLOR_POR_ESTADO).map(([estado, color]) => (
          <View key={estado} style={styles.leyendaItem}>
            <View style={[styles.leyendaSwatch, { backgroundColor: color }]} />
            <ThemedText variant="caption" color={COLORS.textSecondary}>
              {estado}
            </ThemedText>
          </View>
        ))}
        <View style={styles.leyendaItem}>
          <View style={[styles.leyendaSwatch, { backgroundColor: SIN_REGISTRO }]} />
          <ThemedText variant="caption" color={COLORS.textSecondary}>
            sin registro
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  celda: { width: 13, height: 13, borderRadius: 3 },
  leyenda: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  leyendaSwatch: { width: 10, height: 10, borderRadius: 3 },
});
