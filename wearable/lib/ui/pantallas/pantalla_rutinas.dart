import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../data/api/modelos.dart';
import '../../state/routine_scheduler.dart';
import '../../theme/colores.dart';
import '../../theme/tema.dart';
import '../../theme/tipografia.dart';
import '../widgets/boton_chunky.dart';
import '../widgets/marco_reloj.dart';

/// Rutinas de cuidado (RF-03): el listado y el control de los avisos.
///
/// El disparo de los avisos es automático, según el plan semanal del
/// [RoutineScheduler]; el botón de prueba existe para poder mostrar el aviso
/// sin esperar a la hora, igual que el GENERAR NOTIFICACIÓN de la Práctica 4.
class PantallaRutinas extends StatelessWidget {
  const PantallaRutinas({super.key});

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;
    final rutinas = context.watch<RoutineScheduler>();

    return MarcoReloj(
      titulo: 'Rutinas',
      desplazable: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          // ── Estado de los avisos ──
          PiezasJorima.tarjeta(
            context: context,
            color: rutinas.activas
                ? paleta.secundario.withValues(alpha: 0.10)
                : null,
            colorBorde: rutinas.activas
                ? paleta.secundario.withValues(alpha: 0.45)
                : null,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Icon(
                      rutinas.activas
                          ? Icons.notifications_active_rounded
                          : Icons.notifications_off_outlined,
                      size: 15,
                      color: rutinas.activas
                          ? paleta.secundario
                          : paleta.textoSecundario,
                    ),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        rutinas.activas ? 'Avisos activos' : 'Avisos apagados',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontFamily: JorimaTexto.familia,
                          fontSize: JorimaTexto.pequeno,
                          fontWeight: JorimaTexto.extraNegrita,
                          color: paleta.texto,
                        ),
                      ),
                    ),
                  ],
                ),
                if (rutinas.activas) ...<Widget>[
                  const SizedBox(height: 2),
                  Text(
                    rutinas.plan.map((p) => p.horaTexto).join(' · '),
                    style: TextStyle(
                      fontFamily: JorimaTexto.familia,
                      fontSize: 10,
                      fontWeight: JorimaTexto.seminegrita,
                      color: paleta.textoSecundario,
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 5),

          BotonChunky(
            etiqueta: rutinas.activas ? 'Apagar avisos' : 'Activar avisos',
            icono: rutinas.activas
                ? Icons.notifications_off_rounded
                : Icons.notifications_rounded,
            alto: 38,
            cargando: rutinas.programando,
            color: rutinas.activas ? paleta.superficie : paleta.primario,
            colorSombra: rutinas.activas ? paleta.bordeFuerte : paleta.primarioSombra,
            colorTexto: rutinas.activas ? paleta.texto : Colors.white,
            onPressed: rutinas.programando
                ? null
                : () async {
                    HapticFeedback.selectionClick();
                    if (rutinas.activas) {
                      await rutinas.desactivar();
                    } else {
                      final ok = await rutinas.activar();
                      if (!context.mounted) return;
                      if (!ok) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Hacen falta permisos de notificación para avisarte.',
                            ),
                            duration: Duration(seconds: 3),
                          ),
                        );
                      }
                    }
                  },
          ),

          if (rutinas.permisoDenegado) ...<Widget>[
            const SizedBox(height: 4),
            PiezasJorima.error(
              context,
              'El permiso de notificaciones está denegado. Actívalo en los ajustes del reloj.',
            ),
          ],

          const SizedBox(height: 8),

          Text(
            'PAUSAS PARA HOY',
            style: TextStyle(
              fontFamily: JorimaTexto.familia,
              fontSize: 9.5,
              letterSpacing: 0.6,
              fontWeight: JorimaTexto.extraNegrita,
              color: paleta.textoSecundario,
            ),
          ),
          const SizedBox(height: 4),

          // ── Catálogo de actividades ──
          if (rutinas.catalogo.isEmpty && rutinas.actividades.length <= 1)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(paleta.secundario),
                  ),
                ),
              ),
            ),

          ...rutinas.actividades.map(
            (actividad) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: _FilaActividad(
                actividad: actividad,
                paleta: paleta,
                alTocar: () {
                  HapticFeedback.selectionClick();
                  Navigator.of(context).pushNamed(
                    '/rutina',
                    arguments: actividad,
                  );
                },
              ),
            ),
          ),

          const SizedBox(height: 4),

          // ── Prueba manual del aviso ──
          BotonChunky(
            etiqueta: 'Probar un aviso',
            icono: Icons.notification_add_rounded,
            alto: 34,
            color: JorimaColores.sol,
            colorSombra: JorimaColores.solSombra,
            colorTexto: paleta.texto,
            onPressed: () async {
              HapticFeedback.mediumImpact();
              final actividad = rutinas.actividades.isEmpty
                  ? rutinas.actividadPorTipo(TipoRutina.respiracion)
                  : rutinas.actividades.first;
              await rutinas.probarAhora(actividad);
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Aviso enviado. Tócalo para abrir la pausa.'),
                  duration: Duration(seconds: 3),
                ),
              );
            },
          ),

          if (rutinas.error != null) ...<Widget>[
            const SizedBox(height: 4),
            PiezasJorima.error(context, rutinas.error!),
          ],

          const SizedBox(height: 6),

          Center(
            child: Text(
              '${rutinas.totalPausas} pausas desde que empezaste',
              style: TextStyle(
                fontFamily: JorimaTexto.familia,
                fontSize: 10,
                fontWeight: JorimaTexto.negrita,
                color: paleta.textoSecundario,
              ),
            ),
          ),

          if (rutinas.pendientes > 0) ...<Widget>[
            const SizedBox(height: 2),
            Center(
              child: Text(
                '${rutinas.pendientes} sin sincronizar',
                style: const TextStyle(
                  fontFamily: JorimaTexto.familia,
                  fontSize: 9.5,
                  fontWeight: JorimaTexto.negrita,
                  color: JorimaColores.solSombra,
                ),
              ),
            ),
          ],

          const SizedBox(height: 6),
        ],
      ),
    );
  }
}

