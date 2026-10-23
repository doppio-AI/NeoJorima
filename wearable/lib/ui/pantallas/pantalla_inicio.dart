import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../state/crecimiento_planta.dart';
import '../../state/routine_scheduler.dart';
import '../../state/sesion_manager.dart';
import '../../state/streak_manager.dart';
import '../../theme/colores.dart';
import '../../theme/tema.dart';
import '../../theme/tipografia.dart';
import '../widgets/avatar_jorima.dart';
import '../widgets/boton_chunky.dart';
import '../widgets/marco_reloj.dart';
import '../widgets/planta.dart';

/// Pantalla de inicio del reloj.
///
/// Es la pantalla que la Práctica 1 describe como la primera del reloj: **sin
/// menú permanente**, con el dato más consultado (la racha) y accesos grandes al
/// chat y a la rutina de cuidado.
class PantallaInicio extends StatelessWidget {
  const PantallaInicio({super.key});

  static String _saludo() {
    final hora = DateTime.now().hour;
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;
    final sesion = context.watch<SesionManager>();
    final racha = context.watch<StreakManager>();
    final rutinas = context.watch<RoutineScheduler>();

    final nombre = sesion.usuario?.nombre.split(' ').first ?? '';

    return MarcoReloj(
      titulo: 'Jorima',
      mostrarAtras: false,
      desplazable: true,
      accionFinal: SizedBox(
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
            onTap: () => Navigator.of(context).pushNamed('/ajustes'),
            child: Icon(Icons.settings_rounded, size: 18, color: paleta.texto),
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          // ── Saludo con el avatar ──
          Row(
            children: <Widget>[
              AvatarJorima(estado: racha.estado, tamano: 31),
              const SizedBox(width: 6),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Text(
                      nombre.isEmpty ? _saludo() : '$_saludo(),',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: JorimaTexto.familia,
                        fontSize: JorimaTexto.micro,
                        fontWeight: JorimaTexto.seminegrita,
                        color: paleta.textoSecundario,
                      ),
                    ),
                    Text(
                      nombre.isEmpty ? 'qué bueno verte' : nombre,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: JorimaTexto.familia,
                        fontSize: JorimaTexto.chat,
                        fontWeight: JorimaTexto.extraNegrita,
                        color: paleta.texto,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 3),

          // ── Dato principal: la racha ──
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => Navigator.of(context).pushNamed('/racha'),
            child: PiezasJorima.tarjeta(
              context: context,
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              child: Row(
                children: <Widget>[
                  Planta(racha: racha.racha, tamano: 48),
                  const SizedBox(width: 2),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        // FittedBox: con rachas de tres cifras (365 días) el
                        // número no cabe en la tarjeta del reloj; se encoge en
                        // lugar de desbordarse.
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: <Widget>[
                              Text(
                                '${racha.racha.rachaActual}',
                                style: TextStyle(
                                  fontFamily: JorimaTexto.familia,
                                  fontSize: 30,
                                  height: 1.0,
                                  fontWeight: JorimaTexto.extraNegrita,
                                  color: paleta.secundario,
                                ),
                              ),
                              const SizedBox(width: 3),
                              Padding(
                                padding: const EdgeInsets.only(bottom: 3),
                                child: Text(
                                  racha.racha.rachaActual == 1 ? 'día' : 'días',
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
                        ),
                        // Dos líneas y no tres: en el reloj cada renglón cuenta
                        // y así caben los dos accesos dentro del círculo.
                        Text(
                          'de racha · ${CrecimientoPlanta.etapa(racha.racha).nombre}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontFamily: JorimaTexto.familia,
                            fontSize: 10.5,
                            fontWeight: JorimaTexto.extraNegrita,
                            color: paleta.secundario,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (racha.sinConexion) ...<Widget>[
            const SizedBox(height: 3),
            Center(child: PiezasJorima.sinConexion(context)),
          ],

          const SizedBox(height: 4),

          // ── Accesos grandes (RF-01 y RF-03) ──
          BotonChunky(
            etiqueta: 'Hablar con Jorima',
            icono: Icons.chat_bubble_rounded,
            alto: 36,
            onPressed: () {
              HapticFeedback.selectionClick();
              Navigator.of(context).pushNamed('/chat');
            },
          ),
          const SizedBox(height: 3),
          BotonChunky(
            etiqueta: 'Pausa de cuidado',
            icono: Icons.self_improvement_rounded,
            alto: 36,
            color: paleta.secundario,
            colorSombra: paleta.secundarioSombra,
            onPressed: () {
              HapticFeedback.selectionClick();
              Navigator.of(context).pushNamed('/rutinas');
            },
          ),

          if (rutinas.pendientes > 0) ...<Widget>[
            const SizedBox(height: 5),
            Center(
              child: Text(
                '${rutinas.pendientes} por sincronizar',
                style: TextStyle(
                  fontFamily: JorimaTexto.familia,
                  fontSize: 10,
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
