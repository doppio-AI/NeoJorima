import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { COLORS, SIZES, FONTS } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import ThemedInput from "@/components/ThemedInput";
import PressableCard from "@/components/PressableCard";
import JorimaAvatar, { JorimaMood } from "@/components/JorimaAvatar";

/*
 * Vitrina de componentes (jorima-estilo-duolingo.md, bloque 5).
 * Referencia real del sistema: un solo `expo start` y esta pantalla
 * bastan para juzgar si el estilo es coherente, sin navegar toda
 * la app. Enlace de acceso solo en __DEV__ desde Mi Perfil.
 */

const PALETA: Array<{ nombre: string; hex: string }> = [
  { nombre: "primary", hex: COLORS.primary },
  { nombre: "primaryShadow", hex: COLORS.primaryShadow },
  { nombre: "secondary", hex: COLORS.secondary },
  { nombre: "secondaryShadow", hex: COLORS.secondaryShadow },
  { nombre: "sol", hex: COLORS.sol },
  { nombre: "solShadow", hex: COLORS.solShadow },
  { nombre: "lavanda", hex: COLORS.lavanda },
  { nombre: "lavandaShadow", hex: COLORS.lavandaShadow },
  { nombre: "coral", hex: COLORS.coral },
  { nombre: "coralShadow", hex: COLORS.coralShadow },
  { nombre: "success", hex: COLORS.success },
  { nombre: "warning", hex: COLORS.warning },
  { nombre: "error", hex: COLORS.error },
  { nombre: "background", hex: COLORS.background },
  { nombre: "surface", hex: COLORS.surface },
  { nombre: "border", hex: COLORS.border },
  { nombre: "borderStrong", hex: COLORS.borderStrong },
  { nombre: "text", hex: COLORS.text },
  { nombre: "textSecondary", hex: COLORS.textSecondary },
];

// "button" no es una variante de ThemedText (solo la usa ThemedButton),
// así que aquí se muestran las 7 aplicando el estilo de FONTS directo.
const TIPOGRAFIA: Array<{ nombre: string; style: object; etiqueta: string }> = [
  { nombre: "h1", style: FONTS.h1, etiqueta: "h1 — Nunito 800, 30/36" },
  { nombre: "h2", style: FONTS.h2, etiqueta: "h2 — Nunito 800, 24/30" },
  { nombre: "h3", style: FONTS.h3, etiqueta: "h3 — Nunito 700, 19/25" },
  { nombre: "body", style: FONTS.body, etiqueta: "body — Nunito 600, 16/24" },
  { nombre: "bodySmall", style: FONTS.bodySmall, etiqueta: "bodySmall — Nunito 600, 14/21" },
  { nombre: "button", style: FONTS.button, etiqueta: "button — Nunito 800, 16/20" },
  { nombre: "caption", style: FONTS.caption, etiqueta: "caption — Nunito 700, 12/16" },
];

const MOODS: JorimaMood[] = ["sereno1", "sereno2", "sonrisa_amplia", "preocupacion", "tristeza"];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.seccion}>
      <ThemedText variant="h2" color={COLORS.primary} style={styles.seccionTitulo}>
        {titulo}
      </ThemedText>
      {children}
    </View>
  );
}

export default function DesignSystemScreen() {
  const [texto, setTexto] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText variant="h1">Jorima</ThemedText>
        <ThemedText variant="body" color={COLORS.textSecondary}>
          Vitrina de componentes — referencia visual del sistema.
        </ThemedText>

        <Seccion titulo="Paleta">
          <View style={styles.paletaGrid}>
            {PALETA.map((c) => (
              <View key={c.nombre} style={styles.swatchItem}>
                <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                <ThemedText variant="caption">{c.nombre}</ThemedText>
                <ThemedText variant="caption" color={COLORS.textSecondary}>
                  {c.hex}
                </ThemedText>
              </View>
            ))}
          </View>
        </Seccion>

        <Seccion titulo="Tipografía">
          <View style={{ gap: 10 }}>
            {TIPOGRAFIA.map((t) => (
              <View key={t.nombre}>
                <ThemedText style={t.style}>Jorima escucha</ThemedText>
                <ThemedText variant="caption" color={COLORS.textSecondary}>
                  {t.etiqueta}
                </ThemedText>
              </View>
            ))}
          </View>
        </Seccion>

        <Seccion titulo="Botones">
          <View style={{ gap: 12 }}>
            <ThemedButton title="Primario" />
            <ThemedButton title="Secundario" variant="secondary" />
            <ThemedButton title="Outline" variant="outline" />
            <ThemedButton title="Lavanda" variant="lavanda" />
            <ThemedButton title="Cargando..." loading />
            <ThemedButton title="Deshabilitado" disabled />
          </View>
        </Seccion>

        <Seccion titulo="Inputs">
          <View style={{ gap: 12 }}>
            <ThemedInput placeholder="Vacío" />
            <ThemedInput placeholder="Con texto" value={texto} onChangeText={setTexto} />
            <ThemedInput placeholder="Tócame para ver el foco" />
          </View>
        </Seccion>

        <Seccion titulo="Tarjetas">
          <View style={{ gap: 12 }}>
            <View style={styles.tarjetaEstatica}>
              <ThemedText variant="h3">Tarjeta estática</ThemedText>
              <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                Borde 2px, border-bottom 4px, radio grande. No reacciona al tacto.
              </ThemedText>
            </View>

            <PressableCard onPress={() => {}}>
              <ThemedText variant="h3">Tarjeta presionable</ThemedText>
              <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                Tócame: el borde inferior desaparece y bajo 4px, igual que un botón.
              </ThemedText>
            </PressableCard>
          </View>
        </Seccion>

        <Seccion titulo="Chips">
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <ThemedText variant="caption" color={COLORS.primary}>
                Bienestar emocional
              </ThemedText>
            </View>
            <View style={styles.chip}>
              <ThemedText variant="caption" color={COLORS.primary}>
                Relajación
              </ThemedText>
            </View>
          </View>
        </Seccion>

        <Seccion titulo="Mascota">
          <View style={styles.avatarRow}>
            {MOODS.map((mood) => (
              <View key={mood} style={styles.avatarItem}>
                <JorimaAvatar mood={mood} size={64} />
                <ThemedText variant="caption" color={COLORS.textSecondary}>
                  {mood}
                </ThemedText>
              </View>
            ))}
            <View style={styles.avatarItem}>
              <JorimaAvatar mood="sereno1" talking size={64} />
              <ThemedText variant="caption" color={COLORS.textSecondary}>
                talking
              </ThemedText>
            </View>
          </View>
        </Seccion>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 48, gap: 4 },

  seccion: { marginTop: 28 },
  seccionTitulo: { marginBottom: 14 },

  paletaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  swatchItem: { width: 96, gap: 2 },
  swatch: {
    width: 96,
    height: 56,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 4,
  },

  tarjetaEstatica: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.borderStrong,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    gap: 6,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    backgroundColor: "rgba(15, 76, 129, 0.1)",
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  avatarRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  avatarItem: { alignItems: "center", gap: 6, width: 72 },
});
