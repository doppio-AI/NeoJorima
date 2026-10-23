import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../data/api/config_api.dart';
import '../../services/conectividad.dart';
import '../../state/routine_scheduler.dart';
import '../../state/sesion_manager.dart';
import '../../state/sincronizador.dart';
import '../../state/streak_manager.dart';
import '../../state/tema_controller.dart';
import '../../theme/colores.dart';
import '../../theme/tema.dart';
import '../../theme/tipografia.dart';
import '../widgets/boton_chunky.dart';
import '../widgets/marco_reloj.dart';

/// Ajustes del reloj.
///
/// Reúne lo que no cabe en la pantalla de inicio pero hace falta para operar:
/// tema, avisos, sincronización manual y cierre de sesión.
class PantallaAjustes extends StatelessWidget {
  const PantallaAjustes({super.key});

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;
    final tema = context.watch<TemaController>();
    final sesion = context.watch<SesionManager>();
    final rutinas = context.watch<RoutineScheduler>();
    final racha = context.watch<StreakManager>();
    final sincronizador = context.watch<Sincronizador>();
    final conectividad = context.read<ServicioConectividad>();

    final pendientes = racha.pendientes + rutinas.pendientes;

    return MarcoReloj(
      titulo: 'Ajustes',
      desplazable: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          _Fila(
            etiqueta: 'Tema',
            valor: tema.esOscuro ? 'Oscuro' : 'Claro',
            icono: tema.esOscuro
                ? Icons.dark_mode_rounded
                : Icons.light_mode_rounded,
            paleta: paleta,
            alTocar: () {
              HapticFeedback.selectionClick();
              tema.fijar(!tema.esOscuro);
            },
          ),

          const SizedBox(height: 4),

          _Fila(
            etiqueta: 'Avisos de rutina',
            valor: rutinas.activas ? 'Activos' : 'Apagados',
            icono: rutinas.activas
                ? Icons.notifications_active_rounded
                : Icons.notifications_off_outlined,
            paleta: paleta,
            alTocar: () async {
              HapticFeedback.selectionClick();
              if (rutinas.activas) {
                await rutinas.desactivar();
              } else {
                await rutinas.activar();
              }
            },
          ),

          const SizedBox(height: 4),

          _Fila(
            etiqueta: 'Conexión',
            valor: conectividad.enLinea ? 'En línea' : 'Sin conexión',
            icono: conectividad.enLinea
                ? Icons.wifi_rounded
                : Icons.wifi_off_rounded,
            paleta: paleta,
            alTocar: null,
          ),

          const SizedBox(height: 4),

          _Fila(
            etiqueta: 'Por sincronizar',
            valor: pendientes == 0 ? 'Todo al día' : '$pendientes pendientes',
            icono: Icons.sync_rounded,
            paleta: paleta,
            alTocar: null,
          ),

          const SizedBox(height: 8),

          BotonChunky(
            etiqueta: sincronizador.sincronizando ? 'Sincronizando…' : 'Sincronizar ahora',
            icono: Icons.sync_rounded,
            alto: 36,
            cargando: sincronizador.sincronizando,
            onPressed: sincronizador.sincronizando
                ? null
                : () async {
                    HapticFeedback.selectionClick();
                    final enviados = await sincronizador.sincronizarTodo();
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          enviados == 0
                              ? 'No había nada pendiente o sigues sin conexión.'
                              : '$enviados operación(es) enviadas.',
                        ),
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
          ),

          const SizedBox(height: 10),

          // ── Datos técnicos: se muestran para que nada sea "mágico" ──
          Text(
            'BACKEND',
            style: TextStyle(
              fontFamily: JorimaTexto.familia,
              fontSize: 9,
              letterSpacing: 0.6,
              fontWeight: JorimaTexto.extraNegrita,
              color: paleta.textoSecundario,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            ConfigApi.baseUrl,
            maxLines: 2,
            style: TextStyle(
              fontFamily: JorimaTexto.familia,
              fontSize: 9.5,
              fontWeight: JorimaTexto.seminegrita,
              color: paleta.textoSecundario,
            ),
          ),

          if (sesion.usuario != null) ...<Widget>[
            const SizedBox(height: 6),
            Text(
              sesion.usuario!.correo,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: JorimaTexto.familia,
                fontSize: 9.5,
                fontWeight: JorimaTexto.normal,
                color: paleta.textoSecundario,
              ),
            ),
          ],

          const SizedBox(height: 10),

          BotonChunky(
            etiqueta: 'Cerrar sesión',
            icono: Icons.logout_rounded,
            alto: 34,
            color: JorimaColores.coral,
            colorSombra: JorimaColores.coralSombra,
            onPressed: () => _confirmarSalida(context),
          ),

          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Future<void> _confirmarSalida(BuildContext context) async {
    final sesion = context.read<SesionManager>();
    final sincronizador = context.read<Sincronizador>();

    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('¿Cerrar sesión?'),
        titleTextStyle: Theme.of(context).textTheme.titleMedium,
        content: const Text('Los datos guardados en el reloj se conservan.'),
        contentTextStyle: Theme.of(context).textTheme.bodyMedium,
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sí'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    // Intenta dejar todo enviado antes de soltar el token.
    await sincronizador.sincronizarTodo();
    await sesion.cerrarSesion();
  }
}

class _Fila extends StatelessWidget {
  const _Fila({
    required this.etiqueta,
    required this.valor,
    required this.icono,
    required this.paleta,
    required this.alTocar,
  });

  final String etiqueta;
  final String valor;
  final IconData icono;
  final PaletaJorima paleta;
  final VoidCallback? alTocar;

  @override
  Widget build(BuildContext context) {
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
              Icon(icono, size: 14, color: paleta.secundario),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  etiqueta,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontFamily: JorimaTexto.familia,
                    fontSize: 11.5,
                    fontWeight: JorimaTexto.negrita,
                    color: paleta.texto,
                  ),
                ),
              ),
              Text(
                valor,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: JorimaTexto.familia,
                  fontSize: 10.5,
                  fontWeight: JorimaTexto.seminegrita,
                  color: paleta.textoSecundario,
                ),
              ),
              if (alTocar != null)
                Icon(
                  Icons.chevron_right_rounded,
                  size: 15,
                  color: paleta.textoSecundario,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
