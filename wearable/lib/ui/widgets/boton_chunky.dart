import 'package:flutter/material.dart';

import '../../theme/colores.dart';
import '../../theme/tema.dart';
import '../../theme/tipografia.dart';

/// El botón "tipo Duolingo" del proyecto.
///
/// En `globals.css` los botones no usan sombra difusa: llevan un borde inferior
/// sólido de 4 px del tono oscuro de su color y, al presionarlos, **se hunden**
/// 4 px (`translateY(4px)`). Aquí se replica con dos capas dentro de un `Stack`:
/// la de abajo es el "hueco" del color de sombra y la de arriba es el cuerpo del
/// botón, que baja 4 px mientras se mantiene pulsado.
///
/// Siempre ocupa el ancho disponible porque en el reloj la zona táctil debe ser
/// grande (mínimo 48 px que pide la Práctica 1; aquí el alto por defecto es 44
/// con 4 de sombra = 48).
class BotonChunky extends StatefulWidget {
  const BotonChunky({
    super.key,
    required this.etiqueta,
    this.onPressed,
    this.icono,
    this.color,
    this.colorSombra,
    this.colorTexto,
    this.alto = 44,
    this.radio = JorimaMedidas.radioMd,
    this.cargando = false,
    this.vibracion = true,
  });

  final String etiqueta;
  final VoidCallback? onPressed;
  final IconData? icono;
  final Color? color;
  final Color? colorSombra;
  final Color? colorTexto;
  final double alto;
  final double radio;
  final bool cargando;

  /// Si es true, el botón "se hunde" al tocarlo. Se usa `HapticFeedback` desde
  /// las pantallas para no meter dependencias de plataforma aquí.
  final bool vibracion;

  @override
  State<BotonChunky> createState() => _BotonChunkyState();
}

class _BotonChunkyState extends State<BotonChunky> {
  bool _presionado = false;

  bool get _habilitado => widget.onPressed != null && !widget.cargando;

  void _fijar(bool valor) {
    if (!_habilitado || _presionado == valor) return;
    setState(() => _presionado = valor);
  }

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;
    final color = widget.color ?? paleta.primario;
    final sombra = widget.colorSombra ?? paleta.primarioSombra;

    // Contraste automático: sobre el sol y la lavanda el blanco se pierde.
    final texto = widget.colorTexto ??
        (color.computeLuminance() > 0.55 ? paleta.texto : Colors.white);

    final cuerpo = _habilitado ? color : color.withValues(alpha: 0.45);
    final hueco = _habilitado
        ? sombra
        : sombra.withValues(alpha: 0.45);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => _fijar(true),
      onTapUp: (_) => _fijar(false),
      onTapCancel: () => _fijar(false),
      onTap: _habilitado ? widget.onPressed : null,
      child: SizedBox(
        height: widget.alto + JorimaMedidas.hundido,
        child: Stack(
          children: <Widget>[
            // 1) El "hueco" sólido: mismo alto menos 4 px, pegado abajo.
            Positioned(
              left: 0,
              right: 0,
              top: JorimaMedidas.hundido,
              bottom: 0,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: hueco,
                  borderRadius: BorderRadius.circular(widget.radio),
                ),
              ),
            ),
            // 2) El cuerpo, que baja 4 px al presionar.
            Positioned(
              left: 0,
              right: 0,
              top: 0,
              bottom: JorimaMedidas.hundido,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 90),
                curve: Curves.easeOut,
                transform: Matrix4.translationValues(
                  0,
                  _presionado ? JorimaMedidas.hundido : 0,
                  0,
                ),
                decoration: BoxDecoration(
                  color: cuerpo,
                  borderRadius: BorderRadius.circular(widget.radio),
                ),
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: widget.cargando
                        ? SizedBox(
                            width: 17,
                            height: 17,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.4,
                              valueColor: AlwaysStoppedAnimation<Color>(texto),
                            ),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: <Widget>[
                              if (widget.icono != null) ...<Widget>[
                                Icon(widget.icono, size: 18, color: texto),
                                const SizedBox(width: 6),
                              ],
                              Flexible(
                                child: Text(
                                  widget.etiqueta,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontFamily: JorimaTexto.familia,
                                    fontSize: JorimaTexto.chat,
                                    fontWeight: JorimaTexto.extraNegrita,
                                    color: texto,
                                    height: 1.0,
                                  ),
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Botón cuadrado pequeño para iconos (el "acceso" de la pantalla de inicio).
class BotonIconoChunky extends StatefulWidget {
  const BotonIconoChunky({
    super.key,
    required this.icono,
    required this.onPressed,
    this.color,
    this.colorSombra,
    this.tamano = 52,
    this.etiqueta,
  });

  final IconData icono;
  final VoidCallback? onPressed;
  final Color? color;
  final Color? colorSombra;
  final double tamano;
  final String? etiqueta;

  @override
  State<BotonIconoChunky> createState() => _BotonIconoChunkyState();
}

class _BotonIconoChunkyState extends State<BotonIconoChunky> {
  bool _presionado = false;

  void _fijar(bool valor) {
    if (widget.onPressed == null || _presionado == valor) return;
    setState(() => _presionado = valor);
  }

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;
    final color = widget.color ?? paleta.superficie;
    final sombra = widget.colorSombra ?? paleta.bordeFuerte;
    final colorIcono = widget.color == null ? paleta.primario : Colors.white;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => _fijar(true),
      onTapUp: (_) => _fijar(false),
      onTapCancel: () => _fijar(false),
      onTap: widget.onPressed,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          SizedBox(
            width: widget.tamano,
            height: widget.tamano + JorimaMedidas.hundido,
            child: Stack(
              children: <Widget>[
                Positioned(
                  left: 0,
                  right: 0,
                  top: JorimaMedidas.hundido,
                  bottom: 0,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: sombra,
                      borderRadius: BorderRadius.circular(JorimaMedidas.radioMd),
                    ),
                  ),
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: JorimaMedidas.hundido,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 90),
                    transform: Matrix4.translationValues(
                      0,
                      _presionado ? JorimaMedidas.hundido : 0,
                      0,
                    ),
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(JorimaMedidas.radioMd),
                      border: Border.all(color: paleta.borde, width: 1.5),
                    ),
                    child: Icon(widget.icono, size: widget.tamano * 0.44, color: colorIcono),
                  ),
                ),
              ],
            ),
          ),
          if (widget.etiqueta != null) ...<Widget>[
            const SizedBox(height: 3),
            Text(
              widget.etiqueta!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: JorimaTexto.familia,
                fontSize: JorimaTexto.micro,
                fontWeight: JorimaTexto.negrita,
                color: paleta.textoSecundario,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
