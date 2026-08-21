import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity, Linking } from "react-native";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import JorimaAvatar from "@/components/JorimaAvatar";

interface Props {
  visible: boolean;
  onClose: () => void;
  tipoCuenta: "personal" | "empresa";
  nivel: "alto" | "crisis";
  avatarGenero?: "femenino" | "masculino";
}

/*
 * Línea de la Vida — 800 911 2000. Verificada en gob.mx/conasama:
 * gratuita, nacional, 24/7, especializada en salud mental.
 * No cambiar este número sin volver a verificarlo en una fuente oficial.
 */
const LINEA_DE_LA_VIDA = "8009112000";
const LINEA_DE_LA_VIDA_DISPLAY = "800 911 2000";

export default function AlertaRiesgoModal({
  visible,
  onClose,
  tipoCuenta,
  nivel,
  avatarGenero = "femenino",
}: Props) {
  const esCrisis = nivel === "crisis";

  const llamarLineaDeLaVida = () => {
    Linking.openURL(`tel:${LINEA_DE_LA_VIDA}`).catch(() => {});
  };

  const llamarEmergencias = () => {
    Linking.openURL("tel:911").catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <JorimaAvatar mood="preocupacion" avatarGenero={avatarGenero} size={84} />

          <ThemedText variant="h3" style={{ textAlign: "center" }}>
            Notamos algo en lo que dijiste
          </ThemedText>

          {tipoCuenta === "empresa" ? (
            <ThemedText
              variant="body"
              color={COLORS.textSecondary}
              style={{ textAlign: "center" }}
            >
              Por lo que compartiste, se notificó a un administrador de tu institución para
              que pueda ofrecerte apoyo. Mientras tanto, aquí tienes ayuda inmediata si la
              necesitas:
            </ThemedText>
          ) : (
            <ThemedText
              variant="body"
              color={COLORS.textSecondary}
              style={{ textAlign: "center" }}
            >
              Por lo que compartiste, podrías estar pasando por un momento muy difícil. No
              estás solo/a — hablar con alguien capacitado puede ayudar mucho ahora mismo.
            </ThemedText>
          )}

          {esCrisis && (
            <View style={styles.emergenciaBox}>
              <ThemedText
                variant="bodySmall"
                color={COLORS.error ?? "#D14343"}
                style={{ textAlign: "center" }}
              >
                Si estás en peligro inmediato, llama al 911.
              </ThemedText>
            </View>
          )}

          <View style={styles.recursoBox}>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Línea de la Vida — gratuita, 24/7
            </ThemedText>
            <ThemedText variant="h3" color={COLORS.primary}>
              {LINEA_DE_LA_VIDA_DISPLAY}
            </ThemedText>
          </View>

          <ThemedButton title="Llamar a Línea de la Vida" onPress={llamarLineaDeLaVida} />

          {esCrisis && (
            <TouchableOpacity onPress={llamarEmergencias} style={{ marginTop: 2 }}>
              <ThemedText color={COLORS.error ?? "#D14343"}>Llamar al 911</ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClose} style={{ marginTop: 8 }}>
            <ThemedText color={COLORS.textSecondary}>Entendido, seguir platicando</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 24,
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  emergenciaBox: {
    backgroundColor: "#FDECEC",
    borderRadius: SIZES.radius,
    padding: 10,
    width: "100%",
  },
  recursoBox: { alignItems: "center", gap: 2 },
});
