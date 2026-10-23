import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';

import 'app.dart';
import 'data/api/api_cliente.dart';
import 'data/api/auth_api.dart';
import 'data/api/chat_api.dart';
import 'data/api/racha_api.dart';
import 'data/api/rutinas_api.dart';
import 'data/local/almacen_local.dart';
import 'data/local/almacen_sqflite.dart';
import 'data/local/cola_sincronizacion.dart';
import 'services/almacenamiento_seguro.dart';
import 'services/cifrado_local.dart';
import 'services/conectividad.dart';
import 'services/notificaciones.dart';
import 'state/chat_manager.dart';
import 'state/routine_scheduler.dart';
import 'state/sesion_manager.dart';
import 'state/sincronizador.dart';
import 'state/streak_manager.dart';
import 'state/tema_controller.dart';

/// Clave del navegador: la necesitan los avisos, que pueden llegar con la app
/// cerrada y tienen que abrir directamente la pantalla de la actividad.
final GlobalKey<NavigatorState> _navegador = GlobalKey<NavigatorState>();

/// Aviso que llegó antes de que hubiera navegador (app recién abierta).
String? _avisoPendiente;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ── Servicios de plataforma ──
  final almacenSeguro = AlmacenamientoSeguroAndroid();
  final cifrado = CifradoLocal(almacenSeguro);

  // Base local cifrada. Si SQLite no abre (emulador sin almacenamiento, por
  // ejemplo), se degrada a memoria: la app sigue funcionando, sólo no persiste
  // entre sesiones.
  final AlmacenLocal almacen = await _abrirAlmacen(cifrado);
  final cola = ColaSincronizacion(almacen);

  // ── Capa de datos ──
  // El cliente pide el token en cada petición; la sesión se construye después,
  // por eso se resuelve con una indirección en vez de pasarla ya armada.
  late final SesionManager sesion;
  final api = ApiCliente(proveedorToken: () => sesion.proveedorToken());
  final authApi = AuthApi(api);

  sesion = SesionManager(authApi: authApi, almacenSeguro: almacenSeguro);

  final chatApi = ChatApi(api);
  final rachaApi = RachaApi(api);
  final rutinasApi = RutinasApi(api);

  // ── Gestores de estado ──
  final chat = ChatManager(api: chatApi, almacen: almacen, cola: cola);
  final racha = StreakManager(api: rachaApi, almacen: almacen, cola: cola);

  final notificaciones = ServicioNotificaciones();
  final rutinas = RoutineScheduler(
    api: rutinasApi,
    notificaciones: notificaciones,
    almacen: almacen,
    cola: cola,
  );

  final conectividad = ServicioConectividad();
  final sincronizador = Sincronizador(
    chat: chat,
    racha: racha,
    rutinas: rutinas,
    conectividad: conectividad,
  );
  final tema = TemaController(almacen: almacen);

  // ── Arranque ──
  await tema.cargar();

  // Los avisos se preparan siempre: el canal y el permiso son lo que permite
  // que el reloj avise aunque la app esté cerrada.
  await notificaciones.inicializar(
    alTocar: (payload) => _abrirDesdeAviso(payload, rutinas),
  );

  await sesion.restaurar();
  await sincronizador.iniciar();

  if (sesion.autenticado) {
    // Offline-first: se pinta con la caché y se refresca en paralelo.
    unawaited(racha.cargar());
    unawaited(chat.cargar());
    unawaited(rutinas.cargar());
    unawaited(sincronizador.sincronizarTodo());
  }

  runApp(
    JorimaWearableApp(
      navegadorClave: _navegador,
      dependencias: Dependencias(
        sesion: sesion,
        chat: chat,
        racha: racha,
        rutinas: rutinas,
        tema: tema,
        sincronizador: sincronizador,
        conectividad: conectividad,
        notificaciones: notificaciones,
        almacen: almacen,
      ),
    ),
  );

  // Si la app se abrió desde un aviso, el navegador ya existe en el primer
  // fotograma: es el momento de ir a la actividad.
  WidgetsBinding.instance.addPostFrameCallback((_) {
    final payload = _avisoPendiente;
    if (payload == null) return;
    _avisoPendiente = null;
    _navegarARutina(payload, rutinas);
  });
}

Future<AlmacenLocal> _abrirAlmacen(CifradoLocal cifrado) async {
  try {
    final sqflite = AlmacenSqflite();
    // Fuerza la apertura del archivo ahora, no en la primera pantalla.
    await sqflite.totalEnCola();
    return AlmacenCifrado(sqflite, cifrado);
  } catch (_) {
    return AlmacenMemoria();
  }
}

void _abrirDesdeAviso(String? payload, RoutineScheduler rutinas) {
  if (payload == null || payload.isEmpty) return;

  if (_navegador.currentState == null) {
    _avisoPendiente = payload;
    return;
  }

  _navegarARutina(payload, rutinas);
}

/// Abre la actividad que traía el aviso.
///
/// Es el equivalente Flutter del `PendingIntent` de la Práctica 4: en vez de
/// abrir la app "por donde sea", abre exactamente la pantalla del aviso.
void _navegarARutina(String payload, RoutineScheduler rutinas) {
  try {
    final datos = jsonDecode(payload);
    if (datos is! Map) return;

    final tipo = datos['tipo']?.toString();
    if (tipo == null || tipo.isEmpty) return;

    final actividad = rutinas.actividadPorTipo(tipo);
    _navegador.currentState?.pushNamed('/rutina', arguments: actividad);
  } catch (_) {
    // Payload ilegible: se abre la app en el inicio, sin romper nada.
  }
}
