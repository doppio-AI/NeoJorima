import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../state/crecimiento_planta.dart';
import '../../state/streak_manager.dart';
import '../../theme/colores.dart';
import '../../theme/tema.dart';
import '../../theme/tipografia.dart';
import '../widgets/avatar_jorima.dart';
import '../widgets/indicador_escritura.dart';
import '../widgets/marco_reloj.dart';
import '../widgets/planta.dart';

/// Racha de cuidado (RF-02).
///
/// Criterio de aceptación: "se muestra el número de días y la planta cambia de
/// tamaño de forma proporcional con los datos reales". Los datos son reales:
/// vienen de `GET /api/animo/hoy`.
///
/// Esta pantalla también ofrece el check-in de ánimo, porque es lo que mueve la
/// racha en el backend. Sin ese gesto la planta nunca crecería.
class PantallaRacha extends StatefulWidget {
  const PantallaRacha({super.key});

  @override
  State<PantallaRacha> createState() => _PantallaRachaState();
}

class _PantallaRachaState extends State<PantallaRacha> {
  bool _cambiando = false;
  bool _guardando = false;

  @override
  void initState() {
    super.initState();
    // Refresca al entrar: puede haber pasado un día desde la última vez.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<StreakManager>().cargar();
    });
  }

  Future<void> _registrar(String estado) async {
    if (_guardando) return;

    setState(() => _guardando = true);
    HapticFeedback.lightImpact();

    final racha = context.read<StreakManager>();
    final ok = await racha.registrarCheckIn(estado);

    if (!mounted) return;
    setState(() {
      _guardando = false;
      if (ok) _cambiando = false;
    });

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            racha.sinConexion
                ? 'Guardado en el reloj. Se enviará al reconectar.'
                : 'Listo. Tu racha va en ${racha.racha.rachaActual} ${racha.racha.rachaActual == 1 ? "día" : "días"}.',
          ),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;
    final racha = context.watch<StreakManager>();
    final snapshot = racha.racha;
    final etapa = CrecimientoPlanta.etapa(snapshot);

    final mostrarSelector = !racha.yaContesto || _cambiando;

    return MarcoReloj(
      titulo: 'Tu racha',
      desplazable: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (racha.sinConexion) ...<Widget>[
            Center(child: PiezasJorima.sinConexion(context)),
            const SizedBox(height: 3),
          ],

          // ── Dato principal: días de racha ──
          Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: <Widget>[
                Text(
                  '${snapshot.rachaActual}',
                  style: TextStyle(
                    fontFamily: JorimaTexto.familia,
                    fontSize: 42,
                    height: 1.0,
                    fontWeight: JorimaTexto.extraNegrita,
                    color: paleta.secundario,
                  ),
                ),
                const SizedBox(width: 4),
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(
                    snapshot.rachaActual == 1 ? 'día' : 'días',
                    style: TextStyle(
                      fontFamily: JorimaTexto.familia,
                      fontSize: JorimaTexto.pequeno,
                      fontWeight: JorimaTexto.negrita,
                      color: paleta.textoSecundario,
                    ),
                  ),
                ),
              ],
            ),
          ),

          Center(child: Planta(racha: snapshot, tamano: 62)),

          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  etapa.nombre,
                  style: TextStyle(
                    fontFamily: JorimaTexto.familia,
                    fontSize: JorimaTexto.pequeno,
                    fontWeight: JorimaTexto.extraNegrita,
                    color: paleta.texto,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  CrecimientoPlanta.mensaje(snapshot),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: JorimaTexto.familia,
                    fontSize: 10.5,
                    fontWeight: JorimaTexto.seminegrita,
                    color: paleta.textoSecundario,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 4),

          // ── Check-in diario, lo que mueve la racha ──
          if (mostrarSelector)
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  _cambiando ? '¿Cómo te sientes ahora?' : '¿Cómo te sientes hoy?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: JorimaTexto.familia,
                    fontSize: JorimaTexto.micro,
                    fontWeight: JorimaTexto.extraNegrita,
                    color: paleta.textoSecundario,
                  ),
                ),
                const SizedBox(height: 4),
                SelectorAnimo(
                  seleccionado: racha.estado,
                  habilitado: !_guardando,
                  onSeleccion: _registrar,
                ),
                if (_guardando)
                  Padding(
                    padding: const EdgeInsets.only(top: 4, bottom: 4),
                    child: Center(
                      child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            paleta.secundario,
                          ),
                        ),
                      ),
                    ),
                  ),
                if (_cambiando)
                  TextButton(
                    onPressed: () => setState(() => _cambiando = false),
                    child: const Text('Cancelar'),
                  ),
              ],
            )
          else
            PiezasJorima.tarjeta(
              context: context,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              color: paleta.secundario.withValues(alpha: 0.10),
              colorBorde: paleta.secundario.withValues(alpha: 0.4),
              child: Row(
                children: <Widget>[
                  AvatarJorima(estado: racha.estado, tamano: 28),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Text(
                          'Hoy te sientes ${racha.estado ?? "bien"}',
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
                          'Check-in de hoy registrado',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontFamily: JorimaTexto.familia,
                            fontSize: 10,
                            fontWeight: JorimaTexto.seminegrita,
                            color: paleta.textoSecundario,
                          ),
                        ),
                      ],
                    ),
                  ),
                  InkWell(
                    onTap: () => setState(() => _cambiando = true),
                    borderRadius: BorderRadius.circular(20),
                    child: Padding(
                      padding: const EdgeInsets.all(5),
                      child: Icon(
                        Icons.edit_rounded,
                        size: 15,
                        color: paleta.secundarioSombra,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          if (racha.error != null) ...<Widget>[
            const SizedBox(height: 5),
            PiezasJorima.error(context, racha.error!),
          ],

          const SizedBox(height: 5),

          // ── Contexto: el piso permanente y el máximo histórico ──
          Row(
            children: <Widget>[
              Expanded(
                child: _Dato(
                  etiqueta: 'Raíz',
                  valor: '${snapshot.rachaRaiz}',
                  paleta: paleta,
                  color: JorimaColores.lavanda,
                  ayuda: 'Nunca baja',
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: _Dato(
                  etiqueta: 'Mejor',
                  valor: '${snapshot.mejorRacha}',
                  paleta: paleta,
                  color: JorimaColores.sol,
                  ayuda: 'Tu récord',
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: _Dato(
                  etiqueta: 'Total',
                  valor: '${snapshot.diasTotales}',
                  paleta: paleta,
                  color: JorimaColores.verdeTurquesa,
                  ayuda: 'Días',
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
        ],
      ),
    );
  }
}

class _Dato extends StatelessWidget {
  const _Dato({
    required this.etiqueta,
    required this.valor,
    required this.paleta,
    required this.color,
    required this.ayuda,
  });

  final String etiqueta;
  final String valor;
  final PaletaJorima paleta;
  final Color color;
  final String ayuda;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 4),
      decoration: BoxDecoration(
        color: paleta.superficie,
        borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
        border: Border.all(color: paleta.borde, width: 1.2),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Text(
            valor,
            maxLines: 1,
            style: TextStyle(
              fontFamily: JorimaTexto.familia,
              fontSize: 16,
              height: 1.05,
              fontWeight: JorimaTexto.extraNegrita,
              color: color,
            ),
          ),
          Text(
            etiqueta,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontFamily: JorimaTexto.familia,
              fontSize: 9.5,
              fontWeight: JorimaTexto.negrita,
              color: paleta.textoSecundario,
            ),
          ),
          Text(
            ayuda,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontFamily: JorimaTexto.familia,
              fontSize: 8.5,
              fontWeight: JorimaTexto.normal,
              color: paleta.textoSecundario.withValues(alpha: 0.75),
            ),
          ),
        ],
      ),
    );
  }
}
