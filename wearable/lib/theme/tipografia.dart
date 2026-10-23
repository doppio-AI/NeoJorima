import 'package:flutter/material.dart';

/// Tipografía del proyecto: **Nunito**, con pesos 400 a 800.
///
/// Regla de la Práctica 1 que se aplica aquí: en el reloj la tipografía es
/// grande y el texto de lectura va de 12 a 15 px; las cifras (racha, días)
/// van mucho más grandes que cualquier otro elemento de su pantalla.
class JorimaTexto {
  JorimaTexto._();

  static const String familia = 'Nunito';

  /// Cifra protagonista (días de racha).
  static const double cifra = 46;

  /// Título de pantalla.
  static const double titulo = 17;

  /// Texto de chat y de lectura principal (dentro del rango 12–15 del PDF).
  static const double chat = 14;

  static const double cuerpo = 13.5;
  static const double pequeno = 12;
  static const double micro = 11;

  static const FontWeight normal = FontWeight.w400;
  static const FontWeight seminegrita = FontWeight.w600;
  static const FontWeight negrita = FontWeight.w700;
  static const FontWeight extraNegrita = FontWeight.w800;

  /// Hoja de estilos base del reloj.
  ///
  /// `height` ajustado porque Nunito tiene métricas altas y en 200 px de ancho
  /// un interlineado de 1.5 desperdicia renglones.
  static TextTheme construir(Color texto, Color textoSecundario) {
    TextStyle base(double tamano, FontWeight peso, {Color? color}) => TextStyle(
      fontFamily: familia,
      fontSize: tamano,
      fontWeight: peso,
      height: 1.22,
      leadingDistribution: TextLeadingDistribution.even,
      color: color,
    );

    return TextTheme(
      displayLarge: base(cifra, extraNegrita, color: texto),
      headlineMedium: base(titulo, extraNegrita, color: texto),
      titleMedium: base(15, negrita, color: texto),
      bodyLarge: base(chat, normal, color: texto),
      bodyMedium: base(cuerpo, normal, color: texto),
      bodySmall: base(pequeno, seminegrita, color: textoSecundario),
      labelLarge: base(chat, extraNegrita, color: texto),
      labelSmall: base(micro, negrita, color: textoSecundario),
    );
  }
}
