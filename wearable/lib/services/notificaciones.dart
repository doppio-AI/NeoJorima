import 'dart:convert';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

/// Notificaciones locales de las rutinas de cuidado (RF-03).
///
/// Traduce a Flutter lo que la Práctica 4 hizo en Android nativo (TaskAlert),
/// respetando los tres elementos que enseñó esa práctica:
///
///  1. **Canal de notificación** (`rutinas_cuidado`), con importancia *normal*
///     para no interrumpir de más, igual que el canal de TaskAlert.
///  2. **Permiso `POST_NOTIFICATIONS`**, que aquí se pide la primera vez que la
///     persona activa sus rutinas, explicando para qué sirve (en TaskAlert se
///     pedía al pulsar un botón).
///  3. **Intención pendiente**: al tocar el aviso se abre la app directamente
///     en la pantalla de la actividad. En Flutter eso se consigue con el
///     `payload` + `onDidReceiveNotificationResponse`.
class ServicioNotificaciones {
  ServicioNotificaciones([FlutterLocalNotificationsPlugin? plugin])
    : _plugin = plugin ?? FlutterLocalNotificationsPlugin();

  final FlutterLocalNotificationsPlugin _plugin;

  /// ID del canal. Una vez creado, la importancia la controla el usuario desde
  /// los ajustes del sistema; cambiarla exige un canal nuevo con otro ID.
  static const String canalId = 'rutinas_cuidado';
  static const String canalNombre = 'Rutinas de cuidado';
  static const String canalDescripcion =
      'Avisos de estiramiento, respiración y pausas para tomar agua';

  bool _inicializado = false;

  /// Prepara el plugin, la base de zonas horarias y el canal.
  ///
  /// [alTocar] recibe el `payload` del aviso para navegar a la actividad.
  Future<void> inicializar({
    required void Function(String? payload) alTocar,
  }) async {
    if (_inicializado) return;

    tzdata.initializeTimeZones();
    try {
      final info = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(info.identifier));
    } catch (_) {
      // Si la zona no se resuelve, `tz.local` se queda en UTC: los avisos
      // siguen funcionando, sólo se desplazan. No se rompe la app por esto.
    }

    const ajustes = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    );

    await _plugin.initialize(
      settings: ajustes,
      onDidReceiveNotificationResponse: (respuesta) =>
          alTocar(respuesta.payload),
    );

    await _crearCanal();
    _inicializado = true;
  }

  Future<void> _crearCanal() async {
    final android = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    if (android == null) return;

    await android.createNotificationChannel(
      const AndroidNotificationChannel(
        canalId,
        canalNombre,
        description: canalDescripcion,
        // Importancia normal: informa sin interrumpir, como el canal de
        // TaskAlert de la Práctica 4.
        importance: Importance.defaultImportance,
        playSound: true,
        enableVibration: true,
      ),
    );
  }

  /// Pide el permiso de notificaciones (Android 13+, API 33+).
  ///
  /// Se llama la primera vez que la persona activa las rutinas, no al abrir la
  /// app: pedir permiso sin contexto es la forma más fácil de que lo nieguen.
  Future<bool> pedirPermiso() async {
    final android = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    if (android == null) return true;

    final concedido = await android.requestNotificationsPermission();
    return concedido ?? false;
  }

  AndroidNotificationDetails get _detalles => const AndroidNotificationDetails(
    canalId,
    canalNombre,
    channelDescription: canalDescripcion,
    importance: Importance.defaultImportance,
    priority: Priority.defaultPriority,
    // Texto breve: en el reloj no caben los párrafos.
    styleInformation: BigTextStyleInformation(''),
    category: AndroidNotificationCategory.reminder,
    enableVibration: true,
  );

  /// Programa un aviso para una fecha concreta.
  Future<void> programar({
    required int id,
    required String titulo,
    required String cuerpo,
    required DateTime cuando,
    required Map<String, dynamic> payload,
    bool repetirCadaDia = false,
  }) async {
    final programada = tz.TZDateTime.from(cuando, tz.local);

    await _plugin.zonedSchedule(
      id: id,
      title: titulo,
      body: cuerpo,
      scheduledDate: programada,
      notificationDetails: NotificationDetails(android: _detalles),
      payload: jsonEncode(payload),
      // Inexacta a propósito: un recordatorio de bienestar no necesita
      // precisión al segundo, y así no hay que pedir el permiso de alarmas
      // exactas, que es intrusivo y en Wear OS suele estar restringido.
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      matchDateTimeComponents: repetirCadaDia ? DateTimeComponents.time : null,
    );
  }

  /// Dispara un aviso inmediato.
  ///
  /// Es el equivalente al botón "GENERAR NOTIFICACIÓN" de TaskAlert: queda
  /// como prueba manual, porque el disparo real lo hace el programador de
  /// rutinas según el plan semanal.
  Future<void> mostrarAhora({
    required int id,
    required String titulo,
    required String cuerpo,
    required Map<String, dynamic> payload,
  }) async {
    await _plugin.show(
      id: id,
      title: titulo,
      body: cuerpo,
      notificationDetails: NotificationDetails(android: _detalles),
      payload: jsonEncode(payload),
    );
  }

  Future<void> cancelar(int id) => _plugin.cancel(id: id);

  Future<void> cancelarTodo() => _plugin.cancelAll();

  /// Avisos que quedaron programados (útil para la pantalla de ajustes).
  Future<int> programadas() async {
    final pendientes = await _plugin.pendingNotificationRequests();
    return pendientes.length;
  }
}
