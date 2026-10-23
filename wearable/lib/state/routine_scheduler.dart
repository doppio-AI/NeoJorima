import 'package:flutter/foundation.dart';

import '../data/api/api_cliente.dart';
import '../data/api/modelos.dart';
import '../data/api/rutinas_api.dart';
import '../data/local/almacen_local.dart';
import '../data/local/cola_sincronizacion.dart';
import '../services/notificaciones.dart';

/// Un aviso del plan semanal de rutinas.
class HorarioRutina {
  const HorarioRutina({
    required this.tipo,
    required this.hora,
    required this.minuto,
    required this.titulo,
    required this.cuerpo,
  });

  final String tipo;
  final int hora;
  final int minuto;
  final String titulo;
  final String cuerpo;

  String get horaTexto =>
      '${hora.toString().padLeft(2, '0')}:${minuto.toString().padLeft(2, '0')}';
}

/// Gestor de las rutinas de cuidado y sus avisos (RF-03).
///
/// Es el `RoutineScheduler` de la arquitectura de la Práctica 2: programa los
/// avisos según el plan, los lanza con el `ServicioNotificaciones`, y registra
/// la sesión completada en la API (o en la cola si no hay red).
///
/// El disparo es automático según el plan. El botón de "probar ahora" existe
/// sólo como prueba manual, igual que el botón GENERAR NOTIFICACIÓN de
/// TaskAlert en la Práctica 4.
class RoutineScheduler extends ChangeNotifier {
  RoutineScheduler({
    required RutinasApi api,
    required ServicioNotificaciones notificaciones,
    required AlmacenLocal almacen,
    required ColaSincronizacion cola,
  }) : _api = api,
       _notificaciones = notificaciones,
       _almacen = almacen,
       _cola = cola;

  final RutinasApi _api;
  final ServicioNotificaciones _notificaciones;
  final AlmacenLocal _almacen;
  final ColaSincronizacion _cola;

  static const String claveActivas = 'rutinas_activas';
  static const String claveCatalogo = 'catalogo_rutinas';
  static const String claveTotal = 'pausas_total';

  /// Los IDs de notificación empiezan en 1000 para no chocar con otros usos.
  static const int idBase = 1000;

  /// Plan por defecto: tres momentos al día, uno por cada tipo que pide RF-03.
  ///
  /// Se eligieron horas de jornada laboral porque Jorima es una plataforma de
  /// bienestar **en el trabajo**. `agua` no existe como tipo en la API, así que
  /// su aviso es local (ver [TipoRutina.agua]).
  static const List<HorarioRutina> planPorDefecto = <HorarioRutina>[
    HorarioRutina(
      tipo: TipoRutina.estiramiento,
      hora: 10,
      minuto: 0,
      titulo: 'Pausa activa',
      cuerpo: 'Dos minutos de estiramiento y sigues.',
    ),
    HorarioRutina(
      tipo: TipoRutina.respiracion,
      hora: 14,
      minuto: 0,
      titulo: 'Respira 4-7-8',
      cuerpo: '90 segundos para bajar el ritmo.',
    ),
    HorarioRutina(
      tipo: TipoRutina.agua,
      hora: 17,
      minuto: 0,
      titulo: 'Un trago de agua',
      cuerpo: 'Tu cuerpo también pide una pausa.',
    ),
  ];

  List<ActividadRelajacion> _catalogo = <ActividadRelajacion>[];
  final List<HorarioRutina> _plan = planPorDefecto;
  bool _activas = false;
  bool _programando = false;
  bool _permisoDenegado = false;
  int _totalPausas = 0;
  int _completadasHoy = 0;
  int _pendientes = 0;
  String? _error;
  bool _descartado = false;

  List<ActividadRelajacion> get catalogo => List<ActividadRelajacion>.unmodifiable(_catalogo);
  List<HorarioRutina> get plan => List<HorarioRutina>.unmodifiable(_plan);
  bool get activas => _activas;
  bool get programando => _programando;
  bool get permisoDenegado => _permisoDenegado;
  int get totalPausas => _totalPausas;
  int get completadasHoy => _completadasHoy;
  int get pendientes => _pendientes;
  String? get error => _error;

