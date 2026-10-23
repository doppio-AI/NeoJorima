import 'package:flutter/material.dart';

import '../../theme/colores.dart';
import '../../theme/tema.dart';
import '../../theme/tipografia.dart';

/// Indicador de escritura: tres puntos que parpadean.
///
/// Es una de las piezas que el documento de contexto pide conservar de la demo
/// ("indicador de escritura con puntos que parpadean"). Aquí no es decorativo:
/// se muestra exactamente mientras la petición a `POST /api/chat` está en
/// vuelo, porque el backend no hace streaming.
class IndicadorEscritura extends StatefulWidget {
  const IndicadorEscritura({super.key});

  @override
  State<IndicadorEscritura> createState() => _IndicadorEscrituraState();
}

class _IndicadorEscrituraState extends State<IndicadorEscritura>
    with SingleTickerProviderStateMixin {
  late final AnimationController _control;

  @override
  void initState() {
    super.initState();
    _control = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat();
  }

  @override
  void dispose() {
    _control.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: paleta.esOscura ? paleta.superficie : const Color(0xFFF1F4F6),
          borderRadius: BorderRadius.circular(JorimaMedidas.radioMd),
          border: Border.all(color: paleta.borde, width: 1.2),
        ),
        child: AnimatedBuilder(
          animation: _control,
          builder: (context, _) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: List<Widget>.generate(3, (i) {
                // Cada punto va desfasado un tercio del ciclo.
                final fase = (_control.value + i * 0.22) % 1.0;
                final opacidad = 0.28 + 0.72 * (1 - (fase - 0.5).abs() * 2).clamp(0.0, 1.0);
                return Padding(
                  padding: EdgeInsets.only(right: i == 2 ? 0 : 4),
                  child: Opacity(
                    opacity: opacidad,
                    child: Container(
                      width: 5,
                      height: 5,
                      decoration: BoxDecoration(
                        color: paleta.textoSecundario,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                );
              }),
            );
          },
        ),
      ),
    );
  }
}

/// Selector de ánimo del check-in diario (RF-02).
///
/// Los cinco valores son exactamente los que acepta el backend
/// (`ESTADOS_VALIDOS` en `web/app/api/animo/route.ts`); mandar otro provoca un
/// 400, así que la interfaz no ofrece ninguno más.
class SelectorAnimo extends StatelessWidget {
  const SelectorAnimo({
    super.key,
    required this.seleccionado,
    required this.onSeleccion,
    this.habilitado = true,
  });

  final String? seleccionado;
  final ValueChanged<String> onSeleccion;
  final bool habilitado;

  static const List<_OpcionAnimo> _opciones = <_OpcionAnimo>[
    _OpcionAnimo('muy mal', 'Muy mal', Icons.sentiment_very_dissatisfied_rounded, JorimaColores.coral),
    _OpcionAnimo('mal', 'Mal', Icons.sentiment_dissatisfied_rounded, JorimaColores.sol),
    _OpcionAnimo('regular', 'Regular', Icons.sentiment_neutral_rounded, JorimaColores.lavanda),
    _OpcionAnimo('bien', 'Bien', Icons.sentiment_satisfied_rounded, JorimaColores.verdeTurquesa),
    _OpcionAnimo('muy bien', 'Muy bien', Icons.sentiment_very_satisfied_rounded, JorimaColores.azulProfundo),
  ];

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: _opciones.map((opcion) {
        final activo = seleccionado == opcion.valor;
        return Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: habilitado ? () => onSeleccion(opcion.valor) : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 120),
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
              decoration: BoxDecoration(
                color: activo
                    ? opcion.color.withValues(alpha: 0.20)
                    : paleta.superficie,
                borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
                border: Border.all(
                  color: activo ? opcion.color : paleta.borde,
                  width: activo ? 1.8 : 1.2,
                ),
              ),
              child: Row(
                children: <Widget>[
                  Icon(opcion.icono, size: 16, color: opcion.color),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      opcion.etiqueta,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: JorimaTexto.familia,
                        fontSize: JorimaTexto.pequeno,
                        fontWeight: activo
                            ? JorimaTexto.extraNegrita
                            : JorimaTexto.seminegrita,
                        color: paleta.texto,
                      ),
                    ),
                  ),
                  if (activo)
                    Icon(Icons.check_circle_rounded, size: 14, color: opcion.color),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _OpcionAnimo {
  const _OpcionAnimo(this.valor, this.etiqueta, this.icono, this.color);

  final String valor;
  final String etiqueta;
  final IconData icono;
  final Color color;
}
