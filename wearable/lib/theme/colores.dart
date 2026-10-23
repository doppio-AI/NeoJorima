import 'package:flutter/material.dart';

/// Tokens de color de Jorima.
///
/// Fuente única de verdad: `web/app/globals.css` (bloque 1 del estilo
/// "Duolingo"). Los valores están copiados del CSS real del proyecto, no
/// aproximados a ojo:
///
///   --c-primary            #0F4C81   --c-primary-shadow    #0A3557
///   --c-secondary          #2A9D8F   --c-secondary-shadow  #1C7268
///   --c-sol                #F4A62A   --c-sol-shadow        #C4831F
///   --c-lavanda            #8B7FD4   --c-lavanda-shadow    #6B5FB0
///   --c-coral              #E76F51   --c-coral-shadow      #B8543C
///   --c-bg #F7F9FA  --c-surface #FFFFFF  --c-border #E1E6EA
///   --c-border-strong #CBD3DA        (modo oscuro en [data-theme="dark"])
///   --c-bg #0b1120  --c-surface #141b2d  --c-border #2b3548
class JorimaColores {
  JorimaColores._();

  // ── Marca (mismos tokens que globals.css) ──
  static const Color azulProfundo = Color(0xFF0F4C81);
  static const Color azulProfundoSombra = Color(0xFF0A3557);

  static const Color verdeTurquesa = Color(0xFF2A9D8F);
  static const Color verdeTurquesaSombra = Color(0xFF1C7268);

  static const Color sol = Color(0xFFF4A62A);
  static const Color solSombra = Color(0xFFC4831F);

  static const Color lavanda = Color(0xFF8B7FD4);
  static const Color lavandaSombra = Color(0xFF6B5FB0);

  static const Color coral = Color(0xFFE76F51);
  static const Color coralSombra = Color(0xFFB8543C);

  // ── Superficies, tema claro ──
  static const Color fondo = Color(0xFFF7F9FA);
  static const Color superficie = Color(0xFFFFFFFF);
  static const Color borde = Color(0xFFE1E6EA);
  static const Color bordeFuerte = Color(0xFFCBD3DA);

  // ── Superficies, tema oscuro (globals.css [data-theme="dark"]) ──
  static const Color fondoOscuro = Color(0xFF0B1120);
  static const Color superficieOscura = Color(0xFF141B2D);
  static const Color bordeOscuro = Color(0xFF2B3548);
  static const Color bordeFuerteOscuro = Color(0xFF3C4863);

  // ── Texto ──
  static const Color texto = Color(0xFF12201F);
  static const Color textoOscuro = Color(0xFFF8FAFC);
  static const Color textoSecundario = Color(0xFF6B7280);
  static const Color textoSecundarioOscuro = Color(0xFF9CA3AF);
}

/// Paleta resuelta para el tema activo (claro u oscuro).
///
/// Se expone como [ThemeExtension] para que las pantallas y los widgets pidan
/// los colores al tema en lugar de decidir "si es oscuro entonces...". En el
/// reloj esto importa porque el tema oscuro ahorra batería en pantallas OLED.
@immutable
class PaletaJorima extends ThemeExtension<PaletaJorima> {
  const PaletaJorima({
    required this.fondo,
    required this.superficie,
    required this.borde,
    required this.bordeFuerte,
    required this.texto,
    required this.textoSecundario,
    required this.primario,
    required this.primarioSombra,
    required this.secundario,
    required this.secundarioSombra,
    required this.esOscura,
  });

  final Color fondo;
  final Color superficie;
  final Color borde;
  final Color bordeFuerte;
  final Color texto;
  final Color textoSecundario;
  final Color primario;
  final Color primarioSombra;
  final Color secundario;
  final Color secundarioSombra;
  final bool esOscura;

  static const PaletaJorima claro = PaletaJorima(
    fondo: JorimaColores.fondo,
    superficie: JorimaColores.superficie,
    borde: JorimaColores.borde,
    bordeFuerte: JorimaColores.bordeFuerte,
    texto: JorimaColores.texto,
    textoSecundario: JorimaColores.textoSecundario,
    primario: JorimaColores.azulProfundo,
    primarioSombra: JorimaColores.azulProfundoSombra,
    secundario: JorimaColores.verdeTurquesa,
    secundarioSombra: JorimaColores.verdeTurquesaSombra,
    esOscura: false,
  );

  static const PaletaJorima oscuro = PaletaJorima(
    fondo: JorimaColores.fondoOscuro,
    superficie: JorimaColores.superficieOscura,
    borde: JorimaColores.bordeOscuro,
    bordeFuerte: JorimaColores.bordeFuerteOscuro,
    texto: JorimaColores.textoOscuro,
    textoSecundario: JorimaColores.textoSecundarioOscuro,
    primario: JorimaColores.azulProfundo,
    primarioSombra: JorimaColores.azulProfundoSombra,
    secundario: JorimaColores.verdeTurquesa,
    secundarioSombra: JorimaColores.verdeTurquesaSombra,
    esOscura: true,
  );

  @override
  PaletaJorima copyWith({
    Color? fondo,
    Color? superficie,
    Color? borde,
    Color? bordeFuerte,
    Color? texto,
    Color? textoSecundario,
    Color? primario,
    Color? primarioSombra,
    Color? secundario,
    Color? secundarioSombra,
    bool? esOscura,
  }) {
    return PaletaJorima(
      fondo: fondo ?? this.fondo,
      superficie: superficie ?? this.superficie,
      borde: borde ?? this.borde,
      bordeFuerte: bordeFuerte ?? this.bordeFuerte,
      texto: texto ?? this.texto,
      textoSecundario: textoSecundario ?? this.textoSecundario,
      primario: primario ?? this.primario,
      primarioSombra: primarioSombra ?? this.primarioSombra,
      secundario: secundario ?? this.secundario,
      secundarioSombra: secundarioSombra ?? this.secundarioSombra,
      esOscura: esOscura ?? this.esOscura,
    );
  }

  @override
  PaletaJorima lerp(covariant ThemeExtension<PaletaJorima>? otro, double t) {
    if (otro is! PaletaJorima) return this;
    return PaletaJorima(
      fondo: Color.lerp(fondo, otro.fondo, t)!,
      superficie: Color.lerp(superficie, otro.superficie, t)!,
      borde: Color.lerp(borde, otro.borde, t)!,
      bordeFuerte: Color.lerp(bordeFuerte, otro.bordeFuerte, t)!,
      texto: Color.lerp(texto, otro.texto, t)!,
      textoSecundario: Color.lerp(textoSecundario, otro.textoSecundario, t)!,
      primario: Color.lerp(primario, otro.primario, t)!,
      primarioSombra: Color.lerp(primarioSombra, otro.primarioSombra, t)!,
      secundario: Color.lerp(secundario, otro.secundario, t)!,
      secundarioSombra: Color.lerp(secundarioSombra, otro.secundarioSombra, t)!,
      esOscura: t < 0.5 ? esOscura : otro.esOscura,
    );
  }
}

/// Acceso corto a la paleta desde cualquier widget: `context.paleta`.
extension PaletaEnContexto on BuildContext {
  PaletaJorima get paleta =>
      Theme.of(this).extension<PaletaJorima>() ?? PaletaJorima.claro;
}
