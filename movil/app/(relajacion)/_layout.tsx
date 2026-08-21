import { Stack } from "expo-router";

export default function RelajacionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="respiracion" />
      <Stack.Screen name="estiramiento" />
      <Stack.Screen name="burbujas" />
      <Stack.Screen name="memorama" />
    </Stack>
  );
}
