import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/config/api";

/**
 * fetch con el header Authorization: Bearer <token> ya puesto,
 * leyendo el token guardado en AsyncStorage por login/register.
 * Mismo patrón que authHeaders() en app/(tabs)/home.tsx.
 */
export async function authFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("session_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(`${API_URL}${path}`, { ...options, headers });
}
