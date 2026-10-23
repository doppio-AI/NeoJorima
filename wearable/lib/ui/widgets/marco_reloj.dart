import 'package:flutter/material.dart';

import '../../theme/colores.dart';
import '../../theme/tema.dart';
import '../../theme/tipografia.dart';

/// Marco común de todas las pantallas del reloj.
///
/// Reglas de la Práctica 1 que implementa:
///  * **sin menú permanente**: la navegación es inicio + botón de regreso;
///  * **un dato/acción principal por pantalla** (el que cada pantalla pone en
///    [child]);
///  * respeta la forma redonda: el contenido se mete en el cuadrado inscrito
///    del círculo, porque en las esquinas de un reloj redondo no se lee.
class MarcoReloj extends StatelessWidget {
  const MarcoReloj({
    super.key,
    required this.child,
    this.titulo,
    this.mostrarAtras = true,
    this.accionFinal,
    this.desplazable = false,
    this.paddingExtra = 0,
  });

  final Widget child;
  final String? titulo;
  final bool mostrarAtras;

  /// Acción opcional a la derecha del título (ajustes, por ejemplo).
  final Widget? accionFinal;

  /// Envuelve el contenido en un scroll: obligatorio cuando hay teclado.
  final bool desplazable;

  final double paddingExtra;

  /// Margen horizontal que deja el contenido dentro del círculo.
  ///
  /// Para un círculo, el cuadrado inscrito mide `lado * 0.707`, o sea 14.6 % de
  /// margen por lado. Se usa un poco menos porque el contenido se centra en
  /// vertical, donde el círculo es más ancho.
  static double margenRedondo(double ladoCorto) => ladoCorto * 0.125;

  /// Margen vertical. Es mayor que el horizontal a propósito: el título y el
  /// botón de regreso viven en la parte de arriba, y ahí el círculo se cierra;
  /// con este margen quedan dentro de la pantalla redonda.
  static double margenVertical(double ladoCorto) => ladoCorto * 0.15;

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;
    final lado = MediaQuery.sizeOf(context).shortestSide;
    final margenH = margenRedondo(lado) + paddingExtra;
    final margenV = margenVertical(lado);

    Widget contenido = child;

    if (desplazable) {
      // `Center` centra el contenido cuando cabe y `SingleChildScrollView` lo
      // desplaza cuando no: así ninguna pantalla queda cortada por la curva del
      // reloj ni desborda en vertical.
      contenido = Center(
        child: SingleChildScrollView(
          physics: const ClampingScrollPhysics(),
          child: child,
        ),
      );
    }

    return Scaffold(
      backgroundColor: paleta.fondo,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: margenH, vertical: margenV),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              if (titulo != null || mostrarAtras)
                _Cabecera(
                  titulo: titulo,
                  mostrarAtras: mostrarAtras,
                  accionFinal: accionFinal,
                ),
              if (titulo != null || mostrarAtras) const SizedBox(height: 2),
              Expanded(child: contenido),
            ],
          ),
        ),
      ),
    );
  }
}

class _Cabecera extends StatelessWidget {
  const _Cabecera({
    required this.titulo,
    required this.mostrarAtras,
    required this.accionFinal,
  });

  final String? titulo;
  final bool mostrarAtras;
  final Widget? accionFinal;

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;

    return SizedBox(
      height: 34,
      child: Row(
        children: <Widget>[
          if (mostrarAtras)
            _BotonIcono(
              icono: Icons.arrow_back_rounded,
              onPressed: () => Navigator.of(context).maybePop(),
            )
          else
            const SizedBox(width: 2),
          Expanded(
            child: Center(
              child: Text(
                titulo ?? '',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: JorimaTexto.familia,
                  fontSize: JorimaTexto.pequeno,
                  fontWeight: JorimaTexto.extraNegrita,
                  color: paleta.textoSecundario,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          ),
          accionFinal ?? const SizedBox(width: 34),
        ],
      ),
    );
  }
}

class _BotonIcono extends StatelessWidget {
  const _BotonIcono({required this.icono, required this.onPressed});

  final IconData icono;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;

    return SizedBox(
      width: 34,
      height: 34,
      child: Material(
        color: paleta.superficie,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
          side: BorderSide(color: paleta.borde, width: 1.5),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
          onTap: onPressed,
          child: Icon(icono, size: 19, color: paleta.texto),
        ),
      ),
    );
  }
}

/// Piezas sueltas que varias pantallas comparten.
class PiezasJorima {
  PiezasJorima._();

  /// Tarjeta con borde sólido de 2 px (sin sombra difusa).
  static Widget tarjeta({
    required BuildContext context,
    required Widget child,
    EdgeInsetsGeometry padding = const EdgeInsets.all(10),
    Color? color,
    Color? colorBorde,
  }) {
    final paleta = context.paleta;
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? paleta.superficie,
        borderRadius: BorderRadius.circular(JorimaMedidas.radioMd),
        border: Border.all(color: colorBorde ?? paleta.borde, width: 1.5),
      ),
      child: child,
    );
  }

  /// Aviso de "sin conexión", discreto y en una línea.
  static Widget sinConexion(BuildContext context, {String? texto}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: JorimaColores.sol.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(Icons.cloud_off_rounded, size: 12, color: JorimaColores.solSombra),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              texto ?? 'Sin conexión',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontFamily: JorimaTexto.familia,
                fontSize: JorimaTexto.micro,
                fontWeight: JorimaTexto.negrita,
                color: JorimaColores.solSombra,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Barra de error con el mensaje del backend.
  static Widget error(BuildContext context, String mensaje) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: JorimaColores.coral.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
        border: Border.all(
          color: JorimaColores.coral.withValues(alpha: 0.5),
          width: 1.2,
        ),
      ),
      child: Text(
        mensaje,
        style: const TextStyle(
          fontFamily: JorimaTexto.familia,
          fontSize: JorimaTexto.micro,
          fontWeight: JorimaTexto.seminegrita,
          color: JorimaColores.coralSombra,
        ),
      ),
    );
  }
}
