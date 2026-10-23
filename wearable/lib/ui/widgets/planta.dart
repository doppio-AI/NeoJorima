import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../data/api/modelos.dart';
import '../../state/crecimiento_planta.dart';
import '../../theme/colores.dart';

/// La planta de la racha (RF-02).
///
/// RF-02 pide "una planta minimalista cuyo tamaño crece o se reduce según los
/// días consecutivos de racha". El tamaño se calcula con
/// [CrecimientoPlanta.escala], que es proporcional a `racha_actual` y respeta
/// el piso permanente de `racha_raiz`: por eso la planta nunca desaparece,
/// aunque se falte un día. Es el mismo criterio "anti-culpa" del backend.
///
/// Se dibuja con `CustomPainter` en vez de usar una imagen para que el
/// crecimiento sea continuo (no por saltos de etapa) y para no añadir peso al
/// APK del reloj.
class Planta extends StatelessWidget {
  const Planta({super.key, required this.racha, this.tamano = 116});

  final RachaSnapshot racha;
  final double tamano;

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;
    final progreso = CrecimientoPlanta.progreso(racha);
    final hojas = CrecimientoPlanta.hojas(racha);
    final florece = racha.rachaActual >= CrecimientoPlanta.diasParaPleno;

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: progreso),
      duration: const Duration(milliseconds: 750),
      curve: Curves.easeOutCubic,
      builder: (context, valor, _) {
        return CustomPaint(
          size: Size.square(tamano),
          painter: _PintorPlanta(
            progreso: valor,
            hojas: hojas,
            florece: florece,
            esOscuro: paleta.esOscura,
          ),
        );
      },
    );
  }
}

class _PintorPlanta extends CustomPainter {
  _PintorPlanta({
    required this.progreso,
    required this.hojas,
    required this.florece,
    required this.esOscuro,
  });

  final double progreso;
  final int hojas;
  final bool florece;
  final bool esOscuro;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final centro = w / 2;

    // 0.45 a 1.0, igual que CrecimientoPlanta.escala.
    final escala = CrecimientoPlanta.escalaMinima +
        (1 - CrecimientoPlanta.escalaMinima) * progreso;

    final colorHoja = esOscuro
        ? const Color(0xFF3FBFAE)
        : JorimaColores.verdeTurquesa;
    final colorHojaOscura = JorimaColores.verdeTurquesaSombra;
    final colorMaceta = JorimaColores.coral;
    final colorMacetaSombra = JorimaColores.coralSombra;

    final baseSuelo = h * 0.94;
    final alturaMaceta = h * 0.15;
    final bocaMedia = w * 0.20;
    final fondoMedia = w * 0.155;

    // ── Sombra en el suelo ──
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(centro, baseSuelo + h * 0.008),
        width: bocaMedia * 2.5,
        height: h * 0.035,
      ),
      Paint()..color = colorMacetaSombra.withValues(alpha: 0.18),
    );

    // ── Tallo ──
    final yBaseTallo = baseSuelo - alturaMaceta + h * 0.015;
    final alturaTallo = h * 0.58 * escala;
    final yPunta = yBaseTallo - alturaTallo;

    final tallo = Path()
      ..moveTo(centro, yBaseTallo)
      ..cubicTo(
        centro + 7 * escala,
        yBaseTallo - alturaTallo * 0.40,
        centro - 8 * escala,
        yBaseTallo - alturaTallo * 0.72,
        centro + 1.5,
        yPunta,
      );

    canvas.drawPath(
      tallo,
      Paint()
        ..color = colorHojaOscura
        ..style = PaintingStyle.stroke
        ..strokeWidth = (2.6 * escala).clamp(1.7, 3.2)
        ..strokeCap = StrokeCap.round,
    );

    // ── Hojas, repartidas a lo largo del tallo ──
    final metrica = tallo.computeMetrics().first;
    final total = hojas < 2 ? 2 : hojas;

    for (var i = 0; i < total; i++) {
      final t = 0.12 + 0.84 * (i / (total - 1));
      final tangente = metrica.getTangentForOffset(metrica.length * t);
      if (tangente == null) continue;

      // Las hojas se alternan a izquierda y derecha, y las de arriba son más
      // pequeñas: así la planta se ve natural aunque cambie de tamaño.
      final lado = i.isEven ? 1.0 : -1.0;
      final factorHoja = 0.55 + 0.45 * t;

      _dibujarHoja(
        canvas,
        base: tangente.position,
        lado: lado,
        escala: escala * factorHoja,
        w: w,
        color: i.isEven ? colorHoja : colorHoja.withValues(alpha: 0.88),
        colorNervio: colorHojaOscura,
      );
    }

    // ── Flor cuando ya floreció (30 días) ──
    if (florece) {
      final centroFlor = Offset(centro + 1.5, yPunta - h * 0.012);
      for (var i = 0; i < 5; i++) {
        final angulo = (math.pi * 2 / 5) * i - math.pi / 2;
        canvas.drawCircle(
          centroFlor +
              Offset(math.cos(angulo), math.sin(angulo)) * (w * 0.032),
          w * 0.026,
          Paint()..color = JorimaColores.sol,
        );
      }
      canvas.drawCircle(
        centroFlor,
        w * 0.028,
        Paint()..color = JorimaColores.solSombra,
      );
    }

    // ── Maceta ──
    final maceta = Path()
      ..moveTo(centro - bocaMedia, baseSuelo - alturaMaceta)
      ..lineTo(centro + bocaMedia, baseSuelo - alturaMaceta)
      ..lineTo(centro + fondoMedia, baseSuelo)
      ..lineTo(centro - fondoMedia, baseSuelo)
      ..close();

    canvas.drawPath(maceta, Paint()..color = colorMaceta);

    // Borde inferior sólido de la maceta: el recurso de estilo del proyecto.
    canvas.drawLine(
      Offset(centro - fondoMedia, baseSuelo - h * 0.012),
      Offset(centro + fondoMedia, baseSuelo - h * 0.012),
      Paint()
        ..color = colorMacetaSombra
        ..strokeWidth = h * 0.024
        ..strokeCap = StrokeCap.round,
    );

    // Tierra en la boca de la maceta.
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(centro, baseSuelo - alturaMaceta),
        width: bocaMedia * 1.9,
        height: h * 0.028,
      ),
      Paint()..color = colorMacetaSombra.withValues(alpha: 0.55),
    );
  }

  void _dibujarHoja(
    Canvas canvas, {
    required Offset base,
    required double lado,
    required double escala,
    required double w,
    required Color color,
    required Color colorNervio,
  }) {
    final largo = w * 0.20 * escala + w * 0.05;
    final ancho = largo * 0.44;

    canvas.save();
    canvas.translate(base.dx, base.dy);
    canvas.rotate(lado * -0.66);

    final hoja = Path()
      ..addOval(
        Rect.fromCenter(
          center: Offset(lado * largo * 0.5, 0),
          width: largo,
          height: ancho,
        ),
      );

    canvas.drawPath(hoja, Paint()..color = color);
    canvas.drawLine(
      Offset(lado * largo * 0.12, 0),
      Offset(lado * largo * 0.90, 0),
      Paint()
        ..color = colorNervio.withValues(alpha: 0.55)
        ..strokeWidth = 0.9
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round,
    );

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _PintorPlanta anterior) =>
      anterior.progreso != progreso ||
      anterior.hojas != hojas ||
      anterior.florece != florece ||
      anterior.esOscuro != esOscuro;
}
