import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { COLORS } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import { HapticTab } from "@/components/haptic-tab";

/*
 * Tab bar estilo "Duolingo" (jorima-estilo-duolingo.md, bloque 6):
 * la pestaña activa lleva una pastilla de fondo y el ícono se
 * rellena — la diferencia no depende solo del color (accesibilidad:
 * hay forma, no solo tinte). tabBarShowLabel se apaga porque la
 * etiqueta se dibuja adentro de la pastilla, junto al ícono, en vez
 * de como una fila aparte debajo.
 */

type ParIconos = {
  outline: keyof typeof MaterialCommunityIcons.glyphMap;
  filled: keyof typeof MaterialCommunityIcons.glyphMap;
};

function TabIcono({ focused, iconos, label }: { focused: boolean; iconos: ParIconos; label: string }) {
  return (
    <View style={[styles.pill, focused && styles.pillActiva]}>
      <MaterialCommunityIcons
        name={focused ? iconos.filled : iconos.outline}
        size={22}
        color={focused ? COLORS.secondary : COLORS.textSecondary}
      />
      {focused && (
        <ThemedText variant="caption" color={COLORS.secondary} style={styles.label}>
          {label}
        </ThemedText>
      )}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 2,
          borderTopColor: COLORS.border,
          height: 76,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <TabIcono focused={focused} iconos={{ outline: "home-outline", filled: "home" }} label="Inicio" />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: "Historial",
          tabBarIcon: ({ focused }) => (
            <TabIcono focused={focused} iconos={{ outline: "clock-outline", filled: "clock" }} label="Historial" />
          ),
        }}
      />
      <Tabs.Screen
        name="recursos"
        options={{
          title: "Recursos",
          tabBarIcon: ({ focused }) => (
            <TabIcono
              focused={focused}
              iconos={{ outline: "book-open-outline", filled: "book-open" }}
              label="Recursos"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <TabIcono focused={focused} iconos={{ outline: "account-outline", filled: "account" }} label="Perfil" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillActiva: {
    backgroundColor: "rgba(42, 157, 143, 0.12)",
  },
  label: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
  },
});
