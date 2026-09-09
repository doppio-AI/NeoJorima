/*
 * Estilo "Duolingo" (jorima-estilo-duolingo.md, bloque 2): una sola
 * familia (Nunito) para todo, geométrica y de terminaciones
 * redondeadas. Incluso el cuerpo de texto va en semibold — es
 * intencional, no un descuido.
 *
 * Las fuentes se cargan con useFonts en app/_layout.tsx; ver ahí
 * los nombres exactos de @expo-google-fonts/nunito.
 */
const Typography = {
  h1: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: "Nunito_800ExtraBold",
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: "Nunito_800ExtraBold",
  },
  h3: {
    fontSize: 19,
    lineHeight: 25,
    fontFamily: "Nunito_700Bold",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Nunito_600SemiBold",
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Nunito_600SemiBold",
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: "Nunito_800ExtraBold",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Nunito_700Bold",
  },
};

export default Typography;
