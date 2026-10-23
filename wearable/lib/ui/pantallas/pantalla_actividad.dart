import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../data/api/modelos.dart';
import '../../state/routine_scheduler.dart';
import '../../theme/colores.dart';
import '../../theme/tipografia.dart';
import '../widgets/boton_chunky.dart';
import '../widgets/marco_reloj.dart';

/// Pantalla de una rutina de cuidado.
///
/// Es el destino del aviso de RF-03: al tocar la notificación se abre
/// directamente esta pantalla, con la actividad que tocaba (respiración,
/// estiramiento o agua). Por eso la pantalla no depende de la navegación normal
/// y recibe la actividad por argumento.
class PantallaActividad extends StatefulWidget {
  const PantallaActividad({super.key, required this.actividad});

  final ActividadRelajacion actividad;

  @override
  State<PantallaActividad> createState() => _PantallaActividadState();
}

class _PantallaActividadState extends State<PantallaActividad> {
  Timer? _ticker;
  int _msTranscurridos = 0;
  bool _terminada = false;
  bool _registrando = false;

  /// Un ciclo completo de la respiración 4-7-8.
  static const int _msInhala = 4000;
  static const int _msSostiene = 7000;
  static const int _msExhala = 8000;
  static const int _msCiclo = _msInhala + _msSostiene + _msExhala;

  static const List<String> _pasosEstiramiento = <String>[
    'Cuello y hombros',
    'Espalda',
    'Muñecas y manos',
    'Piernas',
  ];

  bool get _esRespiracion => widget.actividad.tipo == TipoRutina.respiracion;
  bool get _esAgua => widget.actividad.tipo == TipoRutina.agua;

  int get _totalMs => widget.actividad.duracionSeg * 1000;

  double get _progreso =>
      _totalMs == 0 ? 1 : (_msTranscurridos / _totalMs).clamp(0.0, 1.0);

  int get _segundosRestantes =>
      ((_totalMs - _msTranscurridos) / 1000).ceil().clamp(0, 9999);

