import { Stack } from "expo-router";
import { OnboardingProvider } from "@/context/OnboardingContext";

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="avatar" />
        <Stack.Screen name="tipo-cuenta" />
        <Stack.Screen name="empresa" />
        <Stack.Screen name="carga" />
        <Stack.Screen name="dependientes" />
        <Stack.Screen name="resumen" />
      </Stack>
    </OnboardingProvider>
  );
}