  /// Catálogo con el recordatorio de agua añadido al final.
  List<ActividadRelajacion> get actividades => <ActividadRelajacion>[
    ..._catalogo,
    ActividadRelajacion.agua,
  ];

  /// Resuelve una actividad por su tipo.
  ///
  /// Lo usan los avisos: la notificación solo lleva `tipo` y `titulo` en el
  /// payload, y al tocarla hay que abrir la pantalla de esa actividad. Si el
  /// catálogo aún no se cargó (o el aviso es de un tipo que ya no está), se
  /// construye una actividad mínima con la duración típica para que la pantalla
  /// funcione igual.
  ActividadRelajacion actividadPorTipo(String tipo) {
    if (tipo == TipoRutina.agua) return ActividadRelajacion.agua;

    for (final actividad in _catalogo) {
      if (actividad.tipo == tipo) return actividad;
    }

    return ActividadRelajacion(
      id: 'local-$tipo',
      tipo: tipo,
      titulo: TipoRutina.etiqueta(tipo),
      descripcion: 'Una pausa corta para volver con más calma.',
      duracionSeg: tipo == TipoRutina.estiramiento ? 120 : 90,
      pantalla: 'Rutina',
    );
  }

  Future<void> cargar() async {
    _error = null;

    // 1) Catálogo cacheado (para que la lista exista sin red).
    final cacheCatalogo = await _almacen.leerCache(claveCatalogo);
    final lista = cacheCatalogo?['catalogo'];
    if (lista is List) {
      _catalogo = lista
          .whereType<Map>()
          .map((m) => ActividadRelajacion.desdeJson(Map<String, dynamic>.from(m)))
          .toList();
    }

    final cacheActivas = await _almacen.leerCache(claveActivas);
    _activas = cacheActivas?['activas'] == true;

    final cacheTotal = await _almacen.leerCache(claveTotal);
    final total = cacheTotal?['total'];
    if (total is num) _totalPausas = total.toInt();

    await _cargarCompletadasHoy();
    _avisar();

    // 2) Catálogo real y conteo.
    try {
      final remoto = await _api.catalogo();
      if (remoto.isNotEmpty) {
        _catalogo = remoto;
        await _almacen.guardarCache(claveCatalogo, <String, dynamic>{
          'catalogo': remoto.map((a) => a.aJson()).toList(),
        });
      }

      _totalPausas = await _api.conteo();
      await _almacen.guardarCache(claveTotal, <String, dynamic>{
        'total': _totalPausas,
      });
    } on ApiExcepcion catch (e) {
      if (!e.esRed) _error = e.mensaje;
    } finally {
      _pendientes = (await _cola.sesionesPendientes()).length;
      _avisar();
    }
  }

  /// Activa las rutinas: pide permiso la primera vez y programa los avisos.
  Future<bool> activar() async {
    _programando = true;
    _error = null;
    _avisar();

    try {
      // El permiso se pide aquí, no al abrir la app: es el momento en que la
      // persona entiende para qué sirve.
      final concedido = await _notificaciones.pedirPermiso();
      if (!concedido) {
        _permisoDenegado = true;
        _activas = false;
        _error = 'Sin permiso de notificaciones no se pueden mostrar los avisos';
        return false;
      }

      _permisoDenegado = false;
      _activas = true;
      await _programar();
      return true;
    } finally {
      _programando = false;
      _avisar();
    }
  }

  Future<void> desactivar() async {
    _activas = false;
    await _notificaciones.cancelarTodo();
    await _guardarEstado();
    _avisar();
  }

  /// Programa (o reprograma) todos los avisos del plan.
  Future<void> _programar() async {
    await _notificaciones.cancelarTodo();

    for (var i = 0; i < _plan.length; i++) {
      final horario = _plan[i];
      await _notificaciones.programar(
        id: idBase + i,
        titulo: horario.titulo,
        cuerpo: horario.cuerpo,
        cuando: _proximaOcurrencia(horario.hora, horario.minuto),
        repetirCadaDia: true,
        payload: <String, dynamic>{
          'origen': 'rutina',
          'tipo': horario.tipo,
          'titulo': horario.titulo,
        },
      );
    }

    await _guardarEstado();
  }

