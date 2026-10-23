import 'package:flutter/material.dart';

import 'colores.dart';
import 'tipografia.dart';

/// Radios y medidas del sistema, tomados de `globals.css`
/// (`--radius-sm: 12px`, `--radius-md: 16px`, `--radius-lg: 20px`,
/// `--border-w: 2px`).
class JorimaMedidas {
  JorimaMedidas._();

  static const double radioSm = 12;
  static const double radioMd = 16;
  static const double radioLg = 20;

  /// Grosor del borde del sistema (`--border-w`).
  static const double borde = 2;

  /// Cuánto se hunde un botón al presionarlo: 4 px, igual que el
  /// `translateY(4px)` del CSS.
  static const double hundido = 4;

  /// Zona táctil mínima recomendada por la Práctica 1 para el reloj.
  static const double toqueMinimo = 48;
}

/// Tema claro y oscuro de Jorima Wearable.
///
/// El truco visual del proyecto es que **no hay sombras difusas**: cada color
/// de marca tiene un tono más oscuro que se usa como borde inferior sólido o
/// como desplazamiento duro de 4 px. En Flutter eso es `BoxShadow` con
/// `blurRadius: 0` y `offset: (0, 4)`.
class JorimaTema {
  JorimaTema._();

  static ThemeData claro() => _construir(PaletaJorima.claro, Brightness.light);

  static ThemeData oscuro() => _construir(PaletaJorima.oscuro, Brightness.dark);

  static ThemeData _construir(PaletaJorima p, Brightness brillo) {
    final esquema = ColorScheme(
      brightness: brillo,
      primary: p.primario,
      onPrimary: Colors.white,
      secondary: p.secundario,
      onSecondary: Colors.white,
      error: JorimaColores.coral,
      onError: Colors.white,
      surface: p.superficie,
      onSurface: p.texto,
      surfaceContainerHighest: p.superficie,
      onSurfaceVariant: p.textoSecundario,
      outline: p.borde,
      outlineVariant: p.bordeFuerte,
    );

    final textos = JorimaTexto.construir(p.texto, p.textoSecundario);

    return ThemeData(
      useMaterial3: true,
      brightness: brillo,
      fontFamily: JorimaTexto.familia,
      colorScheme: esquema,
      scaffoldBackgroundColor: p.fondo,
      canvasColor: p.fondo,
      textTheme: textos,
      // En el reloj el tap target se agranda a propósito.
      materialTapTargetSize: MaterialTapTargetSize.padded,
      visualDensity: VisualDensity.comfortable,
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: AppBarTheme(
        backgroundColor: p.fondo,
        foregroundColor: p.texto,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: textos.headlineMedium,
      ),
      dividerTheme: DividerThemeData(color: p.borde, thickness: 1, space: 1),
      extensions: <ThemeExtension<dynamic>>[p],
    );
  }

  /// Sombra sólida del sistema: sin difuminado, desplazada 4 px hacia abajo.
  ///
  /// Equivale al `border-bottom: 4px solid <tono oscuro>` del CSS.
  static List<BoxShadow> sombraSolida(Color sombra) => <BoxShadow>[
    BoxShadow(color: sombra, offset: const Offset(0, JorimaMedidas.hundido), blurRadius: 0, spreadRadius: 0),
  ];

  /// Borde del sistema (`--border-w: 2px`).
  static Border bordeSolido(Color color) => Border.all(color: color, width: JorimaMedidas.borde);
}