  @override
  void initState() {
    super.initState();
    if (!_esAgua) {
      _ticker = Timer.periodic(const Duration(milliseconds: 100), _tick);
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  void _tick(Timer _) {
    if (_terminada) return;

    setState(() {
      _msTranscurridos += 100;
      if (_msTranscurridos >= _totalMs) {
        _terminada = true;
      }
    });

    if (_terminada) {
      _ticker?.cancel();
      _registrar();
    }
  }

  Future<void> _registrar() async {
    if (_registrando) return;
    _registrando = true;

    HapticFeedback.mediumImpact();

    if (mounted) {
      await context.read<RoutineScheduler>().registrarCompletada(
        widget.actividad,
      );
    }
  }

  /// Fase actual de la respiración y cuánto abrir el círculo (0.5 a 1).
  (String, double) get _faseRespiracion {
    final dentro = _msTranscurridos % _msCiclo;

    if (dentro < _msInhala) {
      final t = dentro / _msInhala;
      return ('Inhala', 0.55 + 0.45 * t);
    }

    if (dentro < _msInhala + _msSostiene) {
      return ('Sostén', 1.0);
    }

    final t = (dentro - _msInhala - _msSostiene) / _msExhala;
    return ('Exhala', 1.0 - 0.45 * t);
  }

  /// Paso actual del estiramiento: nombre, segundos que quedan e índice.
  (String, int, int) get _pasoActual {
    if (_pasosEstiramiento.isEmpty) return ('Estírate', 1, 0);

    final porPaso = _totalMs / _pasosEstiramiento.length;
    final indice = (_msTranscurridos / porPaso).floor().clamp(
      0,
      _pasosEstiramiento.length - 1,
    );

    final restantePaso =
        ((porPaso * (indice + 1) - _msTranscurridos) / 1000).ceil();
    return (_pasosEstiramiento[indice], restantePaso, indice);
  }

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;
    final titulo = widget.actividad.titulo;

    return MarcoReloj(
      titulo: titulo,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Expanded(child: Center(child: _contenido(paleta))),

          if (!_terminada)
            TextButton(
              onPressed: () async {
                _ticker?.cancel();
                // Salir a medias no cuenta como pausa completada.
                if (context.mounted) Navigator.of(context).maybePop();
              },
              child: Text(
                'Ahora no',
                style: TextStyle(
                  fontFamily: JorimaTexto.familia,
                  fontSize: JorimaTexto.micro,
                  fontWeight: JorimaTexto.negrita,
                  color: paleta.textoSecundario,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _contenido(PaletaJorima paleta) {
    if (_terminada) {
      return _ajustable(_celebracion(paleta));
    }

    if (_esAgua) {
      return _ajustable(_agua(paleta));
    }

    if (_esRespiracion) {
      final (fase, escala) = _faseRespiracion;
      return _rueda(
        paleta: paleta,
        escala: escala,
        principal: fase,
        secundario: '$_segundosRestantes s',
        color: paleta.secundario,
        sufijo: '4 · 7 · 8',
      );
    }

    if (widget.actividad.tipo == TipoRutina.estiramiento) {
      final (paso, restante, indice) = _pasoActual;
      return _rueda(
        paleta: paleta,
        escala: 0.92,
        principal: paso,
        secundario: '$restante s',
        color: JorimaColores.lavanda,
        sufijo: '${indice + 1}/${_pasosEstiramiento.length}',
      );
    }

    // Cápsula, juego y sensorial: temporizador simple.
    return _rueda(
      paleta: paleta,
      escala: 0.92,
      principal: '$_segundosRestantes s',
      secundario: 'Respira y suelta',
      color: JorimaColores.sol,
      sufijo: TipoRutina.etiqueta(widget.actividad.tipo),
    );
  }

  /// Envuelve un bloque para que se encoja en relojes pequeños en lugar de
  /// desbordarse. El ancho se fija para que el botón, que ocupa todo el ancho
  /// disponible, tenga una referencia contra la que medirse.
  Widget _ajustable(Widget hijo) {
    final ancho = MediaQuery.sizeOf(context).shortestSide * 0.72;

    return Center(
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: SizedBox(width: ancho, child: hijo),
      ),
    );
  }

  /// Aro de progreso con el texto principal de cada actividad.
  Widget _rueda({
    required PaletaJorima paleta,
    required double escala,
    required String principal,
    required String secundario,
    required Color color,
    required String sufijo,
  }) {
    final lado = MediaQuery.sizeOf(context).shortestSide * 0.52;

    return SizedBox(
      width: lado,
      height: lado,
      child: Stack(
        alignment: Alignment.center,
        children: <Widget>[
          SizedBox(
            width: lado,
            height: lado,
            child: CircularProgressIndicator(
              value: _progreso,
              strokeWidth: 4,
              backgroundColor: paleta.borde,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              strokeCap: StrokeCap.round,
            ),
          ),
          Transform.scale(
            scale: escala,
            child: Container(
              width: lado * 0.74,
              height: lado * 0.74,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Text(
                principal,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: JorimaTexto.familia,
                  fontSize: 15,
                  height: 1.1,
                  fontWeight: JorimaTexto.extraNegrita,
                  color: paleta.texto,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                secundario,
                style: TextStyle(
                  fontFamily: JorimaTexto.familia,
                  fontSize: 11,
                  fontWeight: JorimaTexto.negrita,
                  color: color,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                sufijo,
                style: TextStyle(
                  fontFamily: JorimaTexto.familia,
                  fontSize: 9,
                  fontWeight: JorimaTexto.seminegrita,
                  color: paleta.textoSecundario,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _agua(PaletaJorima paleta) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Icon(
          Icons.water_drop_rounded,
          size: 38,
          color: paleta.primario,
        ),
        const SizedBox(height: 6),
        Text(
          widget.actividad.descripcion,
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontFamily: JorimaTexto.familia,
            fontSize: JorimaTexto.pequeno,
            fontWeight: JorimaTexto.seminegrita,
            color: paleta.texto,
          ),
        ),
        const SizedBox(height: 10),
        BotonChunky(
          etiqueta: 'Ya tomé agua',
          icono: Icons.check_rounded,
          alto: 38,
          onPressed: () {
            HapticFeedback.mediumImpact();
            setState(() {
              _terminada = true;
              _msTranscurridos = _totalMs;
            });
            _registrar();
          },
        ),
      ],
    );
  }

  Widget _celebracion(PaletaJorima paleta) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Icon(
          Icons.spa_rounded,
          size: 40,
          color: paleta.secundario,
        ),
        const SizedBox(height: 6),
        Text(
          'Pausa completada',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: JorimaTexto.familia,
            fontSize: JorimaTexto.titulo,
            fontWeight: JorimaTexto.extraNegrita,
            color: paleta.secundario,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          'Ya quedó registrada en tu cuenta.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: JorimaTexto.familia,
            fontSize: JorimaTexto.micro,
            fontWeight: JorimaTexto.normal,
            color: paleta.textoSecundario,
          ),
        ),
        const SizedBox(height: 10),
        BotonChunky(
          etiqueta: 'Listo',
          alto: 36,
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ],
    );
  }
}