  /// Siguiente vez que toca esa hora (hoy si aún no pasó, si no mañana).
  DateTime _proximaOcurrencia(int hora, int minuto) {
    final ahora = DateTime.now();
    var cuando = DateTime(ahora.year, ahora.month, ahora.day, hora, minuto);
    if (!cuando.isAfter(ahora)) {
      cuando = cuando.add(const Duration(days: 1));
    }
    return cuando;
  }

  /// Disparo manual, para demostrar el aviso sin esperar a la hora.
  Future<void> probarAhora(ActividadRelajacion actividad) async {
    await _notificaciones.mostrarAhora(
      id: idBase + 99,
      titulo: actividad.titulo,
      cuerpo: actividad.descripcion,
      payload: <String, dynamic>{
        'origen': 'rutina',
        'tipo': actividad.tipo,
        'titulo': actividad.titulo,
        'id': actividad.id,
      },
    );
  }

  /// Registra una rutina completada.
  ///
  /// El agua no se envía a la API porque `TIPOS_VALIDOS` del backend no la
  /// incluye; se cuenta nada más en el reloj.
  Future<void> registrarCompletada(ActividadRelajacion actividad) async {
    await _sumarCompletadaHoy();

    if (!TipoRutina.validosEnApi.contains(actividad.tipo)) {
      _avisar();
      return;
    }

    try {
      await _api.registrarSesion(
        tipo: actividad.tipo,
        duracionSeg: actividad.duracionSeg,
      );
      _totalPausas += 1;
      await _almacen.guardarCache(claveTotal, <String, dynamic>{
        'total': _totalPausas,
      });
    } on ApiExcepcion catch (e) {
      if (e.esRed) {
        await _cola.encolarSesion(
          tipo: actividad.tipo,
          duracionSeg: actividad.duracionSeg,
        );
        _pendientes = (await _cola.sesionesPendientes()).length;
      } else {
        _error = e.mensaje;
      }
    }

    _avisar();
  }

  /// Reenvía las sesiones que se completaron sin conexión.
  Future<int> sincronizar() async {
    final pendientes = await _cola.sesionesPendientes();
    if (pendientes.isEmpty) return 0;

    var enviados = 0;
    for (final item in pendientes) {
      final tipo = item.payload['tipo']?.toString();
      final duracion = item.payload['duracion_seg'];

      if (tipo == null || !TipoRutina.validosEnApi.contains(tipo)) {
        await _cola.descartar(item.id);
        continue;
      }

      try {
        await _api.registrarSesion(
          tipo: tipo,
          duracionSeg: duracion is num ? duracion.toInt() : 0,
        );
        await _cola.descartar(item.id);
        enviados++;
      } on ApiExcepcion catch (e) {
        if (e.esRed) break;
        await _cola.descartar(item.id);
      }
    }

    if (enviados > 0) {
      _totalPausas += enviados;
      await _almacen.guardarCache(claveTotal, <String, dynamic>{
        'total': _totalPausas,
      });
    }

    _pendientes = (await _cola.sesionesPendientes()).length;
    _avisar();
    return enviados;
  }

  Future<void> _guardarEstado() async {
    await _almacen.guardarCache(claveActivas, <String, dynamic>{
      'activas': _activas,
    });
  }

  Future<void> _cargarCompletadasHoy() async {
    final cache = await _almacen.leerCache('rutinas_hoy');
    final hoy = DateTime.now();
    final fecha = '${hoy.year}-${hoy.month}-${hoy.day}';

    if (cache != null && cache['fecha'] == fecha) {
      final n = cache['completadas'];
      _completadasHoy = n is num ? n.toInt() : 0;
    } else {
      _completadasHoy = 0;
    }
  }

  Future<void> _sumarCompletadaHoy() async {
    final hoy = DateTime.now();
    _completadasHoy += 1;
    await _almacen.guardarCache('rutinas_hoy', <String, dynamic>{
      'fecha': '${hoy.year}-${hoy.month}-${hoy.day}',
      'completadas': _completadasHoy,
    });
  }

  void limpiarError() {
    if (_error == null) return;
    _error = null;
    _avisar();
  }

  void _avisar() {
    if (_descartado) return;
    notifyListeners();
  }

  @override
  void dispose() {
    _descartado = true;
    super.dispose();
  }
}