class _FilaActividad extends StatelessWidget {
  const _FilaActividad({
    required this.actividad,
    required this.paleta,
    required this.alTocar,
  });

  final ActividadRelajacion actividad;
  final PaletaJorima paleta;
  final VoidCallback alTocar;

  (IconData, Color) get _estilo {
    switch (actividad.tipo) {
      case TipoRutina.respiracion:
        return (Icons.air_rounded, JorimaColores.verdeTurquesa);
      case TipoRutina.estiramiento:
        return (Icons.accessibility_new_rounded, JorimaColores.lavanda);
      case TipoRutina.agua:
        return (Icons.water_drop_rounded, JorimaColores.azulProfundo);
      case TipoRutina.capsula:
        return (Icons.auto_stories_rounded, JorimaColores.sol);
      case TipoRutina.juego:
        return (Icons.extension_rounded, JorimaColores.coral);
      default:
        return (Icons.spa_rounded, JorimaColores.verdeTurquesa);
    }
  }

  @override
  Widget build(BuildContext context) {
    final (icono, color) = _estilo;
    final segundos = actividad.duracionSeg;
    // 90 s se lee mejor en segundos; a partir de dos minutos, en minutos.
    final duracion = segundos < 120
        ? '$segundos s'
        : '${(segundos / 60).round()} min';

    return Material(
      color: paleta.superficie,
      borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
      child: InkWell(
        borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
        onTap: alTocar,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
            border: Border.all(color: paleta.borde, width: 1.2),
          ),
          child: Row(
            children: <Widget>[
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icono, size: 15, color: color),
              ),
              const SizedBox(width: 7),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Text(
                      actividad.titulo,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: JorimaTexto.familia,
                        fontSize: JorimaTexto.pequeno,
                        fontWeight: JorimaTexto.extraNegrita,
                        color: paleta.texto,
                      ),
                    ),
                    Text(
                      '${TipoRutina.etiqueta(actividad.tipo)} · $duracion',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: JorimaTexto.familia,
                        fontSize: 9.5,
                        fontWeight: JorimaTexto.seminegrita,
                        color: paleta.textoSecundario,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                size: 17,
                color: paleta.textoSecundario,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
