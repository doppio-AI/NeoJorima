import 'package:flutter/material.dart';

import '../../theme/colores.dart';

/// Avatar oficial de Jorima.
///
/// Usa las imágenes que ya existen en el proyecto (`movil/assets/jorima/`) y
/// las relaciona con el estado de ánimo que reporta la API. No se inventó
/// ningún avatar nuevo: son los archivos del repositorio.
class AvatarJorima extends StatelessWidget {
  const AvatarJorima({super.key, this.estado, this.tamano = 54, this.conBorde = true});

  /// Uno de los valores de `RachaSnapshot.estadosValidos`, o `null`.
  final String? estado;
  final double tamano;
  final bool conBorde;

  /// Mapa estado de ánimo -> archivo del avatar.
  ///
  /// `sereno1` es el de descanso (el que se muestra sin datos) porque es la
  /// cara neutra del personaje.
  static const Map<String, String> archivos = <String, String>{
    'muy mal': 'assets/jorima/tristeza.png',
    'mal': 'assets/jorima/preocupacion.png',
    'regular': 'assets/jorima/sereno1.png',
    'bien': 'assets/jorima/sereno2.png',
    'muy bien': 'assets/jorima/sonrisa_amplia.png',
  };

  static const String archivoPorDefecto = 'assets/jorima/sereno1.png';

  static String archivoPara(String? estado) =>
      archivos[estado] ?? archivoPorDefecto;

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 260),
      transitionBuilder: (hijo, animacion) =>
          FadeTransition(opacity: animacion, child: hijo),
      child: Container(
        key: ValueKey<String>(estado ?? 'defecto'),
        width: tamano,
        height: tamano,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: paleta.superficie,
          border: conBorde
              ? Border.all(color: paleta.secundario, width: 2)
              : null,
        ),
        clipBehavior: Clip.antiAlias,
        child: ClipOval(
          child: Image.asset(
            archivoPara(estado),
            fit: BoxFit.cover,
            alignment: Alignment.topCenter,
            // El reloj no debe quedarse en blanco si falta el asset.
            errorBuilder: (context, error, stack) => Icon(
              Icons.person_rounded,
              size: tamano * 0.55,
              color: paleta.textoSecundario,
            ),
          ),
        ),
      ),
    );
  }
}
