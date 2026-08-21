import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import MensajeMotivadorFinal from "@/components/MensajeMotivadorFinal";

const SIMBOLOS = ["🌊", "🌿", "☀️", "🌙", "🍃", "🌸"];

type Carta = { id: number; simbolo: string; volteada: boolean; encontrada: boolean };

function crearMazo(): Carta[] {
  return [...SIMBOLOS, ...SIMBOLOS]
    .map((simbolo) => ({ simbolo, orden: Math.random() }))
    .sort((a, b) => a.orden - b.orden)
    .map((item, i) => ({ id: i, simbolo: item.simbolo, volteada: false, encontrada: false }));
}

export default function MemoramaScreen() {
  const [cartas, setCartas] = useState<Carta[]>(() => crearMazo());
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const inicio = useRef(Date.now());

  const encontradas = cartas.filter((c) => c.encontrada).length;

  useEffect(() => {
    if (encontradas === cartas.length) {
      setTerminado(true);
    }
  }, [encontradas, cartas.length]);

  const voltear = (id: number) => {
    if (bloqueado) return;
    const carta = cartas.find((c) => c.id === id);
    if (!carta || carta.volteada || carta.encontrada) return;

    const nuevaSeleccion = [...seleccion, id];
    setCartas((prev) => prev.map((c) => (c.id === id ? { ...c, volteada: true } : c)));
    setSeleccion(nuevaSeleccion);

    if (nuevaSeleccion.length === 2) {
      setBloqueado(true);
      const [aId, bId] = nuevaSeleccion;
      const a = cartas.find((c) => c.id === aId)!;
      const b = cartas.find((c) => c.id === bId)!;

      setTimeout(() => {
        const esPar = a.simbolo === b.simbolo;

        void Haptics.notificationAsync(
          esPar ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
        );

        setCartas((prev) =>
          prev.map((c) => {
            if (c.id === aId || c.id === bId) {
              if (esPar) {
                return { ...c, encontrada: true, volteada: true };
              }
              return { ...c, volteada: false };
            }
            return c;
          })
        );
        setSeleccion([]);
        setBloqueado(false);
      }, 700);
    }
  };

  if (terminado) {
    const duracionSeg = (Date.now() - inicio.current) / 1000;
    return <MensajeMotivadorFinal tipo="juego" duracionSeg={duracionSeg} completada />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Feather name="x" size={22} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <ThemedText variant="h2" color={COLORS.primary}>
          Memorama rápido
        </ThemedText>
        <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
          {encontradas / 2}/{SIMBOLOS.length} pares
        </ThemedText>
      </View>

      <View style={styles.grid}>
        {cartas.map((carta) => (
          <TouchableOpacity
            key={carta.id}
            style={[styles.carta, (carta.volteada || carta.encontrada) && styles.cartaVolteada]}
            onPress={() => voltear(carta.id)}
            activeOpacity={0.85}
          >
            <ThemedText variant="h2">
              {carta.volteada || carta.encontrada ? carta.simbolo : ""}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  closeButton: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  header: { alignItems: "center", marginTop: 40, marginBottom: 24, gap: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 },
  carta: {
    width: 70,
    height: 70,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  cartaVolteada: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
