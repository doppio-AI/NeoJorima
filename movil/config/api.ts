const LOCAL_IP = "10.13.27.95";
const VERCEL_URL = "https://jorima-eight.vercel.app";

/*
 * IMPORTANTE: __DEV__ es true siempre que corres con Expo Go / expo start,
 * sin importar a qué backend quieras apuntar — NO sirve para alternar
 * entre local y Vercel durante una demo en vivo (solo distingue un build
 * de producción real de EAS).
 *
 * Para el Innovafest, cambia esto a mano según lo que necesites en el
 * momento:
 *   true  -> usa Vercel (el backend en línea, para que cualquiera
 *            conectado a internet pueda probar la app, no solo tu WiFi)
 *   false -> usa tu servidor local (npm run dev en tu compu)
 */
const USAR_VERCEL = true;

export const API_URL = USAR_VERCEL ? VERCEL_URL : `http://${LOCAL_IP}:3000`;